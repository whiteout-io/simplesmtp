if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    'use strict';

    return {
        connect: require("./simplesmtp-client"),
        createClientPool: require("./simplesmtp-pool")
    };
});