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
