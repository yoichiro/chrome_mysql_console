var Console = function() {
    this.constructor();
};

Console.prototype = {
    constructor: function() {
        this.assignEventHandlers();
    },
    assignEventHandlers: function() {
        $("#query").keypress(function(evt) {
            if (evt.keyCode == 13) {
                this.onEnterQuery();
            }
        }.bind(this));
        $("#executeQuery").click(this.onClickExecuteQuery.bind(this));
    },
    start: function() {
        $("#query").focus();
    },
    onEnterQuery: function() {
        this.executeQuery();
    },
    onClickExecuteQuery: function() {
        this.executeQuery();
    },
    executeQuery: function() {
        var query = $("#query").val();
        $("#query").val("");
        this.output(query);
        if (query.match("^connect")) {
            this.connect(query);
        } else if (query.match("^disconnect")) {
            this.disconnect();
        } else {
            this._executeQuery(query);
        }
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
            this.output("Connecting... host=" + host + " port=" + port, false);
            mySQLClient.login(host, Number(port), username, password, function(result) {
                if (result.isSuccess()) {
                    this.output("Connected.", true);
                } else {
                    this.output("MySQL sent this error: " + result.errorMessage, true);
                }
            }.bind(this), function(errorCode) {
                this.output("Connection failed: " + errorCode, true);
            }.bind(this));
        }
    },
    disconnect: function() {
        mySQLClient.logout(function(result) {
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
        for (i = 0; i < columnDefinitions.length; i++) {
            var row = "|";
            var name = columnDefinitions[i].name;
            row += " " + name;
            for (j = 0; j < columnLengths[i] - name.length; j++) {
                row += " ";
            }
            row += " |";
            this.output(row, false);
        }
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
        $(".outputPanel").append("<pre>" + this.escape(text) + "</pre>");
        if (outputReady) {
            this.ready();
        }
    },
    ready: function() {
        $(".outputPanel").append("<br />");
        this.output("Ready>");
    },
    escape: function(text) {
        return $('<div />').text(text).html();
    }
};

$(document).ready(function() {
    new Console().start();
});
