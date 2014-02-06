var testCase = require('nodeunit').testCase,
    runClientMockup = require("rai").runClientMockup,
    simplesmtp = require(".."),
    smtpServer = require('../src/simplesmtp-server'),
    fs = require("fs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var PORT_NUMBER = 8397;

exports["General tests"] = {
    setUp: function (callback) {
        this.server = new smtpServer();
        this.server.listen(PORT_NUMBER, function(err){
            if(err){
                throw err;
            }else{
                callback();
            }
        });

    },

    tearDown: function (callback) {
        this.server.end(callback);
    },

    "Connect and setup": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER);

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    }
};

exports["Secure server"] = {
    setUp: function (callback) {
        this.server = new smtpServer({
            secureConnection: true
        });
        this.server.listen(PORT_NUMBER, function(err){
            if(err){
                throw err;
            }else{
                callback();
            }
        });

    },

    tearDown: function (callback) {
        this.server.end(callback);
    },

    "Connect and setup": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER, false, {
            secureConnection: true
        });

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Unsecure client should have timeout": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER, false, {
            secureConnection: false
        });

        client.once("idle", function(){
            test.ok(false);
        });

        client.on("error", function(err){
            test.equal(err.code, "ETIMEDOUT");
            client.close();
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    }
};

exports["Disabled EHLO"] = {
    setUp: function (callback) {
        this.server = new smtpServer({disableEHLO: true});
        this.server.listen(PORT_NUMBER, function(err){
            if(err){
                throw err;
            }else{
                callback();
            }
        });

    },

    tearDown: function (callback) {
        this.server.end(callback);
    },

    "Connect and setup": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    }
};

exports["Authentication needed"] = {
    setUp: function (callback) {
        this.server = new smtpServer({
            requireAuthentication: true
        });

        this.server.on("authorizeUser", function(envelope, user, pass, callback){
            callback(null, user=="test1" && pass == "test2");
        });

        this.server.listen(PORT_NUMBER, function(err){
            if(err){
                throw err;
            }else{
                callback();
            }
        });

    },

    tearDown: function (callback) {
        this.server.end(callback);
    },

    "Auth success": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER, false, {
            auth: {
                user: "test1",
                pass: "test2"
            }
        });

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Auth fails": function(test){
        var client = simplesmtp.createClient(PORT_NUMBER, false, {
            auth: {
                user: "test3",
                pass: "test4"
            }
        });

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(false); // should not occur
            client.close();
        });

        client.on("error", function(err){
            test.ok(true); // login failed
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    }
};

exports["Message tests"] = {
    setUp: function (callback) {
        this.server = new smtpServer({
            validateSender: true,
            validateRecipients: true
        });

        this.server.on("validateSender", function(envelope, email, callback){
            callback(email != "test@pangalink.net"?new Error("Failed sender") : null);
        });

        this.server.on("validateRecipient", function(envelope, email, callback){
            callback(email.split("@").pop() != "pangalink.net"?new Error("Failed recipient") : null);
        });

        this.server.on("dataReady", function(envelope, callback){
            callback(null, "ABC1"); // ABC1 is the queue id to be advertised to the client
            // callback(new Error("That was clearly a spam!"));
        });

        this.server.listen(PORT_NUMBER, function(err){
            if(err){
                throw err;
            }else{
                callback();
            }
        });

    },

    tearDown: function (callback) {
        this.server.end(callback);
    },

    "Set envelope success": function(test){
        test.expect(2);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test@pangalink.net",
                to: [
                    "test1@pangalink.net",
                    "test2@pangalink.net"
                ]
            });
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for message
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Set envelope fails for sender": function(test){
        test.expect(2);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test3@pangalink.net",
                to: [
                    "test1@pangalink.net",
                    "test2@pangalink.net"
                ]
            });
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(false); // waiting for message
            client.close();
        });

        client.on("error", function(err){
            test.ok(true);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Set envelope fails for receiver": function(test){
        test.expect(2);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test@pangalink.net",
                to: [
                    "test1@kreata.ee",
                    "test2@kreata.ee"
                ]
            });
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(false); // waiting for message
            client.close();
        });

        client.on("error", function(err){
            test.ok(true);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Set envelope partly fails": function(test){
        test.expect(3);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test@pangalink.net",
                to: [
                    "test1@pangalink.net",
                    "test2@kreata.ee"
                ]
            });
        });

        client.on("rcptFailed", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for message
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for message
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Send message success": function(test){
        test.expect(3);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test@pangalink.net",
                to: [
                    "test1@pangalink.net",
                    "test2@pangalink.net"
                ]
            });
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for message

            client.write("From: abc@pangalink.net\r\nTo:cde@pangalink.net\r\nSubject: test\r\n\r\nHello World!");
            client.end();
        });

        client.on("ready", function(success){
            test.ok(success);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    },

    "Stream message": function(test){
        test.expect(3);

        var client = simplesmtp.createClient(PORT_NUMBER, false, {});

        client.once("idle", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for envelope

            client.useEnvelope({
                from: "test@pangalink.net",
                to: [
                    "test1@pangalink.net",
                    "test2@pangalink.net"
                ]
            });
        });

        client.on("message", function(){
            // Client is ready to take messages
            test.ok(true); // waiting for message

            // pipe file to client
            fs.createReadStream(__dirname+"/testmessage.eml").pipe(client);
        });

        client.on("ready", function(success){
            test.ok(success);
            client.close();
        });

        client.on("error", function(err){
            test.ok(false);
        });

        client.on("end", function(){
            test.done();
        });
        client.connect();
    }

};
