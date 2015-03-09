'use strict';

var hoek = require('hoek');
var TokenManager = require('./token-manager').TokenManager;

var internals = {};

// expiresIn: optional, only if you want it longer than an hour
// secret: required, token secret password
internals.defaults = {
    expiresIn: undefined,
    secret: undefined
};

exports.register = function (server, opts, next) {
    hoek.assert(opts, 'Missing ent-tokens strategy options');
    hoek.assert(opts.secret, 'Missing required private key in configuration');
    var settings = hoek.applyToDefaults(internals.defaults, opts);

    server.log(['Token Manager', 'plugin', 'info', 'startup'], 'Starting');
    server.dependency(['ent-nonce'], function (plugin, next) {
        var tokenManager = new TokenManager(plugin.plugins['ent-nonce'].nonce, settings.secret, settings.expiresIn);
        plugin.expose('createTokens', tokenManager.createTokens.bind(tokenManager));
        plugin.expose('refreshTokens', tokenManager.refreshTokens.bind(tokenManager));
        plugin.expose('decode', tokenManager.decodeToken.bind(tokenManager));
        next();
    });

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
