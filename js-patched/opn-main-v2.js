// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

'use strict';
var opn = require('./index.js');
var child_process = require('child_process');
var path = require('path');

function escapePath(path) {
  return '"' + path + '"'; // " Can escape paths with spaces in OS X, Windows, and *nix
}

function launchDevTools() {
    var customDebugger = process.env.REACT_DEBUGGER;
    var projectPath = path.normalize(path.join(__dirname, "..", "..", "..", ".."));
    var command = customDebugger + ' ' + escapePath(projectPath);
    console.log('Starting custom debugger by executing: ' + command);
    child_process.exec(command, function (error, stdout, stderr) {
      if (error !== null) {
        console.log('Error while starting custom debugger: ' + error);
      }
    });
}

module.exports = function(target, opts, cb) {
    if (process.env.REACT_DEBUGGER) {
        launchDevTools();
        return;
    }

    return opn(target, opts, cb);
};
