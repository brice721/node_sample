(function (auth) {
    var expressJwt = require('express-jwt'),
        jwt = require('jsonwebtoken'),
        config = require('./config/config.js');
    var path = require('path');
    var fs = require('fs');
    var crypto = require('crypto');
    var users = require('./Data/users.json');
    var app;

    // CBC because CTR isn't possible with the current version of the Node.JS crypto library
    ALGORITHM = 'AES-256-CBC'; 
    HMAC_ALGORITHM = 'SHA256';
    // This key should be stored in an environment variable
    KEY = crypto.randomBytes(32); 
    // This key should be stored in an environment variable
    HMAC_KEY = crypto.randomBytes(32); 

    var apiPath = config.paths.api;
    var secret = 'something_secret';

    auth.init = init;

    function init(_app_) {
        app = _app_;
        app.use(apiPath, expressJwt({ secret: secret }));
        configureRoutes();
    }

    function configureRoutes() {
        app.get(apiPath + '/restricted', pingRestricted);
        app.post('/authenticate', postAuth);
        app.post(apiPath + '/verify', verify);
    }

    function handleUnauth() {
        app.use(function (req, res, err, next) {
            if (err.constructor.name === 'UnauthorizedError') {
                res.status(401).send('Unauthorized');
            }
        });
    }

    function pingRestricted(req, res, next, err) {
        console.log('This that API path: ' + apiPath);
        if (err) {
            console.error('Error is: >>>>>> ' + err);
        }
        var current = req.body.username;
        console.log('User ' + current + ' is calling /api/restricted');
        res.json({
            name: 'Ping Restricted API'
        });
    }

    function postAuth(req, res) {
        var date = new Date().getTime();
        var message;

        // noinspection JSAnnotator
        for (var user of users.users) {
            if (user.username !== req.body.username) {
                message = 'User not found';
            } else {
                if (user.password !== req.body.password) {
                    message = 'Wrong Username or Password';
                    break;
                } else {
                    var token = jwt.sign(user.profile, secret, { expiresIn: date + ((1000 * 60 * 60 * 24) * 7) });
                    message = 'Authorization Successfull...';
                    break;
                }
            }
        }

        if (token) {
            res.status(200).json({
                message: message,
                token: token
            });
        }
        else {
            res.status(403).json({
                message: message
            });
        }
    }

    function verify(req, res) {
        var requestToken = req.body.token;
        var decoded = jwt.verify(requestToken, secret);
        console.log(decoded);
        res.sendStatus(200).json({
            message: 'Web Token is Aight...',
            token: decoded
        });
    }
})(module.exports);