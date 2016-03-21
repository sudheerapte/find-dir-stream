"use strict";

var ostr = require('../find-dir-stream').createObjectStream("..");

ostr.on('data', (obj) => {
    if (obj.dir.match(/find\-dir\-stream/)) {
	console.log(obj.files.join(","));
    }
});
