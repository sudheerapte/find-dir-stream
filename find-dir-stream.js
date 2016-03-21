"use strict";

/**
   @module(find-dir-stream)
   Directory walker like UNIX find(1), for node.js

   Lets you find all the files and directories under a given root,
   to perform arbitrary operations.

   Returns to you a readable stream in object mode, which sends one
   object at a time. Each object has two members:
       dir: a string containing the path of a directory
       path: an array containing filenames in that directory

   You create a readable stream by passing in the root directory.
   All the returned directories are descendants of this root dir,
   and their paths are relative to the root dir.

   Usage:

   var ostr = require('find-dir-stream').createObjectStream("/some/path");

   ostr.on('data', (obj) => { ...use obj.dir and obj.files array... });
   
 */

var fs = require('fs');
var stream = require('stream');
var Readable = require('stream').Readable;

function cbLater(cb) {
    if (cb) {
	setTimeout(cb, 0);
    }
}

module.exports = {
    createObjectStream: function(root) {
	let rs = stream.Readable({objectMode: true});
	setRootDir(rs, root);
	rs._read = function() {
	    continueIfPossible(rs);
	}
	return rs;
    }
}

function setRootDir(rs, rootDir) {
    rs._dirs = [ rootDir ];
    rs._dirsOutstanding = 0;
    rs._statOutstanding = 0;
}

function continueIfPossible(rs) {
    if (rs._statOutstanding > 0) { return; }
    if (rs._dirsOutstanding > 0) { return; }
    if (rs._dirs.length > 0) {
	processOneDirectory(rs);
	return;
    }
    rs.push(null);
}
    
function processOneDirectory(rs) {
    let dir = rs._dirs[0];
    rs._dirs.shift();
    rs._dirsOutstanding++;
    fs.readdir(dir, (er, list) => {
	rs._dirsOutstanding --;
	if (er) { console.error(er); }
	else {
	    rs._statOutstanding += list.length;
	    let obj = {dir: dir, files: list};
	    rs.push(obj);
	    if (list.length > 0) {
		statEachEntry(rs, list, dir);
	    } else {
		cbLater(() => { continueIfPossible(rs); });
	    }
	}
    });
}

function statEachEntry(rs, list, parent) {
    let path = require('path');
    list.forEach((e,i) => {
	let epath = path.join(parent, e);
	fs.stat(epath, (er,stats) => {
	    rs._statOutstanding --;
	    if (er) { console.error(er); }
	    else {
		if (stats.isDirectory()) {
		    rs._dirs.push(epath);
		}
		if (rs._statOutstanding <= 0) {
		    cbLater(() => { continueIfPossible(rs); });
		}
	    }
	});
    });
}
