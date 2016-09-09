/**
 * Change Log: 6/20/15 - Added FlakeID Gen and biguint-format for user UUID
 *
 */
var mongoose = require('mongoose');
var intformat = require('biguint-format');
var FlakeId = require('flake-idgen');
var Schema = mongoose.Schema;
var userService = require('../services/user-service');
var utils = require('../services/util-service');

// Create a unique ID for the user here.
var flakeIdGen = new FlakeId();

var userSchema = new Schema({
		displayName : {
			type : String,
			required : 'Please enter a display name'
		},
		email : {
			type : String,
			required : 'Please enter a valid email'
		},
		firstName : {
			type : String,
			required : 'Please enter first name'
		},
		lastName : {
			type : String,
			required : 'Please enter last name'
		},
		spriteImage : {
			type : String,
			required : 'Missing sprite image'
		},
		x : {
			type : Number,
			required : 'x position required'
		},
		y : {
			type : Number,
			required : 'y position required'
		},
		z : {
			type : Number,
			default: 0
		},
		i : {
			type : Number,
			required : 'i position required'
		},
		j : {
			type : Number,
			required : 'j position required'
		},
		k : {
			type : Number,
			default: 0
		},
		password : {
			type : String,
			required : 'Please enter a password'
		},
		aboutMe : {
			type : String,
			default : ''
		},
		favMovies : {
			type : String,
			default : ''
		},
		favBooks : {
			type : String,
			default : ''
		},
		birthDate : {
			type : Date,
			default:
				utils.getServerDateString()
		},
		// MongoDB is recording this value as a double, 1234.0000 fix?
		uuid : {
			type : Number,
		default:
			intformat(flakeIdGen.next(), 'dec')
		},
		lastLoginDate : {
			type : Date,
		default:
			utils.getServerDateString()
		},
		lastUpdated : {
			type : Date,
			default:
				utils.getServerDateString()
		},
		created : {
			type : Date,
		default:
			utils.getServerDateString()
		}
	});

// We should only refuse when user is created.  user object should be updated...

// Check to see if this user already exists.
//userSchema.path('email').validate(function (value, next) {
//	userService.findUser(value, function (err, user) {
//		if (err) {
//			console.log(err);
//			return next(false);
//		}
//		// If the user exists, return false, else it will be null.
//		next(!user);
//	});
//}, 'Email already in use');

var User = mongoose.model('User', userSchema);

module.exports = {
	User : User
};