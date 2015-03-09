'use strict';

var Token = require('./token').Token;
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var crypto = require('crypto');

/**
 * TokenManager provides all the functionality for creating, refreshing, and validating tokens
 *
 * @param nonce - generates an caches an nonce value for refresh tokens so they can't be reused
 * @param secret - the token secret
 * @constructor
 */
function TokenManager(nonce, secret, accessTokenTtl) {
    this.nonce = nonce;
    this.secret = secret || 'NoTokenSecretIsDefined.ThisIsTheDefault.SetTheTokenInConfig';
    this.accessTokenTtl = accessTokenTtl;
}

/**
 * Create Access and Refresh tokens for the given object
 *
 * @param obj the object to encode into the access token
 * @param done - calls back with tokens in an object
 */
TokenManager.prototype.createTokens = function (obj, done) {
    try {
        var accessToken = new Token(this.secret, obj, this.accessTokenTtl).value;
        var checksum = crypto.createHash('md5')
            .update(accessToken)
            .digest('hex');

        this.nonce.create(accessToken, function (err, refreshToken) {
            if (err) {
                done(err);
            } else {
                done(null, {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    urlToken: checksum
                });
            }
        });
    } catch (err) {
        done(new Error('Failed to create tokens. ' + err));
    }
};

/**
 * Decode a token and return the decoded object
 *
 * @param token - the signed token
 */
TokenManager.prototype.decodeToken = function (token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        return undefined;
    }
};


/**
 * Refresh an expired access token.  Refresh user with a lookup.  Make a new refresh token
 * @param refreshToken - the refresh token to request a new set of tokens
 * @param decodedAccessToken - the access token that has expired, decoded
 * @param done
 */
TokenManager.prototype.refreshTokens = function (refreshToken, decodedAccessToken, done) {
    var self = this;
    self.useRefreshToken(refreshToken, decodedAccessToken, function (err) {
        if (err) {
            done(err);
        } else {
            self.createTokens(decodedAccessToken.obj, done);
        }
    });
};

/**
 * Verify that the refresh token is valid, then consume it (so it cannot be used more than once)
 *
 * @param refreshToken
 * @param decodedAccessToken - the decoded access token
 * @param done - calls back with the access token if valid, or an error
 */
TokenManager.prototype.useRefreshToken = function (refreshToken, decodedAccessToken, done) {
    var self = this;
    self.nonce.use(refreshToken, function (err, accessToken) {
        if (err) {
            done(err);
        } else if (!_.isEqual(decodedAccessToken, self.decodeToken(accessToken))) {
            done(new Error('Access token does not match refresh token.'));
        } else {
            done(null, accessToken);
        }
    });
};

exports.TokenManager = TokenManager;