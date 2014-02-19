"use strict";

var MySQLClient = function() {
};

MySQLClient.prototype = {
    login: function(host, port, username, password, callback) {
        mySQLCommunication.connect(host, port, function(result) {
            if (result == 0) {
                this._handshake(username, password, callback);
            } else {
                // TODO Write error process
                console.log("Error: result=" + result);
            }
        }.bind(this));
    },
    logout: function(callback) {
        mySQLCommunication.disconnect(callback);
    },
    query: function(queryString, callback) {
        mySQLCommunication.resetSequenceNumber();
        var queryRequest = mySQLProtocol.generateQueryRequest(queryString);
        var queryPacket = mySQLCommunication.createPacket(queryRequest.buffer);
        mySQLCommunication.writePacket(queryPacket, function(writeInfo) {
            mySQLCommunication.readPacket(function(packet) {
                mySQLProtocol.parseQueryResultPacket(packet, function(columnCount) {
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
                                callback(columnDefinitions, resultsetRows);
                            }.bind(this));
                        }.bind(this));
                    }.bind(this));
                }.bind(this), function(errResult) {
                    // TODO Write error process
                    console.log(errResult);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    getDatabases: function(callback) {
        this.query("SHOW DATABASES", function(columnDefinitions, resultsetRows) {
            var databases = new Array();
            for (var i = 0; i < resultsetRows.length; i++) {
                databases.push(resultsetRows[i].values[0]);
            }
            callback(databases);
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
                    var result = mySQLProtocol.parseHandshakeResultPacket(packet);
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
