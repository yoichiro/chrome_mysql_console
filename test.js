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
        $("#btnLogin").click(this.onClickLogin.bind(this));
        $("#btnLogout").click(this.onClickLogout.bind(this));
        $("#btnQuery").click(this.onClickQuery.bind(this));
        $("#btnDatabases").click(this.onClickDatabases.bind(this));
        $("#btnInitDB").click(this.onClickInitDB.bind(this));
    },
    onClickConnect: function(evt) {
        console.log("Test#onClickConnect() called.");
        mySQLCommunication.connect("127.0.0.1", 3306, this.onConnect.bind(this));
    },
    onConnect: function(result) {
        console.log("Test#onConnect() called.");
        console.log(result);
    },
    onClickDestroy: function(evt) {
        console.log("Test#onClickDestroy() called.");
        mySQLCommunication.disconnect();
    },
    onClickRead: function(evt) {
        console.log("Test#onClickRead() called.");
        mySQLCommunication.read(1, function(readInfo) {
            console.log(readInfo.resultCode);
            var data = new Int8Array(readInfo.data);
            console.log(data[0]);
        }.bind(this));
    },
    onClickReadPacket: function(evt) {
        console.log("Test#onClickReadPacket() called.");
        mySQLCommunication.readPacket(function(packet) {
            console.log(packet);
            console.log(new Uint8Array(packet.data));
        }.bind(this));
    },
    onClickInitialHandshake: function(evt) {
        console.log("Test#onClickInitialHandshake() called.");
        mySQLClient.handshake("yoichiro", "pass", function(result) {
            console.log(result);
        }.bind(this));
    },
    onClickLogin: function(evt) {
        console.log("Test#onClickLogin() called.");
        mySQLClient.login("127.0.0.1", 3306, "yoichiro", "pass", function(result) {
            console.log(result);
        }.bind(this), function(errorCode) {
            console.log(errorCode);
        }.bind(this));
    },
    onClickLogout: function(evt) {
        console.log("Test#onClickLogout() called.");
        mySQLClient.logout(function() {
            console.log("logout");
        }.bind(this));
    },
    onClickQuery: function(evt) {
        console.log("Test#onClickQuery() called.");
        var query = $("#query").val();
        mySQLClient.query(query, function(columnDefinitions, resultsetRows) {
            console.log(columnDefinitions);
            console.log(resultsetRows);
        }.bind(this), function(result) {
            console.log(result);
        }.bind(this), function(result) {
            console.log(result);
        }.bind(this));
    },
    onClickDatabases: function(evt) {
        console.log("Test#onClickDatabases() called.");
        mySQLClient.getDatabases(function(databases) {
            console.log(databases);
            $("#databases").html("");
            for (var i = 0; i < databases.length; i++) {
                $("#databases").append('<option value="' + databases[i] + '">' + databases[i] + "</option>");
            }
        }.bind(this), function(result) {
            console.log(result);
        }.bind(this));
    },
    onClickInitDB: function(evt) {
        console.log("Test#onClickInitDB() called.");
        var schemaName = $("#databases").val();
        mySQLClient.initDB(schemaName, function(result) {
            console.log(result);
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
