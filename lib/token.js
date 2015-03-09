'use strict';

var jwt = require('jsonwebtoken');

/**
 * An access token is encoded with the object provided and jwt signed
 *
 * @param secret - the token secret to sign with jwt
 * @param obj - the payload value, such as a user id
 * @param ttl - the time to live in milliseconds
 * @constructor
 */
function Token(secret, obj, ttl) {

    if (!secret || secret.length < 1 || arguments.length < 2) {
        throw new Error('Token secret is required for signing.');
    }
    if (!obj) {
        throw new Error('Token error.  Token payload is not defined.');
    }
    ttl = ttl || 3600000;
    if (typeof ttl !== 'number') {
        throw new Error('Token error.  TTL must be milliseconds. ' + ttl);
    }
    // exp: unix time is seconds
    this.decoded = {
        obj: obj,
        exp: (new Date().getTime() + ttl) / 1000
    };
    this.secret = secret;
    this.value = jwt.sign(this.decoded, this.secret);
}

exports.Token = Token;