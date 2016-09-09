var express        = require('express');
var path           = require('path');
var favicon        = require('serve-favicon');
var logger         = require('morgan');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var mongoose       = require('mongoose');
var passport       = require('passport');
var expressSession = require('express-session');
var connectMongo   = require('connect-mongo');

var config         = require('./config');
var routes         = require('./routes/index');
var users          = require('./routes/users');
var chat           = require('./routes/chat');
var maps           = require('./routes/maps');

var MongoStore     = connectMongo(expressSession);

var passportConfig = require('./auth/passport-config');
var restrict       = require('./auth/restrict');

var DEBUG_MODE = true;

passportConfig();

mongoose.connect(config.mongoUri);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); // This is essentially worthless and not being used.

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());

app.use(expressSession({
		secret : 'TimberJackScallops',
		saveUnitialized : false,
    maxAge: new Date(Date.now() + 3600000),
		resave : false,
		store : new MongoStore({
			mongooseConnection : mongoose.connection
		})
	}));

/*app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});*/

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', routes);

app.use('/hero',express.static(path.join(__dirname, '/res/hero')));

app.use('/users', users);

/*
 * Users must be logged in from this point on.
 */
//app.use(restrict);
app.use('/chat', chat);
app.use('/maps', maps);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
// Just set the debug in code.  I don't care about setting fucking env..
if (DEBUG_MODE) {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message : err.message,
			error : err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message : err.message,
		error : {}
	});
});


module.exports = app;
