var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');
var path = require('path');
var restrict = require('../auth/restrict');
var userService = require('../services/user-service');
var chatService = require('../services/chat-service');
var utils = require('../services/util-service');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/create', function(req, res, next) {
    var vm = {
        input: req.body,
        error: false,
        msg: 'User created'
    };

    userService.findUser(req.body.email, function(err, user){
        if(err){
            vm.error = true;
            vm.msg = 'Unable to create user';
            delete vm.input.password;
            res.send(vm);
        } else if(user){

            vm.error = true;
            vm.msg = 'Email already in use.';
            delete vm.input.password;
            res.send(vm);
        } else {
            userService.addUser(req.body, function(err) {
                if (err) {
                    vm.error = true;
                    vm.msg = 'Internal Error, Unable to create user.';
                }
                delete vm.input.password;
                res.send(vm);
            });
        }
    });
});

// This method might need to be refactored to handle bad logins by returning proper json, rather than a 401.
//TODO: Need to extend this method to return more info about the user.
router.post('/login',
    function(req, res, next) {
        // If the user choose to be remembered, then set the max age to what's in our config.
        //if (req.body.rememberMe) {
            req.session.cookie.MaxAge = config.cookieMaxAge;
        //}
        next();
    },
    passport.authenticate('local'),
    function(req, res, next) {
        var vm = {
            input: req.body,
            error: false,
            msg: 'Login successful'
        };
        delete vm.input.password;

        if (!req.user) {
            vm.error = true;
            vm.msg = 'Login Failed';
        }

        if (req.user) {
            // Add user uuid and email to session.
            req.session.userID = req.user.uuid;
            req.session.email = req.user.email;

            var datetime = utils.getServerDateString();

            //NOTE This value needs to be updated for various events. Like switching to new maps.
            req.session.lastUpdated = datetime;
            req.user.lastLoginDate = datetime;

            req.user.save(function(err) {
                if (err){
                    console.log("Update user error: ");
                    console.log(err);
                }
                console.log("Session after login");
                console.log(req.session);
            });

            req.session.user = req.user;
            vm.user = req.user;
        }
        req.session.save();
        res.send(vm);
    });

router.post('/updateEvents', function(req, res, next){
    var vm = {
        input: req.body,
        error: false,
        msg: 'Message Recieved.'
    };

    var datetime = utils.getServerDateString();

    chatService.getMessages(vm.input, vm.input.uuid, vm.input.lastUpdated, function(err, msgList){
        vm.msgList = [];
        if(err){
            console.log("Get Chat error: ");
            console.log(err);
        }else{

            vm.msgList = msgList;
        }

        var mapCoords = {i: vm.input.i, j : vm.input.j};

        // Get all the users on the current map.
        userService.findUserByMapLocation(mapCoords, function(err, users){
            vm.others = [];
            if(!err){
                vm.others = users;
                // Package up all the users and send them back.
                console.log(vm);
                res.send(vm);
            }
            else {
                console.log("There was an error when getting users in map.");
                console.log(err);
            }
        });
    });
});

// Takes a quick snapshot of the current user location and sends back any chats
// or other important info.
//TODO: Need to extend this method to return more info about the user.
router.post('/update', function(req, res, next) {

    var vm = {
        input: req.body,
        error: false,
        msg: 'Message Recieved.'
    };

    console.log("Request");
    console.log(vm);

    if (!('x' in vm.input) || !('y' in vm.input) || !('i' in vm.input) || !('j' in vm.input)) {
        vm.error = true;
        vm.msg = "Invalid input";
        res.send(vm);
    }

    var datetime = utils.getServerDateString();

    vm.input.z = ('z' in vm.input) ? vm.z : 0;
    vm.input.k = ('k' in vm.input) ? vm.k : 0;

    console.log("Session:")
    console.log(req.session);
    userService.findUserByID(vm.input.uuid, function(err, user){
        // Set the users current position and datetime last updated.
        console.log("USER");
        console.log(user);
        console.log("ERROR");
        console.log(err);
        user.x = vm.input.x;
        user.y = vm.input.y;
        user.z = vm.input.z;
        user.i = vm.input.i;
        user.j = vm.input.j;
        user.k = vm.input.k;
        user.lastUpdated = datetime;

        if('aboutMe' in vm.input){
            user.aboutMe = vm.input.aboutMe;
        }

        // If the position save fails, it should not be fatal.
        user.save(function(err) {
            if (err){
                console.log("Save user error: ");
                console.log(err);
            }
        });

        chatService.getMessages(user, vm.input.uuid, vm.input.lastUpdated, function(err, msgList){
            vm.msgList = [];
            if(err){
                console.log("Get Chat error: ");
                console.log(err);
            }else{

                vm.msgList = msgList;
            }

            var mapCoords = {i: vm.input.i, j : vm.input.j};

            // Get all the users on the current map.
            userService.findUserByMapLocation(mapCoords, function(err, users){
                vm.others = [];
                if(!err){
                    vm.others = users;
                    // Package up all the users and send them back.
                    req.session.lastUpdated = datetime;
                    req.session.user = user;
                    res.send(vm);
                }
                else {
                    console.log("There was an error when getting users in map.");
                    console.log(err);
                }
            });
        });
    });
    //TODO: Return data.
});

// Takes a quick snapshot of the current user location and sends back any chats
// or other important info.
//TODO: Need to extend this method to return more info about the user.
router.post('/updateProfile', function(req, res, next) {

    var vm = {
        input: req.body,
        error: false,
        msg: 'Message Recieved.'
    };

    userService.findUserByID(vm.input.uuid, function(err, user){
        // Set the users current position and datetime last updated.

        if('aboutMe' in vm.input){
            user.aboutMe = vm.input.aboutMe;
        }

        if('favMovies' in vm.input){
            user.favMovies = vm.input.favMovies;
        }

        if('favBooks' in vm.input){
            user.favBooks = vm.input.favBooks;
        }

        if('firstName' in vm.input){
            user.firstName = vm.input.firstName;
        }

        if('lastName' in vm.input){
            user.lastName = vm.input.lastName;
        }

        if('displayName' in vm.input){
            user.displayName = vm.input.displayName;
        }

        // If the position save fails, it should not be fatal.
        user.save(function(err) {

            if (err){
                vm.error = true;
                vm.msg = 'Could not save message';
            }
            console.log("Update Success");
            res.send(vm);
        });
    });
});

router.post('/getAvailableSprites', function(req, res, next){

    userService.GetAvailableSprites(function(err, files){
        res.send(files);
    });
});

router.get('/getSprite/:fileName', function(req, res, next){

    var vm = {
        input: req.params,
        error: false,
        msg: 'Failed to get image.'
    };

    var options = {
        root: __dirname + "/../res/hero/",
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    // Some default image.. whatever..
    var fileName = 'black_space.png';

    // Make sure their not trying to access outside the specified folder.
    if( 'user' in req.session && 'spriteImage' in req.sessions.user && req.session.user.spriteImage.length > 0) {
        fileName = path.basename(req.session.user.spriteImage);
    }
    else{
        fileName = path.basename(vm.input.fileName);
    }

    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        }
        else {
            console.log('Sent:', vm.input.fileName);
        }
    });
});

router.get('/logout', function(req, res, next) {
    req.logout();
    req.session.destroy();
    var vm = {
        input: req.body,
        error: false,
        msg: 'Logout successful'
    };

    if (req.session) {
        vm.error = true;
        vm.msg = 'Logout failure';
    }

    res.send(vm);
});

module.exports = router;
