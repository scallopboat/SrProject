var express = require('express');
var router = express.Router();
var restrict = require('../auth/restrict');
var utils = require('../services/util-service');
var chatService = require('../services/chat-service');

router.post('/send', /*restrict,*/ function(req, res, next) {
    var vm = {
            input: req.body,
            error: false,
            msg: 'Message Recieved.'
        };

    req.lastChecked = new Date().toISOString();

    if('gmtDate' in vm.input){
        req.lastChecked = new Date(vm.input.gmtDate);
    }
console.log(vm.input);
    // Make sure we have all the input fields.
    if(!('message' in vm.input) || !('type' in vm.input) || !('x' in vm.input) ||
       !('y' in vm.input) || !('i' in vm.input) || !('j' in vm.input)){

        vm.error = true;
        vm.msg = "Invalid input";
        res.send(vm);
        return;
    }

    // If a message exists, then attempt to store it and get any messages that haven't been recieved yet.
    if(vm.input.message.length > 0 && vm.input.type >= 0 && vm.input.type <= 3){

        chatService.storeMessage(vm.input, function(err) {
            if (err) {
                vm.error = true;
                vm.msg = 'Unable to store message';
                res.send(vm);
            } else {
                res.send(vm);
            }
        });
    }
});

router.post('/receive', /*restrict,*/ function(req, res, next) {
    var vm = {
            input: req.body,
            msgList: [],
            error: false,
            msg: 'Messages sent.'
        };

    var lastDate = new Date(vm.input.lastUpdated);

    chatService.getMessages(vm.input, vm.input.uuid, lastDate, function(err, msgs){
        if (err) {
            vm.error = true;
            vm.msg = "Could not get messages";
            vm.msgList = [];
            res.send(vm);
        } else {

            vm.msgList = msgs;
            req.session.lastUpdated = utils.getServerDateString();
            res.send(vm);
        }
    });
});


module.exports = router;
