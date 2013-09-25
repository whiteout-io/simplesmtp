if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    'use strict';

    var simplesmtp;

    if (typeof module === 'undefined' && !module.exports) {
        simplesmtp = {
            connect: require("./simplesmtp-client.js"),
            createClientPool: require("./simplesmtp-pool.js")
        };
    } else {
        simplesmtp = {
            createServer: require("./simplesmtp-server.js"),
            createSimpleServer: require("./simplesmtp-simpleserver.js"),
            connect: require("./simplesmtp-client.js"),
            createClientPool: require("./simplesmtp-pool.js")
        };
    }

    return simplesmtp;
});