/*
 * Copyright (c) 2014 Yoichiro Tanaka. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var SSLConfigurationDialog = function(parent) {
    this.constructor(parent);
};

SSLConfigurationDialog.prototype = {
    constructor: function(parent) {
        this.parent = parent;
        this.host = null;
        this.port = null;
        this.username = null;
        this.password = null;
        this.callback = null;
        this.okClicked = false;
        this.assignEventHandlers();
    },
    assignEventHandlers: function() {
        $("#sslConfigDialog").on("hidden.bs.modal", function(e) {
            $("#query").removeAttr("disabled");
            if (!this.okClicked) {
                this.parent.output("", true);
            }
        }.bind(this));
        $("#btnConnectWithSSL").on("click", function(e) {
            this.onClickConnectWithSSLButton();
        }.bind(this));
    },
    show: function(host, port, username, password, callback) {
        this.okClicked = false;
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.callback = callback;
        $("#ca-cert").val("");
        $("#check-cn").attr("checked", false);
        $("#query").attr("disabled","disabled");
        $("#sslConfigDialog").modal("show");
    },
    onClickConnectWithSSLButton: function() {
        $("#sslConfigDialog").modal("hide");
        this.okClicked = true;
        this.callback($("#ca-cert").val(), $("#check-cn:checked").val());
    }
};

var Console = function() {
    this.constructor();
};

Console.prototype = {
    constructor: function() {
        MySQL.communication.setSocketImpl(new MySQL.ChromeSocket2());
        this.prompt = "mysql";
        this.assignEventHandlers();
        this.historyPos = 0;
        this.sslConfigurationDialog = new SSLConfigurationDialog(this);
    },
    assignEventHandlers: function() {
        $("#query").keydown(function(evt) {
            if (evt.keyCode === 13) {
                this.onEnterQuery();
                this.historyPos = 0;
            } else if (evt.keyCode === 38) {
                this.showPreviousQuery();
            } else if (evt.keyCode === 40) {
                this.showNextQuery();
            } else {
                this.historyPos = 0;
            }
        }.bind(this));
        $(window).resize(function(evt) {
            this.onResizeWindow();
        }.bind(this));
        chrome.app.window.onClosed.addListener(function() {
            this.disconnect();
        }.bind(this));
    },
    start: function() {
        var manifest = chrome.runtime.getManifest();
        this.output("Welcome to " + manifest.name + " " + manifest.version, false);
        this.output("First, connect to DB with the following command:", false);
        this.output("> login [host] [port] [username] [password]", false);
        this.output("> login-ssl [host] [port] [username] [password]", true);
        this.onResizeWindow();
        this.applyFont();
        $("#query").focus();
    },
    applyFont: function() {
        chrome.storage.local.get(["fontSize", "fontColor", "bgColor"], function(items) {
            var fontSize = items.fontSize;
            if (fontSize) {
                $("#outputPanel").css("font-size", fontSize);
            }
            var fontColor = items.fontColor;
            if (fontColor) {
                $("#outputPanel").css("color", fontColor);
            }
            var bgColor = items.bgColor;
            if (bgColor) {
                $("#outputPanel").css("background-color", bgColor);
            }
        }.bind(this));
    },
    onResizeWindow: function() {
        $("#outputPanel").height($(window).height() - 35);
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
        } else if (query.match("^exit") || query.match("^quit")) {
            this.quit();
        } else if (query.match("^about") || query.match("^version")) {
            this.aboutMe();
        } else if (query.match("^new")) {
            this.createNewWindow();
        } else if (query.match("^help")) {
            this.help();
        } else if (query.match("^statistics")) {
            this.statistics();
        } else if (query.match("set option")) {
            this.setOption(query);
        } else {
            this._executeQuery(query);
        }
    },
    applyOutputPanelCss: function(css, name, value) {
        $("#outputPanel").css(css, value);
        var params = {};
        params[name] = value;
        chrome.storage.local.set(params);
    },
    setOption: function(query) {
        var split = query.split(" ");
        if (split.length === 2) {
            this.output("Invalid command.", true);
        } else {
            var name = split[2];
            if (name === "font-size") {
                var fontSize = Number(split[3]);
                if (fontSize) {
                    this.applyOutputPanelCss("font-size", "fontSize", fontSize);
                }
                this.ready();
                return;
            } else if (name === "font-color") {
                var fontColor = split[3];
                if (fontColor) {
                    this.applyOutputPanelCss("color", "fontColor", fontColor);
                }
                this.ready();
                return;
            } else if (name === "bg-color") {
                var bgColor = split[3];
                if (bgColor) {
                    this.applyOutputPanelCss("background-color", "bgColor", bgColor);
                }
                this.ready();
                return;
            } else if (name === "reset") {
                this.applyOutputPanelCss("font-size", "fontSize", 14);
                this.applyOutputPanelCss("color", "fontColor", "white");
                this.applyOutputPanelCss("background-color", "bgColor", "black");
            }
            this.output("Invalid command.", true);
        }
    },
    help: function() {
        this.output(" ", false);
        this.output("You can use the following commands provided by this application:", false);
        this.output("  login: Connect and logged in to MySQL server.", false);
        this.output("         login [host] [port] [username] [password]", false);
        this.output("  login-ssl: Connect and logged in to MySQL server with TLS.", false);
        this.output("         login-ssl [host] [port] [username] [password]", false);
        this.output("  statistics: Show a statistics regarding connected server.", false);
        this.output("  logout: logged out and disconnect from MySQL server.", false);
        this.output("  exit, quit: Close this window.", false);
        this.output(" ", false);
        this.output("  new: Open a new window.", false);
        this.output(" ", false);
        this.output("  set option font-size [pt]: Change font size.", false);
        this.output("  set option font-color [color]: Change font color.", false);
        this.output("  set option bg-color [color]: Change background color.", false);
        this.output("  set option reset: Apply default settings.", false);
        this.output(" ", false);
        this.output("  about, version: Show an information about this application.", false);
        this.output("  help: Show this message.", true);
    },
    createNewWindow: function() {
        this.output("Open new console.", true);
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            backgroundPage.createWindow();
        });
    },
    aboutMe: function() {
        var manifest = chrome.runtime.getManifest();
        this.output(" ", false);
        this.output(manifest.name + " " + manifest.version, false);
        this.output("Copyright (c) Yoichiro Tanaka 2014. All rights reserved.", false);
        this.output("Apache License 2.0(http://www.apache.org/licenses/LICENSE-2.0)", false);
        this.output(" ", false);
        this.output("If you want to know how to use, type the following command:", false);
        this.output("> help", false);
        this.output(" ", false);
        this.output("This software includes the work that is distributed in the Apache License 2.0", false);
        this.output("  stringencoding(https://code.google.com/p/stringencoding/)", false);
        this.output("This software includes the work that is distributed in the New BSD License", false);
        this.output("  CryptoJS(https://code.google.com/p/crypto-js/)", false);
        this.output("This software includes the work that is distributed in the MIT License", false);
        this.output("  jQuery(http://jquery.com/)", true);
    },
    quit: function() {
        window.close();
    },
    appendQueryToHistory: function(query) {
        chrome.storage.local.get("queryHistory", function(items) {
            var queryHistory = items.queryHistory;
            if (!queryHistory) {
                queryHistory = [];
            }
            var pos = queryHistory.indexOf(query);
            if (pos === -1) {
                queryHistory.push(query);
                if (queryHistory.length > 100) {
                    queryHistory.splice(0, 1);
                }
            } else {
                var newQueryHistory = queryHistory.filter(function(v, i) {
                    return v !== query;
                });
                newQueryHistory.push(query);
                queryHistory = newQueryHistory;
            }
            chrome.storage.local.set({queryHistory: queryHistory}, function() {
                this.historyPos = 0;
            }.bind(this));
        }.bind(this));
    },
    showPreviousQuery: function() {
        chrome.storage.local.get("queryHistory", function(items) {
            var queryHistory = items.queryHistory;
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
            var queryHistory = items.queryHistory;
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
    handleInitialHandshakeRequest: function(username, host, port, ssl) {
        return function(initialHandshakeRequest, result) {
            if (result.isSuccess()) {
                this.prompt = username + "@" + host + ":" + port;
                if (ssl) {
                    this.prompt += "(TLS)";
                }
                this.output("Connected.", false);
                this.output("MySQL Server: Server version " + initialHandshakeRequest.serverVersion + ", Protocol version " + initialHandshakeRequest.protocolVersion);
                this.output("If you want to disconnect from DB, then type the following command.", false);
                this.output("> logout", true);
            } else {
                this.output("MySQL sent this error: " + result.errorMessage, true);
            }
        }.bind(this);
    },
    connect: function(query) {
        var split = query.split(" ");
        if (split.length < 4) {
            this.output("Error: Invalid options to connect.", true);
        } else {
            var cmd = split[0];
            var host = split[1];
            var port = split[2];
            var username = split[3];
            var password;
            if (split.length === 4) {
                password = null;
            } else {
                password = split[4];
            }
            if (cmd === "login") {
                MySQL.client.login(
                    host, Number(port), username, password,
                    this.handleInitialHandshakeRequest(username, host, port, false),
                    function(errorCode) {
                        this.output("Connection failed: " + errorCode, true);
                        this.disconnect();
                    }.bind(this), function(result) {
                        this.output("Connection failed: " + result, true);
                        this.disconnect();
                    }.bind(this));
            } else if (cmd === "login-ssl") {
                this.sslConfigurationDialog.show(host, port, username, password, function(ca, checkCommonName) {
                    MySQL.client.loginWithSSL(
                        host, Number(port), username, password, ca, checkCommonName,
                        this.handleInitialHandshakeRequest(username, host, port, true),
                        function(errorCode) {
                            this.output("Connection failed: " + errorCode, true);
                            this.disconnect();
                        }.bind(this), function(result) {
                            this.output("Connection failed: " + result, true);
                            this.disconnect();
                        }.bind(this));
                }.bind(this));
            }
        }
    },
    disconnect: function() {
        MySQL.client.logout(function(result) {
            this.prompt = "mysql";
            this.output("Disconnected.", true);
        }.bind(this));
    },
    statistics: function() {
        MySQL.client.getStatistics(function(result) {
            this.output(result, true);
        }.bind(this), function(result) {
            console.log(result);
            this.output("Error: Retrieving statistics failed: " + result, true);
        }.bind(this));
    },
    _executeQuery: function(query) {
        MySQL.client.query(query, function(columnDefinitions, resultsetRows) {
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
        if (resultsetRows.length === 0) {
            this.output("Empty set", true);
            return;
        }
        var columnLengths = [];
        var valueLength;
        var i, j;
        for (i = 0; i < columnDefinitions.length; i++) {
            var length = columnDefinitions[i].name.length;
            for (j = 0; j < resultsetRows.length; j++) {
                var values = resultsetRows[j].values;
                valueLength =
                        (values[i] !== null) ? values[i].length : "NULL".length;
                if (length < valueLength) {
                    length = valueLength;
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
                if (value === null) {
                    value = "NULL";
                }
                row += " " + value;
                valueLength = 0;
                if (value !== null) {
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
        var p = document.createElement("p");
        p.appendChild(document.createTextNode(text));
        document.getElementById("outputPanel").appendChild(p);
        p.scrollIntoView(false);
        if (outputReady) {
            this.ready();
        }
    },
    ready: function() {
        var br = document.createElement("br");
        document.getElementById("outputPanel").appendChild(br);
        this.output(this.prompt + ">", false);
        $("#query").focus();
    },
    escape: function(text) {
        return $('<div />').text(text).html();
    }
};

$(document).ready(function() {
    new Console().start();
});
