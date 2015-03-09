'use strict';

var hapi = require('hapi');
var should = require('chai').should();
var noncePlugin = require('ent-nonce');
var tokensPlugin = require('../');

describe('Tokens Plugin', function () {
    var server;

    beforeEach(function () {
        server = new hapi.Server();
        server.connection();
    });

    afterEach(function (next) {
        server.stop(function () {
            next();
        });
    });

    it('should register', function (done) {
        server.register(noncePlugin, function () {
            should.exist(server.plugins['ent-nonce']);
            server.register({ register: tokensPlugin.register, options: {secret: 'MyTokenSecret'}}, function () {
                server.start(function () {
                    var plugin = server.plugins['ent-tokens'];
                    should.exist(plugin);
                    should.exist(plugin.createTokens);
                    should.exist(plugin.refreshTokens);
                    should.exist(plugin.decode);
                    plugin.createTokens.should.be.a('function');
                    plugin.refreshTokens.should.be.a('function');
                    plugin.decode.should.be.a('function');
                    done();
                });
            });
        });
    });

    it('should fail to register if ent-nonce is missing', function (done) {
        server.register({ register: tokensPlugin.register, options: { secret: 'MyTokenSecret' } }, function (err) {
            if (err) return done(err);
            try {
                server.start();
                done(new Error('should not have started with unsatisfied dependency'));
            }
            catch (err) {
                err.message.should.contain('Plugin ent-tokens missing dependency ent-nonce');
                done();
            }
        });
    });

    it('should fail to register if no options are provided', function () {
        tokensPlugin.register.should.throw('Missing ent-tokens strategy options');
    });

    it('should fail to register without a token secret', function () {
        tokensPlugin.register.bind(tokensPlugin, {}, {}).should.throw('Missing required private key in configuration');
    });

})
;