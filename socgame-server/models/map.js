var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mapService = require('../services/map-service');

var mapSchema = new Schema({
		map_key : {
			type : {
				i : {
					type : Number,
					required : 'Map Key i required'
				},
				j : {
					type : Number,
					required : 'Map Key j required'
				},
				k : {
					type : Number,
					required : 'Map Key k required'
				}
			},
			index : { unique : true },
			required : 'Map Key required'
		},
		tiles : [{
				x : {
					type : Number,
					required : 'Tile x required'
				},
				y : {
					type : Number,
					required : 'Tile y required'
				},
				type : {
					type : Number,
					required : 'Tile type required'
				}
			}
		]
	});

// Could replace mapSchema.path with unique index?
// person.index({ firstName: 1, lastName: 1}, { unique: true });
// Map keys must be unique

mapSchema.path('map_key').validate(function (value, next) {
	mapService.findMap(value, function (err, map) {
		if (err) {
			console.log(err);
			return next(false);
		}
		// If the map exists, return false, else it will be null.
		next(!map);
	});
}, 'Map already created');

var Map = mongoose.model('Map', mapSchema);

module.exports = {
	Map : Map
};