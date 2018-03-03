/** Needed to use express.js for server code */
var express = require('express');

/** Sets up the usage of app instead of using express */
/** Instead of express.get('/', function() {}) its app.get */
var app = express();

/** Also comes when you download Express */
var http = require('http');
var https = require('https');

/** Comes with Express used for paths to directories */
/** Example 'path.join(__dirname, 'views')' */
var path = require('path');

/** Tells the server to look for a favicon */
/** Can also be handled on the front end in HTML */
var favicon = require('serve-favicon');

/** Logging for Express */
var morgan = require('morgan');

/** Routes */
var auth = require('./auth');

/** Cross Origin Resource Sharing "cors" */
var cors           = require('cors');
var allowMethods   = require('allow-methods');

/** Parsing used with Express. Cookies not as important */
/** The body parser will be needed for parsing requests */
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var jwt       = require('jsonwebtoken');
var server    = http.createServer();

/** Error handling */
var errorHandler   = require('./errorHandler');
var isDev          = app.get('env') === 'development';
var port           = process.env.PORT || PROCESS.ENV.OPENSHIFT_NODEJS_PORT || 8080;
var host           = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var securePort     = process.env.SECURE_PORT || 8443;
var environment    = process.env.NODE_ENV || 'development';
var apiRoutes      = express.Router();
var config         = require('./config/config');
var apiPaths       = config.paths.api;
var staticPaths    = config.paths.static;

/** Configure Middleware */
//app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(config.paths.static, '/app')));
app.set('superSecret', config.secret);
app.use(errorHandler.init);

/** Initialize routing for the app */
auth.init(app);
// routes.init(app);

var whitelist = ['https://localhost:8443', 'http://localhost:8080'];
var corsOptionsDelegate = function (req, cb) {
    var corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== 1) {
        corsOptions = { origin: true }
    } else {
        corsOptions = { origin: false }
    }
    cb(null, corsOptions)
};
app.use(cors(corsOptionsDelegate));
app.use(allowMethods(['get', 'head', 'post']));

/** Public endpoint for testing purposes */
if(environment === 'development'){
    app.get('/ping', function(req, res, next) {
        console.log(req.body);
        res.send('pong');
    });
}

/** Create an http server */
var server = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

/** Routing for server. Base http://localhost:8080 */
app.get('/', function (req, res) {
    console.log('endpoint hit...');
    res.send('Hello, Matt!!! Api is at http://localhost:' + port + '/api');
});

app.get(apiPaths + '/', function (req, res) {
    res.json({ message: 'Welcome to your awesome API...' });
});

app.get(apiPaths + '/ping', function (req, res) {
    console.log(apiPaths);
    res.json({ success: true, message: 'Pong' });
});

app.get(apiPaths + '/check', function (req, res) {
    res.json(req.decoded);
});

server.listen(port, function () {
    console.log('Server Running at http://localhost:' + port);
    console.log(path.join(staticPaths, '/app'));
    console.log('env = '+ app.get('env') +
        '\napiPaths = ' + apiPaths +
        '\n__dirname = ' + __dirname  +
        '\nstatic directory = ' + config.paths.static +
        '\nprocess.cwd = ' + process.cwd() );

    /** Opens a new window in chrome automatically */    
    var open = require('opn');
    // open('http://localhost:8080');
});

// httpsServer.listen(securePort, function () {
//     var open = require('open');
//     // open('https://localhost:8443');
//     console.log('Secure Server Running At: https://localhost:' + securePort);
// });
