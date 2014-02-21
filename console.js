var Console = function() {
    this.constructor();
};

Console.prototype = {
    constructor: function() {
        this.prompt = "mysql";
        this.assignEventHandlers();
        this.historyPos = 0;
    },
    assignEventHandlers: function() {
        $("#query").keydown(function(evt) {
            if (evt.keyCode == 13) {
                this.onEnterQuery();
                this.historyPos = 0;
            } else if (evt.keyCode == 38) {
                this.showPreviousQuery();
            } else if (evt.keyCode == 40) {
                this.showNextQuery();
            } else {
                this.historyPos = 0;
            }
        }.bind(this));
    },
    start: function() {
        this.output("Welcome to Chrome MySQL Console!", false);
        this.output("First, connect to DB with the following command:", false);
        this.output("> login [host] [port] [username] [password]", true);
        $("#query").focus();
    },
    onEnterQuery: function() {
        var query = $("#query").val();
        $("#query").val("");
        this.output(query);
        this.appendQueryToHistory(query);
        if (query.match("^login")) {
            this.connect(query);
        } else if (query.match("^logout")) {
            this.disconnect();
        } else {
            this._executeQuery(query);
        }
    },
    appendQueryToHistory: function(query) {
        chrome.storage.local.get("queryHistory", function(items) {
            var queryHistory = items["queryHistory"];
            if (!queryHistory) {
                queryHistory = new Array();
            }
            if (queryHistory.indexOf(query) == -1) {
                queryHistory.push(query);
                if (queryHistory.length > 30) {
                    queryHistory.splice(0, 1);
                }
            }
            chrome.storage.local.set({queryHistory: queryHistory}, function() {
                this.historyPos = 0;
            }.bind(this));
        }.bind(this));
    },
    showPreviousQuery: function() {
        chrome.storage.local.get("queryHistory", function(items) {
            var queryHistory = items["queryHistory"];
            if (queryHistory) {
                if (this.historyPos + 1 <= queryHistory.length) {
                    this.historyPos += 1;
                }
                var pos = queryHistory.length - this.historyPos;
                $("#query").val(queryHistory[pos]);
                $("#query").select();
            }
        }.bind(this));
    },
    showNextQuery: function() {
        chrome.storage.local.get("queryHistory", function(items) {
            var queryHistory = items["queryHistory"];
            if (queryHistory) {
                if (this.historyPos > 0) {
                    this.historyPos -= 1;
                }
                var pos = queryHistory.length - this.historyPos;
                $("#query").val(queryHistory[pos]);
                $("#query").select();
            }
        }.bind(this));
    },
    connect: function(query) {
        var split = query.split(" ");
        if (split.length != 5) {
            this.output("Error: Invalid options to connect.", true);
        } else {
            var host = split[1];
            var port = split[2];
            var username = split[3];
            var password = split[4];
            mySQLClient.login(host, Number(port), username, password, function(result) {
                if (result.isSuccess()) {
                    this.prompt = host + ":" + port;
                    this.output("Connected.", false);
                    this.output("If you want to disconnect from DB, then type the following command.", false);
                    this.output("> logout", true);
                } else {
                    this.output("MySQL sent this error: " + result.errorMessage, true);
                }
            }.bind(this), function(errorCode) {
                this.output("Connection failed: " + errorCode, true);
            }.bind(this), function(result) {
                this.output("Connection failed: " + result, true);
            }.bind(this));
        }
    },
    disconnect: function() {
        mySQLClient.logout(function(result) {
            this.prompt = "mysql";
            this.output("Disconnected.", true);
        }.bind(this));
    },
    _executeQuery: function(query) {
        mySQLClient.query(query, function(columnDefinitions, resultsetRows) {
            this.outputResultset(columnDefinitions, resultsetRows);
        }.bind(this), function(result) {
            this.output("Query OK, " + result.affectedRows + " rows affected", true);
        }.bind(this), function(result) {
            console.log(result);
            this.output("Error: Query execution failed: " + result.errorMessage, true);
        }.bind(this), function(result) {
            console.log(result);
            this.output("Error: Query execution failed: " + result, true);
        }.bind(this));
    },
    outputResultset: function(columnDefinitions, resultsetRows) {
        console.log(columnDefinitions);
        console.log(resultsetRows);
        if (resultsetRows.length == 0) {
            this.output("Empty set", true);
            return;
        }
        var columnLengths = new Array();
        for (var i = 0; i < columnDefinitions.length; i++) {
            var length = columnDefinitions[i].name.length;
            for (var j = 0; j < resultsetRows.length; j++) {
                var values = resultsetRows[j].values;
                if (values[i] != null) {
                    if (length < values[i].length) {
                        length = values[i].length;
                    }
                }
            }
            columnLengths.push(length);
        }
        var border = "+";
        for (i = 0; i < columnDefinitions.length; i++) {
            for (j = 0; j < columnLengths[i] + 2; j++) {
                border += "-";
            }
            border += "+";
        }
        this.output(border, false);
        var row = "|";
        for (i = 0; i < columnDefinitions.length; i++) {
            var name = columnDefinitions[i].name;
            row += " " + name;
            for (j = 0; j < columnLengths[i] - name.length; j++) {
                row += " ";
            }
            row += " |";
        }
        this.output(row, false);
        this.output(border, false);
        for (i = 0; i < resultsetRows.length; i++) {
            row = "|";
            for (j = 0; j < resultsetRows[i].values.length; j++) {
                var value = resultsetRows[i].values[j];
                if (value == null) {
                    value = "NULL";
                }
                row += " " + value;
                var valueLength = 0;
                if (value != null) {
                    valueLength = value.length;
                }
                for (var k = 0; k < columnLengths[j] - valueLength; k++) {
                    row += " ";
                }
                row += " |";
            }
            this.output(row, false);
        }
        this.output(border, false);
        this.output(resultsetRows.length + " rows in set", true);
    },
    output: function(text, outputReady) {
        var pre = document.createElement("pre");
        pre.appendChild(document.createTextNode(text));
        document.getElementById("outputPanel").appendChild(pre);
        pre.scrollIntoView(false);
        if (outputReady) {
            this.ready();
        }
    },
    ready: function() {
        var br = document.createElement("br");
        document.getElementById("outputPanel").appendChild(br);
        this.output(this.prompt + ">", false);
    },
    escape: function(text) {
        return $('<div />').text(text).html();
    }
};

$(document).ready(function() {
    new Console().start();
});
