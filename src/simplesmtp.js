(function() {
    'use strict';

    if (typeof define !== 'undefined' && define.amd) {
        // AMD
        define(function(require) {
            var simeplesmtp = {};

            simeplesmtp.connect = require("./simplesmtp-client");
            simeplesmtp.createClientPool = require("./simplesmtp-pool");

            // the server was not yet ported...

            return simeplesmtp;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // node.js

        module.exports.createServer = require("./simplesmtp-server.js");
        module.exports.createSimpleServer = require("./simplesmtp-simpleserver.js");
        module.exports.connect = require("./simplesmtp-client.js");
        module.exports.createClientPool = require("./simplesmtp-pool.js");
    }

})();
