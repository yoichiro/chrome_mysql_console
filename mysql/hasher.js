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

var Hasher = function() {
};

Hasher.prototype = {
    sha1ToWordArray: function(source) {
        return CryptoJS.SHA1(source);
    },
    sha1ToUint8Array: function(source) {
        var wordArray = this.sha1ToWordArray(source);
        return this.wordArrayToUnit8Array(wordArray);
    },
    sha1Uint8ArrayToUint8Array: function(source) {
        var words = this.uint8ArrayToWords(source);
        var sourceWordArray = CryptoJS.lib.WordArray.create(words, source.length);
        return this.sha1ToUint8Array(sourceWordArray);
    },
    uint8ArrayToWords: function(typedArray) {
        var typedArrayByteLength = typedArray.length;
        var words = [];
        for (var i = 0; i < typedArrayByteLength; i++) {
            words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
        }
        return words;
    },
    wordArrayToUnit8Array: function(wordArray) {
        var buffer = new ArrayBuffer(wordArray.sigBytes);
        var view = new DataView(buffer, 0, buffer.length);
        for (var i = 0; i < wordArray.words.length; i++) {
            view.setInt32(i * 4, wordArray.words[i], false);
        }
        return new Uint8Array(buffer);
    }
};

var hasher = new Hasher();
