"use strict";

var Test = function() {
    this.constructor();
};

Test.prototype = {
    constructor: function() {
        this.socketId = null;
    },
    start: function() {
        console.log("Test#start() called.");
        this.assignEventHandlers();
    },
    assignEventHandlers: function() {
        $("#btnConnect").click(this.onClickConnect.bind(this));
        $("#btnDestroy").click(this.onClickDestroy.bind(this));
        $("#btnRead").click(this.onClickRead.bind(this));
        $("#btnReadPacket").click(this.onClickReadPacket.bind(this));
        $("#btnInitialHandshake").click(this.onClickInitialHandshake.bind(this));
    },
    onClickConnect: function(evt) {
        console.log("Test#onClickConnect() called.");
        chrome.socket.create("tcp", {}, function(createInfo) {
            this.socketId = createInfo.socketId;
            $("#socketId").text(this.socketId);
            chrome.socket.connect(
                this.socketId, "127.0.0.1", 3306, this.onConnect.bind(this));
        }.bind(this));
    },
    onConnect: function(result) {
        console.log("Test#onConnect() called.");
        console.log(result);
    },
    onClickDestroy: function(evt) {
        console.log("Test#onClickDestroy() called.");
        chrome.socket.disconnect(this.socketId);
        chrome.socket.destroy(this.socketId);
        $("#socketId").text("");
        this.socketId = null;
    },
    onClickRead: function(evt) {
        console.log("Test#onClickRead() called.");
        chrome.socket.read(this.socketId, 1, function(readInfo) {
            console.log(readInfo.resultCode);
            var data = new Int8Array(readInfo.data);
            console.log(data[0]);
        }.bind(this));
    },
    onClickReadPacket: function(evt) {
        console.log("Test#onClickReadPacket() called.");
        this.readPacket(function(packet) {
            console.log(packet);
            console.log(new Uint8Array(packet.data));
        }.bind(this));
    },
    onClickInitialHandshake: function(evt) {
        console.log("Test#onClickInitialHandshake() called.");
        this.readPacket(function(packet) {
            var initialHandshakeRequest = this.parseInitialHandshakePacket(packet);
            console.log(initialHandshakeRequest);
            var passwordHash =
                    this.generatePasswordHash(initialHandshakeRequest, "pass");
            var handshakeResponse =
                    this.generateHandshakeResponse(
                        initialHandshakeRequest, passwordHash);
            console.log(handshakeResponse);
            var handshakeResponsePacket = new Packet(1, handshakeResponse.buffer);
            this.writePacket(handshakeResponsePacket, function(writeInfo) {
                this.readPacket(function(packet) {
                    console.log(new Uint8Array(packet.data));
                    var result = this.parseResultPacket(packet);
                    console.log(result);
                    
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    generateHandshakeResponse: function(initialHandshakeRequest, passwordHash) {
        var capabilityFlagsValue =
                0x00001
                | 0x00200
                | 0x08000
                | 0x80000;
        var capabilityFlags = mySQLTypes.createFixedLengthInteger(capabilityFlagsValue, 4);
        var maxPacketSize = mySQLTypes.createFixedLengthInteger(0xFFFFFF, 4); // About 16MB
        var characterSet = mySQLTypes.createLengthEncodedInteger(0x21); // utf8_general_ci
        var username = mySQLTypes.createNullEndString("yoichiro");
        var passwordHashLength = mySQLTypes.createLengthEncodedInteger(passwordHash.length);
        var authPluginName = mySQLTypes.createNullEndString(initialHandshakeRequest.authPluginName);
        var length =
                capabilityFlags.length
                + maxPacketSize.length
                + characterSet.length
                + 23
                + username.length
                + passwordHashLength.length
                + passwordHash.length
                + authPluginName.length;
        var buffer = new ArrayBuffer(length);
        var array = new Uint8Array(buffer);
        var offset = 0;
        array.set(capabilityFlags, offset);
        offset += capabilityFlags.length;
        array.set(maxPacketSize, offset);
        offset += maxPacketSize.length;
        array.set(characterSet, offset);
        offset += characterSet.length;
        offset += 23;
        array.set(username, offset);
        offset += username.length;
        array.set(passwordHashLength, offset);
        offset += passwordHashLength.length;
        array.set(passwordHash, offset);
        offset += passwordHash.length;
        array.set(authPluginName, offset);
        return array;
    },
    generatePasswordHash: function(initialHandshakeRequest, passwordString) {
        var password1Array = hasher.sha1ToUint8Array(passwordString);
        var password2Array = hasher.sha1Uint8ArrayToUint8Array(password1Array);
        var authPluginDataPart1 = initialHandshakeRequest.authPluginDataPart1;
        var authPluginDataPart2 = initialHandshakeRequest.authPluginDataPart2;
        var sourceBuffer = new ArrayBuffer(authPluginDataPart1.length
                                           + authPluginDataPart2.length
                                           + password2Array.length);
        var sourceView = new Uint8Array(sourceBuffer);
        sourceView.set(authPluginDataPart1, 0);
        sourceView.set(authPluginDataPart2, authPluginDataPart1.length);
        sourceView.set(password2Array,
                       authPluginDataPart1.length + authPluginDataPart2.length);
        var hashedSourceArray = hasher.sha1Uint8ArrayToUint8Array(sourceView);
        var result = new Uint8Array(password1Array.length);
        for (var i = 0; i < result.length; i++) {
            result[i] = password1Array[i] ^ hashedSourceArray[i];
        }
        return result;
    },
    parseResultPacket: function(packet) {
        console.log("Test#parseResultPacket() called.");
        var data = packet.data;
        var header = mySQLTypes.getFixedLengthInteger(data, 0, 1);
        if (header == 0) {
            // Succeeded
            var affectedRowsResult = mySQLTypes.getLengthEncodedInteger(data, 1);
            var affectedRows = affectedRowsResult.result;
            var lastInsertIdResult = mySQLTypes.getLengthEncodedInteger(data, affectedRowsResult.nextPosition);
            var lastInsertId = lastInsertIdResult.result;
            var statusFlags = mySQLTypes.getFixedLengthInteger(data, lastInsertIdResult.nextPosition, 2);
            var warnings = mySQLTypes.getFixedLengthInteger(data, lastInsertIdResult.nextPosition + 2, 2);
            var info = "";
            if (packet.dataLength > lastInsertIdResult.nextPosition + 4) {
                var length = packet.dataLength - lastInsertIdResult.nextPosition + 4;
                info = myQLTypes.getAsciiFixedLengthString(data, lastInsertIdResult.nextPosition + 4, length);
            }
            return new OkResult(affectedRows, lastInsertId, statusFlags, warnings, info);
        } else if (header == 0xFF) {
            // Error
            var errorCode = mySQLTypes.getFixedLengthInteger(data, 1, 2);
            var sqlStateMarker = mySQLTypes.getAsciiFixedLengthString(data, 3, 1);
            var sqlState = mySQLTypes.getAsciiFixedLengthString(data, 4, 5);
            var errorMessageLength = packet.dataLength - 9;
            var errorMessage = mySQLTypes.getAsciiFixedLengthString(data, 9, errorMessageLength);
            return new ErrResult(errorCode, sqlStateMarker, sqlState, errorMessage);
        } else {
            // TODO: Unknown
            return null;
        }
    },
    parseInitialHandshakePacket: function(packet) {
        console.log("Test#parseInitialHandshakePacket() called.");
        var data = packet.data;
        var offset = 0;
        var protocolVersion = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var serverVersionResult = mySQLTypes.getAsciiNullEndString(data, offset);
        var serverVersion = serverVersionResult.result;
        offset = serverVersionResult.nextPosition;
        var connectionId = mySQLTypes.getFixedLengthInteger(data, offset, 4);
        offset += 4;
        var authPluginDataPart1 = new Uint8Array(data, offset, 8);
        offset += 8 + 1; // Skip 1 byte
        var capabilityFlag1 = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var characterSet = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        var statusFlags = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var capabilityFlag2 = mySQLTypes.getFixedLengthInteger(data, offset, 2);
        offset += 2;
        var authPluginDataLen = mySQLTypes.getFixedLengthInteger(data, offset++, 1);
        offset += 10; // Skip 10 bytes
        var authPluginDataPart2 = new Uint8Array(data, offset, 12);
        offset += 12 + 1; // Skip 1 byte
        var authPluginNameResult = mySQLTypes.getAsciiNullEndString(data, offset);
        var authPluginName = authPluginNameResult.result;
        return new InitialHandshakeRequest(protocolVersion,
                                           serverVersion,
                                           connectionId,
                                           authPluginDataPart1,
                                           capabilityFlag1,
                                           characterSet,
                                           statusFlags,
                                           capabilityFlag2,
                                           authPluginDataLen,
                                           authPluginDataPart2,
                                           authPluginName);
    },
    readPacket: function(callback) {
        console.log("Test#readPacket() called.");
        this.readFixedLongValue(3, function(dataLength) {
            this.readFixedLongValue(1, function(sequenceNumber) {
                this.read(dataLength, function(readInfo) {
                    var packet = new Packet(sequenceNumber, readInfo.data);
                    callback(packet);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    writePacket: function(packet, callback) {
        console.log("Test#writePacket() called.");
        chrome.socket.write(this.socketId, packet.getArrayBuffer(), function(writeInfo) {
            console.log(writeInfo);
            var bytesWritten = writeInfo.bytesWritten;
            if (bytesWritten > 0) {
                callback(writeInfo);
            } else {
                // TODO: Write error process
            }
        }.bind(this));
    },
    readFixedLongValue: function(length, callback) {
        this.read(length, function(readInfo) {
            var result = mySQLTypes.getFixedLengthInteger(readInfo.data, 0, length);
            callback(result);
        }.bind(this));
    },
    read: function(length, callback) {
        console.log("Test#read() called.");
        chrome.socket.read(this.socketId, length, function(readInfo) {
            var resultCode = readInfo.resultCode;
            console.log(
                "readInfo.resultCode=" + resultCode + " data=" + readInfo.data);
            if (resultCode > 0) {
                callback(readInfo);
            } else {
                // TODO: Write error process
            }
        }.bind(this));
    },
    output: function(array) {
        for (var i = 0; i < array.length; i++) {
            console.log(array[i]);
        }
    }
};



$(document).ready(function() {
    new Test().start();
});
