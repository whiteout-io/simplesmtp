if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    'use strict';

    return {
        connect: require("./simplesmtp-client.js"),
        createClientPool: require("./simplesmtp-pool.js")
    };
});