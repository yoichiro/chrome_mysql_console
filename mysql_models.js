"use strict";

var Packet = function(sequenceNumber, buffer) {
    this.constructor(sequenceNumber, buffer);
};

Packet.prototype = {
    constructor: function(newSequenceNumber, buffer) {
        this.sequenceNumber = newSequenceNumber;
        this.data = buffer;
        this.dataLength = buffer.byteLength;
    },
    getArrayBuffer: function() {
        var result = new ArrayBuffer(4 + this.dataLength);
        var dataLengthArray = mySQLTypes.createFixedLengthInteger(this.dataLength, 3);
        var view = new Uint8Array(result);
        view.set(dataLengthArray, 0);
        view[3] = this.sequenceNumber;
        view.set(new Uint8Array(this.data), 4);
        return result;
    }
};

var InitialHandshakeRequest = function(protocolVersion,
                                      serverVersion,
                                      connectionId,
                                      authPluginDataPart1,
                                      capabilityFlag1,
                                      characterSet,
                                      statusFlags,
                                      capabilityFlag2,
                                      authPluginDataLen,
                                      authPluginDataPart2,
                                      authPluginName) {
    this.constructor(protocolVersion,
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
};

InitialHandshakeRequest.prototype = {
    constructor: function(newProtocolVersion,
                          newServerVersion,
                          newConnectionId,
                          newAuthPluginDataPart1,
                          newCapabilityFlag1,
                          newCharacterSet,
                          newStatusFlags,
                          newCapabilityFlag2,
                          newAuthPluginDataLen,
                          newAuthPluginDataPart2,
                          newAuthPluginName) {
        this.protocolVersion = newProtocolVersion;
        this.serverVersion = newServerVersion;
        this.connectionId = newConnectionId;
        this.authPluginDataPart1 = newAuthPluginDataPart1;
        this.capabilityFlag1 = newCapabilityFlag1;
        this.characterSet = newCharacterSet;
        this.statusFlags = newStatusFlags;
        this.capabilityFlag2 = newCapabilityFlag2;
        this.authPluginDataLen = newAuthPluginDataLen;
        this.authPluginDataPart2 = newAuthPluginDataPart2;
        this.authPluginName = newAuthPluginName;
    }
};

var OkResult = function(affectedRows, lastInsertId, statusFlags, warnings, info) {
    this.constructor(affectedRows, lastInsertId, statusFlags, warnings, info);
};

OkResult.prototype = {
    constructor: function(newAffectedRows, newLastInsertId, newStatusFlags, newWarnings, newInfo) {
        this.affectedRows = newAffectedRows;
        this.lastInsertId = newLastInsertId;
        this.statusFlags = newStatusFlags;
        this.warnings = newWarnings;
        this.info = newInfo;
    },
    isSuccess: function() {
        return true;
    }
};


var ErrResult = function(errorCode, sqlStateMarker, sqlState, errorMessage) {
    this.constructor(errorCode, sqlStateMarker, sqlState, errorMessage);
};

ErrResult.prototype = {
    constructor: function(newErrorCode, newSqlStateMarker, newSqlState, newErrorMessage) {
        this.errorCoe = newErrorCode;
        this.sqlStateMarker = newSqlStateMarker;
        this.sqlState = newSqlState;
        this.errorMessage = newErrorMessage;
    },
    isSuccess: function() {
        return false;
    }
};
