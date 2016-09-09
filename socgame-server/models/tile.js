var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var utils = require('../services/util-service');

//TODO: Create tiles and map_key schemas to the map schema.
var tileSchema = new Schema(
        {
            type: {
                type: Number,
                min : 0,
                max : 3,
                required: 'Tile Type required'
            },
            img: {
                type: String
            },
            blockable: {
                type: Number,
				min : 0,
                max : 1,
                default: 0
            }
        }
);

var Tile = mongoose.model('Tile', tileSchema);

module.exports = {
    Tile: Tile
};