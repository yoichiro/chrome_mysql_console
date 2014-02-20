"use strict";

var MySQLCommunication = function() {
    this.constructor();
};

MySQLCommunication.prototype = {
    constructor: function() {
        this.socketId = null;
        this.nextSequenceNumber = 0;
    },
    connect: function(host, port, callback) {
        chrome.socket.create("tcp", {}, function(createInfo) {
            this.socketId = createInfo.socketId;
            chrome.socket.connect(
                this.socketId, host, port, function(result) {
                    callback(result);
                }.bind(this));
        }.bind(this));
    },
    disconnect: function(callback) {
        if (this.socket) {
            chrome.socket.disconnect(this.socketId);
            chrome.socket.destroy(this.socketId);
        }
        this.socketId = null;
        if (callback) {
            callback();
        }
    },
    isConnected: function() {
        return this.socketId != null;
    },
    readPacket: function(callback) {
        this.readFixedLongValue(3, function(dataLength) {
            this.readFixedLongValue(1, function(sequenceNumber) {
                this.incrementSequenceNumber(sequenceNumber);
                this.read(dataLength, function(readInfo) {
                    var packet = new Packet(sequenceNumber, readInfo.data);
                    callback(packet);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    readPluralPackets: function(count, callback) {
        this._readPluralPackets(0, count, new Array(), callback);
    },
    _readPluralPackets: function(current, count, result, callback) {
        this.readPacket(function(packet) {
            result.push(packet);
            current += 1;
            if (current < count) {
                this._readPluralPackets(current, count, result, callback);
            } else {
                callback(result);
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
        chrome.socket.read(this.socketId, length, function(readInfo) {
            var resultCode = readInfo.resultCode;
            if (resultCode > 0) {
                callback(readInfo);
            } else {
                // TODO: Write error process
                console.log("Error: readInfo.resultCode=" + resultCode
                            + " data=" + readInfo.data);
            }
        }.bind(this));
    },
    writePacket: function(packet, callback) {
        chrome.socket.write(this.socketId, packet.getArrayBuffer(), function(writeInfo) {
            var bytesWritten = writeInfo.bytesWritten;
            if (bytesWritten > 0) {
                callback(writeInfo);
            } else {
                // TODO: Write error process
                console.log("Error: writeInfo.bytesWritten=" + bytesWritten);
            }
        }.bind(this));
    },
    incrementSequenceNumber: function(sequenceNumber) {
        this.nextSequenceNumber = sequenceNumber + 1;
        if (this.nextSequenceNumber > 255) {
            this.nextSequenceNumber = 0;
        }
    },
    createPacket: function(buffer) {
        return new Packet(this.nextSequenceNumber, buffer);
    },
    resetSequenceNumber: function() {
        this.nextSequenceNumber = 0;
    }
};

var mySQLCommunication = new MySQLCommunication();
