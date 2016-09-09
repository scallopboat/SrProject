var express = require('express');
var router = express.Router();
var restrict = require('../auth/restrict');
var utils = require('../services/util-service');
var mapService = require('../services/map-service');
var fs = require('fs');
var readline = require('readline');

/**
 * @brief Takes values i,j,k and returns a json representation of the map.
 * @return json map with tile definitions.
 */
router.post('/get', /*restrict,*/ function (req, res, next) {
	var vm = {
		input : req.body,
		error : false,
		msg : 'Map sent'
	};

	// Make sure we have all the input fields.
	if (!('i' in vm.input) || !('j' in vm.input)) {
		vm.error = true;
		vm.msg = "Invalid input";
		res.send(vm);
		return;
	}

	if (!('k' in vm.input) || typeof vm.input.k === 'undefined') {
		vm.input.k = 0;
	}

	mapService.findMap(vm.input, function (err, map) {
		if (err) {
			vm.error = true;
			vm.msg = 'Unable to find map';
			res.send(vm);
			return;
		} else {

			mapService.getTileDefs(vm.input, function (err, tileDefs) {
				if (err) {
					vm.error = true;
					vm.msg = 'Unable to get tile definitions';
					res.send(vm);
					return;
				} else {
					vm.map = map;
					vm.tileDefs = tileDefs;
					vm.xGridCount = mapService.xGridCount;
					vm.yGridCount = mapService.yGridCount;
					res.send(vm);
					return;
				}
			});
		}
	});
});

/**
 * @brief Takes i,j,k values and returns a rendered map image.
 * @return image
 */
router.post('/render', /*restrict,*/ function (req, res, next) {

    var vm = {
		input : req.body,
		error : false,
		msg : 'Map sent'
	};

	// Make sure we have all the input fields.
	if (!('i' in vm.input) || !('j' in vm.input)) {
		vm.error = true;
		vm.msg = "Invalid input";
		res.send(vm);
		return;
	}

	if (!('k' in vm.input) || typeof vm.input.k === 'undefined') {
		vm.input.k = 0;
	}

    // Default image size.
    var size = 300;

    if('size' in vm.input){
        size = parseInt(vm.input.size);
    }

	mapService.findMap(vm.input, function (err, map) {
		if (err) {
			vm.error = true;
			vm.msg = 'Unable to find map';
			res.send(vm);
			return;
		} else {

			mapService.getTileDefs(vm.input, function (err, tileDefs) {
				if (err) {
					vm.error = true;
					vm.msg = 'Unable to get tile definitions';
					res.send(vm);
					return;
				} else {

                    mapService.renderMap(map, tileDefs, size, function(err, canvas){
				        console.log(canvas);
				        console.log(err);
				        if(err){
                            res.writeHead(500);
				        	vm.error = true;
				        	vm.msg = 'Unable to render map';
				        	res.send(vm);
                            res.end();
                            return;
				        }

                        res.writeHead(200, {'content-type' : 'image/png'});
                        res.write( canvas.toDataURL() );
                        res.end();
                        return;
                    });
					return;
				}
			});
		}
	});
});

// Create a new map.  This route should not be publicly available.
router.post('/set', /*restrict,*/ function (req, res, next) {
	var vm = {
		input : req.body,
		error : false,
		msg : 'Map Created.'
	};

	// Quick dirty check to ensure that this is an admin.
	//if (req.session.email !== 'scallopboat@gmail.com') {
	//	vm.error = true;
	//	vm.msg = "Invalid user";
	//	res.send(vm);
	//}

	// Make sure we have all the input fields.
	if (!('i' in vm.input) || !('j' in vm.input)) {

		vm.error = true;
		vm.msg = "Invalid input";
		res.send(vm);
	}

	if (!('k' in vm.input) || typeof vm.input.k == 'undefined') {
		vm.input.k = 0;
	}

	mapService.createMap(vm.input, function (err, map) {
		if (err) {
			vm.error = true;
			vm.msg = 'Unable to create map';
			res.send(vm);
		} else {
			res.send(vm);
		}
	});
});

// For the scallopboat only.  Kills the map document and regenerates
// from the text file '../MapTemplates/MapLayouts.txt'
router.get('/regenerate', /*restrict,*/ function (req, res, next) {

	var vm = {
		input : req.body,
		error : false,
		msg : 'Map Created.'
	};

	// Quick dirty check to ensure that this is an admin.
	//if (req.session.email !== 'scallopboat@gmail.com') {
	//	vm.error = true;
	//	vm.msg = "Invalid user";
	//	res.send(vm);
	//}

	var y = 0;
	var map = {
		tiles : []
	};

	// Needs to be redone in such a way that it streams the file rather than load into memory..
	var mapFile = fs.readFileSync("../MapTemplates/MapLayouts.txt").toString().split("\n"); //.forEach(function (line, index, arr) {

	for (var i = 0; i < mapFile.length; ++i) {

		// Ditch any \r and trim any white space
		line = mapFile[i].replace("\r", "").trim();

		// skip ';' comments and blank lines.
		if (line.length == 0 || line[0] == ';') {
			continue;
		}

		// Look for MAP|i|j|k
		var mapLocation = line.split("|");
		if (mapLocation.length == 4 && mapLocation[0] == "MAP") {

			// Starting a new map.
			y = 0;
			map = {
				tiles : []
			};

			// If we already have a mapLocation and an array of tiles, then we need to store this off to mongo before starting the next map.
			map.i = parseInt(mapLocation[1]);
			map.j = parseInt(mapLocation[2]);
			map.k = parseInt(mapLocation[3]);
			continue;
		}

		if (line == "END") {
			// We should have a complete map at this point. Store it.
			if ("i" in map && "j" in map && "k" in map) {

				mapService.createMap(map, function (err, map) {
					if (err) {
						vm.error = true;
						vm.msg = 'Unable to create map';
						res.send(vm);
						return;
					}
				});
			}
			continue;
		}

		for (var x = 0; x < line.length; ++x) {

			// If we have a valid tile type here, add it to the tiles array.
			if (utils.isNumeric(line[x])) {

				var numericType = parseInt(line[x]);

				if (numericType > 0 && numericType < 4) {
					map.tiles.push({
						x : x,
						y : y,
						type : numericType
					});
				}
			}
		}
		++y;
	}

	res.send(vm);
});

module.exports = router;
