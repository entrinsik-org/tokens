'use strict';

//var TokenManager = require('../../lib/tokens/token-manager').TokenManager;
//var User = require('../../lib/db/models').UserModel;
//var LocalUser = require('../../lib/db/local-user');
//var Nonce = require('../../nonce').Nonce;
//var mongoose = require('mongoose');
//var hapi = require('hapi');
//var async = require('async');
//var _ = require('lodash');
//var sinon = require('sinon');
//var chai = require('chai');
//var should = chai.should();
//chai.use(require('sinon-chai'));
//
//describe('Token Manager', function () {
//
//    var server;
//    var cache;
//    var nonce;
//    var tokenManager;
//    var newUser;
//
//    mongoose.connect('mongodb://localhost/token-manager-spec');
//
//    var dropCollections = function (callback) {
//        var collections = _.keys(mongoose.connection.collections)
//        async.forEach(collections, function (collectionName, done) {
//            var collection = mongoose.connection.collections[collectionName]
//            collection.drop(function (err) {
//                if (err && err.message != 'ns not found') done(err)
//                done(null)
//            })
//        }, callback);
//    }
//
//    beforeEach(function (next) {
//        dropCollections();
//        server = hapi.createServer('localhost', 7878, {
//            cors: true,
//            cache: 'catbox-memory'
//        });
//        server.start(function () {
//            cache = server.cache('nonce', { expiresIn: 60 * 60 * 1000 });
//            nonce = new Nonce(cache);
//            tokenManager = new TokenManager(nonce);
//            next();
//        });
//        newUser = {
//            username: 'john',
//            displayName: 'John Smith',
//            name: {
//                givenName: 'John',
//                middleName: 'Joeseph',
//                familyName: 'Smith'
//            },
//            emails: [
//                {value: 'john@place.com', type: 'work'}
//            ]
//        };
//    });
//
//    afterEach(function (next) {
//        server.stop(function () {
//            next();
//        })
//    });
//
//    it('should lazily persist a new user', function (done) {
//        tokenManager.createOrFindUser(new User(newUser), function (err, foundUser) {
//            should.not.exist(err);
//            should.exist(foundUser);
//            should.exist(foundUser._id);
//            foundUser.username.should.equal(newUser.username);
//            foundUser.displayName.should.equal(newUser.displayName);
//            foundUser.name.should.deep.equal(newUser.name);
//            should.exist(foundUser.emails[0].id);
//            done();
//        });
//    });
//
//    it('should find and use an existing user', function (done) {
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            newUser._id = user._id;
//            tokenManager.createOrFindUser(newUser, function (err, foundUser) {
//                should.not.exist(err);
//                should.exist(foundUser);
//                should.exist(foundUser._id);
//                foundUser._id.should.deep.equal(newUser._id);
//                foundUser.username.should.equal(newUser.username);
//                foundUser.displayName.should.equal(newUser.displayName);
//                foundUser.name.should.deep.equal(newUser.name);
//                should.exist(foundUser.emails[0]);
//                should.exist(foundUser.emails[0].value);
//                foundUser.emails[0].value.should.equal(newUser.emails[0].value);
//                User.count({username: newUser.username}, function (err, count) {
//                    should.not.exist(err);
//                    should.exist(count);
//                    count.should.equal(1);
//                    done();
//                });
//            });
//        });
//    });
//
//    it('should create tokens for a login', function (done) {
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            tokenManager.login(user, function (err, result) {
//                should.not.exist(err);
//                should.exist(result);
//                should.exist(result.accessToken);
//                should.exist(result.refreshToken);
//                should.exist(result.user);
//                result.user.id.should.deep.equal(user._doc._id);
//                done();
//            });
//        });
//    });
//
//    it('should reject a login if a user could not be found or created', function (done) {
//        var badUser = {
//            username: undefined,
//            name: 'Badly formed user'
//        };
//        tokenManager.login(badUser, function (err, result) {
//            should.exist(err);
//            should.not.exist(result);
//            done();
//        });
//    });
//
//    it('should fail to create tokens if a refresh token cannot be generated', function (done) {
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            cache._cache.connection.stop();
//            tokenManager.createTokens(user, function (err, tokens) {
//                should.exist(err);
//                should.not.exist(tokens);
//                done();
//            });
//        });
//    });
//
//    it('should fail to create tokens if an access token cannot be generated', function (done) {
//        var badUser = {
//            username: undefined,
//            name: 'Badly formed user'
//        };
//        tokenManager.createTokens(badUser, function (err, result) {
//            should.exist(err);
//            should.not.exist(result);
//            done();
//        });
//    });
//
//    it('should fail to lookup a user if the id is missing', function (done) {
//        tokenManager.lookupUser(newUser.id, function (err, user) {
//            should.exist(err);
//            should.not.exist(user);
//            done();
//        });
//    });
//
//    it('should fail to lookup a user with a malformed id', function (done) {
//        tokenManager.lookupUser('123123123', function (err, user) {
//            should.exist(err);
//            should.not.exist(user);
//            done();
//        });
//    });
//
//    it('should fail to lookup a user if they are not in the database', function (done) {
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            var id = user._doc._id;
//            LocalUser.remove({'_id': id}, function (err) {
//                should.not.exist(err);
//                tokenManager.lookupUser(id, function (err, user) {
//                    should.exist(err);
//                    should.not.exist(user);
//                    done();
//                });
//            });
//        });
//    });
//
//    it('should fail if user is created but could not be retrieved from the database', function (done) {
//        var userStub = sinon.stub(User, "findById").yields(new Error('Nope'), undefined);
//        tokenManager.createUser(newUser, function (err, user) {
//            should.exist(err);
//            should.not.exist(user);
//            userStub.should.have.been.calledOnce;
//            userStub.restore();
//            done();
//        });
//    });
//
//    it('should not try to find an undefined user', function (done) {
//        var user = undefined;
//        tokenManager.createOrFindUser(user, function (err, user) {
//            should.exist(err);
//            should.not.exist(user);
//            done();
//        })
//    });
//
//    it('should not try to create an undefined user', function (done) {
//        var user = undefined;
//        tokenManager.createUser(user, function (err, user) {
//            should.exist(err);
//            should.not.exist(user);
//            done();
//        })
//    });
//
//    it('should create an existing mongoose User', function (done) {
//        var user = new User(newUser);
//        tokenManager.createUser(user, function (err, user) {
//            should.not.exist(err);
//            should.exist(user);
//            user.username.should.equal(newUser.username);
//            done();
//        })
//    });
//
//    it('should use a refresh token to generate new tokens', function (done) {
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            tokenManager.createTokens(user, function (err, result) {
//                should.not.exist(err);
//                should.exist(result);
//                result.user.username.should.equal(newUser.username);
//                result.user.displayName.should.equal(newUser.displayName);
//                result.user.name.givenName.should.equal(newUser.name.givenName);
//                result.user.name.middleName.should.equal(newUser.name.middleName);
//                result.user.name.familyName.should.equal(newUser.name.familyName);
//                should.exist(result.accessToken);
//                should.exist(result.refreshToken);
//                tokenManager.refreshTokens(result.refreshToken, result.accessToken, function (err, tokens) {
//                    should.not.exist(err);
//                    should.exist(tokens);
//                    should.exist(tokens.refreshToken);
//                    should.exist(tokens.accessToken);
//                    tokens.refreshToken.should.not.equal(result.refreshToken);
//                    tokens.accessToken.should.not.equal(result.accessToken);
//                    tokens.user.id.should.deep.equal(user._doc._id);
//                    done();
//                });
//            });
//        });
//    });
//
//    it('should not allow a refresh token to be used if it cannot be retrieved from cache', function (done) {
//        var nonceStub = sinon.stub(nonce, "use").yields(new Error('Nope'));
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            tokenManager.createTokens(user, function (err, result) {
//                should.not.exist(err);
//                tokenManager.refreshTokens(result.refreshToken, result.accessToken, function (err, tokens) {
//                    should.exist(err);
//                    should.not.exist(tokens);
//                    nonceStub.should.have.been.calledOnce;
//                    nonceStub.restore();
//                    done();
//                });
//            });
//        });
//    });
//
//    it('should not allow a refresh token to be used if the access token does not match', function (done) {
//        var nonceStub = sinon.stub(nonce, "use").yields(null, 'REAL_ACCESS_TOKEN_WILL_NOT_MATCH');
//        LocalUser.register(newUser, 'secret', function (err, user) {
//            should.not.exist(err);
//            tokenManager.createTokens(user, function (err, result) {
//                should.not.exist(err);
//                tokenManager.refreshTokens(result.refreshToken, result.accessToken, function (err, tokens) {
//                    should.exist(err);
//                    should.not.exist(tokens);
//                    nonceStub.should.have.been.calledOnce;
//                    nonceStub.restore();
//                    done();
//                });
//            });
//        });
//    });
//
//    it('should reject an access token if it is undefined', function () {
//        tokenManager.isValidToken(undefined).should.equal(false);
//    });
//
//    it('should reject an access token if it does not have an expiration date', function () {
//        tokenManager.isValidToken({}).should.equal(false);
//    });
//
//    it('should reject an access token if has expired', function () {
//        tokenManager.isValidToken({expiration: new Date().getTime() - 1000}).should.equal(false);
//    });
//
//    it('should accept an access token if has not expired', function () {
//        tokenManager.isValidToken({expiration: new Date().getTime() + 1000}).should.equal(true);
//    });
//
//
//});