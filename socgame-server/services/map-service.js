var Map = require('../models/map').Map;
var Tile = require('../models/tile').Tile;
var utils = require('./util-service');
var Canvas = require('canvas');
var fs = require('fs');
var config = require('../config');

exports.xGridCount = 18;
exports.yGridCount = 18;

exports.findMap = function(mapKey, next) {
    Map.findOne({
        'map_key.i': parseInt(mapKey.i),
        'map_key.j': parseInt(mapKey.j),
        'map_key.k': parseInt(mapKey.k)
    }, function(err, map) {
        next(err, map);
    });
};

exports.getTileDefs = function(mapKey, next) {
    Tile.find({}, function(err, retTiles) {

        var tileArray = [];

        // Want to index this array by tile type
        retTiles.forEach(function(tile) {
            tileArray[tile.type] = tile;
        });

        next(err, tileArray);
    });
};

exports.createMap = function(map, next) {
    var newMap = new Map({
        map_key: {
            i: map.i,
            j: map.j,
            k: map.k
        },
        tiles: map.tiles
    });

    newMap.save(function(err) {
        if (err) {
            console.log(err);
            return next(err);
        }
        next(null, map);
    });
};

// Take a map and tiles object, render a HTML5 canvas image and return.
exports.renderMap = function(map, tiles, size, next) {
    // Get background image data
    // /home/ubuntu/workspace/service
    fs.readFile( __dirname + "/../res/GrassBGFULL.png", function(err, data) {
        if (err) {
            next(err);
        }               
                        
        var img = new Canvas.Image; // Create a new Image
        img.src = data;

        var canvas = new Canvas(size, size, 'png');
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);

        var tileSize = size / config.tilesPerMapRow;

        for (var i = 0; i < map.tiles.length; ++i) {

            var obj = map.tiles[i];

            var imgFilename = tiles[obj.type].img;
            var imgLoc = __dirname + "/../res/" + imgFilename;

            var tileData = fs.readFileSync(imgLoc);
            if (tileData) {
                var tileImg = new Canvas.Image; // Create a new Image
                tileImg.src = tileData;

                var xPos = obj.x * tileSize;
                var yPos = obj.y * tileSize;
                ctx.drawImage(tileImg, xPos, yPos, (tileSize + 1), (tileSize + 1));
            }
        }

        next(null, canvas);
    });
};
