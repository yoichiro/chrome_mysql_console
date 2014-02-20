"use strict";

var BinaryUtils = function() {
    this.constructor();
};

BinaryUtils.prototype = {
    constructor: function() {
        this.encoding = "utf-8";
    },
    arrayBufferToString: function(buf) {
        var array = new Uint8Array(buf);
        var string = TextDecoder(this.encoding).decode(array);
        return string;
    },
    stringToArrayBuffer: function(str) {
        var array = TextEncoder(this.encoding).encode(str);
        var buffer = new ArrayBuffer(array.length);
        var dataView = new DataView(buffer);
        for (var i = 0; i < array.length; i++) {
            dataView.setInt8(i, array[i]);
        }
        return buffer;
    },
    createUnit8Array: function(length) {
        var buffer = new ArrayBuffer(length);
        return new Uint8Array(buffer);
    }
};

var binaryUtils = new BinaryUtils();
