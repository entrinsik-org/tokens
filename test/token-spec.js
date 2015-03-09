'use strict';

var chai = require('chai');
var should = chai.should();
var Token = require('../lib/token').Token;

describe('Token', function () {

    function now(expireIn) {
        return (new Date().getTime() + expireIn) / 1000;
    }

    it('should create a token with a payload and expiration', function () {
        var before = now(600000);
        var at = new Token('secret', 'My Payload', 600000);
        var after = now(600000);
        should.exist(at.decoded);
        should.exist(at.decoded.obj);
        at.decoded.obj.should.equal('My Payload');
        should.exist(at.decoded.exp);
        at.decoded.exp.should.be.at.least(before);
        at.decoded.exp.should.be.at.most(after);
    });

    it('should use a default ttl of one hour', function () {
        var user = {
            id: '123123123123'
        };
        var before = now(3600000);
        var at = new Token('secret', user.id);
        var after = now(3600000);
        at.decoded.exp.should.be.at.least(before);
        at.decoded.exp.should.be.at.most(after);
    });

    it('should throw an error if the object does not exist', function (done) {
        try {
            new Token('secret');
        } catch (err) {
            should.exist(err);
            done();
        }
    });

    it('should throw an error if the ttl is not a number', function (done) {
        var user = {
            id: '123123123123'
        };
        try {
            new Token('secret', user.id, {not: 'a valid ttl'});
        } catch (err) {
            should.exist(err);
            done();
        }
    });

});