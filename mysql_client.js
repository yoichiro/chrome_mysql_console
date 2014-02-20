"use strict";

var MySQLClient = function() {
};

MySQLClient.prototype = {
    login: function(host, port, username, password, callback, errorCallback) {
        mySQLCommunication.connect(host, port, function(result) {
            if (result == 0) {
                this._handshake(username, password, callback);
            } else {
                errorCallback(result);
            }
        }.bind(this));
    },
    logout: function(callback) {
        mySQLCommunication.disconnect(callback);
    },
    query: function(
        queryString, resultsetCallback, noResultsetCallback, errorCallback) {
        mySQLCommunication.resetSequenceNumber();
        var queryRequest = mySQLProtocol.generateQueryRequest(queryString);
        var queryPacket = mySQLCommunication.createPacket(queryRequest.buffer);
        mySQLCommunication.writePacket(queryPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                mySQLProtocol.parseQueryResultPacket(packet, function(result) {
                    if (result.isSuccess() && result.hasResultset()) {
                        var columnCount = result.columnCount;
                        mySQLCommunication.readPluralPackets(columnCount, function(packets) {
                            var columnDefinitions = new Array();
                            for (var i = 0; i < packets.length; i++) {
                                columnDefinitions.push(
                                    mySQLProtocol.parseColumnDefinitionPacket(packets[i]));
                            }
                            mySQLCommunication.readPacket(function(packet) {
                                var eofResult = mySQLProtocol.parseEofPacket(packet);
                                // TODO Check EofResult
                                this._readResultsetRows(new Array(), function(resultsetRows) {
                                    resultsetCallback(columnDefinitions, resultsetRows);
                                }.bind(this));
                            }.bind(this));
                        }.bind(this));
                    } else if (result.isSuccess() && !result.hasResultset()) {
                        noResultsetCallback(result);
                    } else {
                        errorCallback(result);
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    getDatabases: function(callback, errorCallback) {
        this.query("SHOW DATABASES", function(columnDefinitions, resultsetRows) {
            var databases = new Array();
            for (var i = 0; i < resultsetRows.length; i++) {
                databases.push(resultsetRows[i].values[0]);
            }
            callback(databases);
        }.bind(this), function(result) {
            // TODO Write error process
            console.log("This callback function never be called.");
        }.bind(this), function(result) {
            errorCallback(result);
        }.bind(this));
    },
    initDB: function(schemaName, callback) {
        mySQLCommunication.resetSequenceNumber();
        var initDBRequest = mySQLProtocol.generateInitDBRequest(schemaName);
        var initDBPacket = mySQLCommunication.createPacket(initDBRequest.buffer);
        mySQLCommunication.writePacket(initDBPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                var result = mySQLProtocol.parseOkErrResultPacket(packet);
                callback(result);
            }.bind(this));
        }.bind(this));
    },
    _handshake: function(username, password, callback) {
        mySQLCommunication.readPacket(function(packet) {
            var initialHandshakeRequest =
                    mySQLProtocol.parseInitialHandshakePacket(packet);
            var passwordHash =
                    mySQLProtocol.generatePasswordHash(initialHandshakeRequest, password);
            var handshakeResponse =
                    mySQLProtocol.generateHandshakeResponse(
                        initialHandshakeRequest, username, passwordHash);
            var handshakeResponsePacket =
                    mySQLCommunication.createPacket(handshakeResponse.buffer);
            mySQLCommunication.writePacket(handshakeResponsePacket, function(writeInfo) {
                mySQLCommunication.readPacket(function(packet) {
                    var result = mySQLProtocol.parseOkErrResultPacket(packet);
                    callback(result);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    _readResultsetRows: function(result, callback) {
        mySQLCommunication.readPacket(function(packet) {
            var eofResult = mySQLProtocol.parseEofPacket(packet);
            if (eofResult) {
                callback(result);
            } else {
                var row = mySQLProtocol.parseResultsetRowPacket(packet);
                result.push(row);
                this._readResultsetRows(result, callback);
            }
        }.bind(this));
    }
};

var mySQLClient = new MySQLClient();
