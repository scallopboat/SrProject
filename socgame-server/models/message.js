/**
* Change Log:
* 7/30/15 - Added Message model with validation for uuid
*
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userService = require('../services/user-service');
var utils = require('../services/util-service');

//TODO: Impose char limit for messages.
var msgSchema = new Schema({
    x: {type: Number, required: 'Position required'},
    y: {type: Number, required: 'Position required'},
    i: {type: Number, required: 'Map required'},
    j: {type: Number, required: 'Map required'},
    k: {type: Number, default: 0},
    xMin: {type: Number, required: 'xMin required'},
    yMin: {type: Number, required: 'yMin required'},
    xMax: {type: Number, required: 'xMax required'},
    yMax: {type: Number, required: 'yMax required'},
    msgType: {type: Number, required: 'Message type required'},
    msg: {type: String, required: 'Message content required'},
    uuid: {type: Number, required: 'User ID required'},
    dateSent: {type: Date, default: utils.getServerDateString()}
});

// Quick validation to make sure the user ID has some content to it.
msgSchema.path('uuid').validate(function(value, next){
        userService.findUserByID(value, function(err, user){
        if(err){
            console.log(err);
            return next(false);
        }

        // At this point we just want to be extra sure this user is legit..
        var valid = user ? true : false;
        next(valid);
    });
}, 'Invalid UserID');

msgSchema.path('x').validate(function(value, next){
    next(utils.isNumeric(value));
}, 'Invalid x');

msgSchema.path('y').validate(function(value, next){
    next(utils.isNumeric(value));
}, 'Invalid y');

msgSchema.path('i').validate(function(value, next){
    next(utils.isNumeric(value));
}, 'Invalid i');

msgSchema.path('j').validate(function(value, next){
    next(utils.isNumeric(value));
}, 'Invalid j');

msgSchema.path('k').validate(function(value, next){
    next(utils.isNumeric(value));
}, 'Invalid k');

msgSchema.path('msgType').validate(function(value, next){
    var typeInt = parseInt(value, 10);

    next((utils.isNumeric(value) && typeInt <= 3));
}, 'Invalid Message Type');

var Message = mongoose.model('Message', msgSchema);

module.exports = { Message: Message };
