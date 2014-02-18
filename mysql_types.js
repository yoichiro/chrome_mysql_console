"use strict";

var MySQLTypes = function() {
};

MySQLTypes.prototype = {
    createFixedLengthInteger: function(value, length) {
        var buffer = new ArrayBuffer(4);
        var view = new DataView(buffer);
        view.setUint32(0, value, true);
        var array = new Uint8Array(buffer);
        var subarray = array.subarray(0, length);
        return subarray;
    },
    createLengthEncodedString: function(value) {
        var buffer = binaryUtils.stringToArrayBuffer(value);
        var view = new Uint8Array(buffer);
        var length = view.length;
        var header = this.createLengthEncodedInteger(length);
        var result = new Uint8Array(header.length + view.length);
        result.set(header, 0);
        result.set(view, header.length);
        return result;
    },
    createNullEndValue: function(buffer) {
        var view = new Uint8Array(buffer);
        var result = new Uint8Array(view.length + 1);
        result.set(view, 0);
        return result;
    },
    createLengthEncodedInteger: function(value) {
        if (value == null) {
            var result = new Uint8Array(1);
            result[0] = 0xFB;
            return result;
        }
        if (0 <= value && value <= 0xFA) {
            var result = new Uint8Array(1);
            result[0] = value;
            return result;
        }
        var buffer = new ArrayBuffer(4);
        var view = new DataView(buffer);
        view.setUint32(0, value, false); // 64bit not supported
        var array = new Uint8Array(buffer);
        var length = 4;
        for (var i = 0; i < array.length; i++) {
            if (array[i] != 0) {
                length -= i;
                break;
            }
        }
        if (value >= 0xFB && length == 2) {
            var result = new Uint8Array(3);
            result[0] = 0xFC;
            for (var i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        } else if (length == 3) {
            var result = new Uint8Array(4);
            result[0] = 0xFD;
            for (var i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        } else {
            var result = new Uint8Array(9);
            result[0] = 0xFE;
            for (var i = 0; i < length; i++) {
                result[i + 1] = array[array.length - 1 - i];
            }
            return result;
        }
    },
    createNullEndString: function(value) {
        var buffer = binaryUtils.stringToArrayBuffer(value);
        return this.createNullEndValue(buffer);
    },
    getAsciiNullEndString: function(buffer, offset) {
        var view = new Uint8Array(buffer);
        for (var pos = offset; pos < view.length; pos++) {
            if (view[pos] == 0) {
                break;
            }
        }
        var targetBuffer = new Uint8Array(view.subarray(offset, pos));
        var result = binaryUtils.arrayBufferToString(targetBuffer.buffer);
        return {result: result, nextPosition: pos + 1};
    },
    getAsciiFixedLengthString: function(buffer, offset, length) {
        var array = new Uint8Array(buffer);
        var targetBuffer = new Uint8Array(array.subarray(offset, offset + length));
        var result = binaryUtils.arrayBufferToString(targetBuffer.buffer);
        return result;
    },
    getFixedLengthInteger: function(buffer, offset, length) {
        var source = new Uint8Array(buffer);
        var subarray = source.subarray(offset, offset + length);
        var copied = new Uint8Array(4);
        copied.set(subarray, 0);
        var view = new DataView(copied.buffer, 0, 4);
        var result = view.getUint32(0, true);
        return result;
    },
    getLengthEncodedInteger: function(buffer, offset) {
        var array = new Uint8Array(buffer);
        var first = array[offset];
        if (first == 0xFB) {
            return {result: null, nextPosition: offset + 1};
        } else if (first <= 0xFA) {
            return {result: first, nextPosition: offset + 1};
        }
        var length = 0;
        if (first == 0xFC) {
            length = 2;
        } else if (first == 0xFD) {
            length = 3;
        } else {
            length = 8;
        }
        var subarray = array.subarray(offset + 1, offset + 1 + length);
        var resultBuffer = new ArrayBuffer(8);
        var resultArray = new Uint8Array(resultBuffer);
        for (var i = 0; i < subarray.length; i++) {
            resultArray[i] = subarray[i];
        }
        var resultView = new DataView(resultBuffer);
        return resultView.getInt32(0, true); // Currently 64bit not supported
    }
};

var mySQLTypes = new MySQLTypes();
