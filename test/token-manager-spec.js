'use strict';

var TokenManager = require('../lib/token-manager').TokenManager;
var Nonce = require('ent-nonce').Nonce;
var hapi = require('hapi');
var sinon = require('sinon');
var chai = require('chai');
var should = chai.should();
chai.use(require('sinon-chai'));

describe('Token Manager', function () {

    var server;
    var cache;
    var nonce;
    var tokenManager;

    beforeEach(function (next) {
        server = new hapi.Server({
            cache: require('catbox-memory')
        });

        server.connection({ routes: { cors: true } });

        server.start(function () {
            cache = server.cache({ segment: 'nonce', expiresIn: 60 * 60 * 1000 });
            nonce = new Nonce(cache);
            tokenManager = new TokenManager(nonce);
            next();
        });
    });

    afterEach(function (next) {
        server.stop(function () {
            next();
        });
    });

    it('should create an access token and refresh token', function (done) {
        tokenManager.createTokens('My Payload', function (err, result) {
            should.not.exist(err);
            should.exist(result);
            should.exist(result.accessToken);
            should.exist(result.refreshToken);
            tokenManager.decodeToken(result.accessToken).obj.should.equal('My Payload');
            done();
        });
    });

    it('should not create tokens if payload is not provided', function (done) {
        tokenManager.createTokens(null, function (err, tokens) {
            should.exist(err);
            should.not.exist(tokens);
            done();
        });
    });

    it('should fail to create tokens if a refresh token cannot be generated', function (done) {
        cache._cache.connection.stop();
        tokenManager.createTokens('My Payload', function (err, tokens) {
            should.exist(err);
            should.not.exist(tokens);
            done();
        });
    });

    it('should use a refresh token to generate new tokens', function (done) {
        tokenManager.createTokens('My Payload', function (err, result) {
            should.not.exist(err);
            should.exist(result);
            should.exist(result.accessToken);
            should.exist(result.refreshToken);
            var decodedAccessToken = tokenManager.decodeToken(result.accessToken);
            decodedAccessToken.obj.should.equal('My Payload');
            tokenManager.refreshTokens(result.refreshToken, decodedAccessToken, function (err, tokens) {
                should.not.exist(err);
                should.exist(tokens);
                should.exist(tokens.refreshToken);
                should.exist(tokens.accessToken);
                tokens.refreshToken.should.not.equal(result.refreshToken);
                tokens.accessToken.should.not.equal(result.accessToken);
                tokenManager.decodeToken(tokens.accessToken).obj.should.equal('My Payload');
                done();
            });
        });
    });

    it('should not allow a refresh token to be used if it cannot be retrieved from cache', function (done) {
        var nonceStub = sinon.stub(nonce, 'use').yields(new Error('Nope'));
        tokenManager.createTokens('My Payload', function (err, result) {
            should.not.exist(err);
            var decodedAccessToken = tokenManager.decodeToken(result.accessToken);
            tokenManager.refreshTokens(result.refreshToken, decodedAccessToken, function (err, tokens) {
                should.exist(err);
                should.not.exist(tokens);
                nonceStub.should.have.been.calledOnce;
                nonceStub.restore();
                done();
            });
        });
    });

    it('should not allow a refresh token to be used if the access token does not match', function (done) {
        var nonceStub = sinon.stub(nonce, 'use').yields(null, 'REAL_ACCESS_TOKEN_WILL_NOT_MATCH');
        tokenManager.createTokens('My Payload', function (err, result) {
            should.not.exist(err);
            var decodedAccessToken = tokenManager.decodeToken(result.accessToken);
            tokenManager.refreshTokens(result.refreshToken, decodedAccessToken, function (err, tokens) {
                should.exist(err);
                should.not.exist(tokens);
                nonceStub.should.have.been.calledOnce;
                nonceStub.restore();
                done();
            });
        });
    });

});