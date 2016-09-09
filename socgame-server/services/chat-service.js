var Message = require('../models/message').Message;
var utils = require('./util-service');

/**
 * @brief Takes the x y location of a user, the message type and returns the area that message can be recieved.
 *
 * @param [in] int x The x location of the sender.
 * @param [in] int y The y location of the sender.
 * @param [in] int type
 *
 * Type is an enumeration:
 * 0: mute - Should never be this value when inserting to the database.  It just means the user can only hear themselves.
 * 1: whisper - Users standing one grid away can hear the sender.
 * 2: talk - Users standing two grids away can hear the sender.
 * 3: yell - Users standing three grids away can hear the sender.
 *
 * @return object describing the x min, x max, y min, y max, that a message can be recieved.
 */
var GetMessageRadiusFromType = function(reqX, reqY, reqType){
    var x = parseInt(reqX, 10);
    var y = parseInt(reqY, 10);
    var type = parseInt(reqType, 10);

    return {xMin : (x - type),
            xMax : (x + type),
            yMin : (y - type),
            yMax : (y + type)};
};

// Need methods to add message and return messages.

// Define algorithm for which methods to return.  By area and time last checked/ logged in..
exports.storeMessage = function(msg, next){

        var radius = GetMessageRadiusFromType(msg.x, msg.y, msg.type);

        var newMsg = new Message({
            x: msg.x,
            y: msg.y,
            i: msg.i,
            j: msg.j,
            xMin: radius.xMin,
            yMin: radius.yMin,
            xMax: radius.xMax,
            yMax: radius.yMax,
            msgType: msg.type,
            msg: msg.message,
            uuid: msg.uuid,
            dateSent: utils.getServerDateString()
        });

        newMsg.save(function(err){
            if (err) {
                return next(err);
            }
            next(null);
        });
};

// Find User by email address
exports.getMessages = function(input, uuid, lastChecked, next){
    //TODO Need to do some fancy mongo query for messages here..
    //TODO Update player position here.
    var k = 0;

    if(('k' in input) || typeof k !== 'undefined')
    {
        k = input.k;
    }

    // Get messages from the current map, where the user is within the radius of the message sent.
    var query = {i : input.i,
                 j : input.j,
                 k : k,
                 uuid: { $ne: uuid },
                 $and: [ { xMin: { $lte: input.x } }, { xMax: { $gte: input.x } }, { yMin: { $lte: input.y } }, { yMax: { $gte: input.y } } ],
                 dateSent: { $gte : lastChecked }
                };

    Message.find(query, function(err, msgs){
        msgList = [];

        //NOTE This could be worthless code.  Test to see if it's needed.. the msgs var is already an array...
        msgs.forEach(function(msg) {
            msgList.push(msg);
        });

        next(err, msgList);
    });
};
