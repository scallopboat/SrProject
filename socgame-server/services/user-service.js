var bcrypt = require('bcrypt');
var User = require('../models/user').User;
var fs = require('fs');

exports.addUser = function(user, next){

    bcrypt.hash(user.password, 10, function(err, hash){

        if(err){
            return next(err);
        }

        var newUser = new User({
            displayName: user.displayName,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            spriteImage: user.spriteImage,
            password: hash,
            birthDate: user.birthDate,
            x: 8,
            y: 0,
            z: 0,
            i: 0,
            j: 0,
            k: 0
        });

        newUser.save(function(err){
            if (err) {
                console.log(err);
                return next(err);
            }
            next(null);
        });
    });
};

// Find User by email address
exports.findUser = function(email, next){
    User.findOne({email : email.toLowerCase()}, function(err, user){
        next(err, user);
    });
};

// Find a user by UserID
exports.findUserByID = function(uuid, next){
  console.log("UserID to find");
  console.log(uuid);
    User.findOne({uuid : uuid}, function(err, user){
        next(err, user);
    });
};

// Find all users in a map
exports.findUserByMapLocation = function(mapCoord, next){

    var query = {
        i : mapCoord.i,
        j : mapCoord.j
    };

    User.find(query, function(err, users){
        next(err, users);
    });
};

exports.GetAvailableSprites = function(next){
    var retArray = [];

    fs.readdir(__dirname + "/../res/hero", function(err, files){
        if(err){
            next(err, null);
        }

        files.forEach(function(file, index, array){
            var name = file.slice(0, -4);
            name = name.replace('_', ' ');

            var temp = {};
            temp.text = name;
            temp.fileName = file;
            retArray.push(temp);
        });
        next(null, retArray);
    });
};
