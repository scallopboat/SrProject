var SocGameServices = angular.module('SocGameServices', ['SpriteInterface'])
    .service('Config', function () {

        //var socGameServer = 'http://192.168.0.13:3000/';
        var socGameServer = 'http://ec2-52-37-45-24.us-west-2.compute.amazonaws.com:3000/';
        this.ip = socGameServer;
        this.loginService = this.ip + 'users/login';
        this.loginService = this.ip + 'users/login';
        this.createUserService = this.ip + 'users/create';
        this.renderMapService = this.ip + 'maps/render';
        this.getMapService = this.ip + 'maps/get';
        this.getSpriteService = this.ip + 'hero';
        this.getAvailableSpritesService = this.ip + 'users/getAvailableSprites';
        this.updateUser = this.ip + 'users/update';
        this.updateProfile = this.ip + 'users/updateProfile';
        this.updateEvents = this.ip + 'users/updateEvents';
        this.sendChat = this.ip + 'chat/send';

        this.SetServer = function(ip){
            this.ip = 'http://' + ip + '/';
            this.loginService = this.ip + 'users/login';
            this.loginService = this.ip + 'users/login';
            this.createUserService = this.ip + 'users/create';
            this.renderMapService = this.ip + 'maps/render';
            this.getMapService = this.ip + 'maps/get';
            this.getSpriteService = this.ip + 'hero';
            this.getAvailableSpritesService = this.ip + 'users/getAvailableSprites';
            this.updateUser = this.ip + 'users/update';
            this.updateProfile = this.ip + 'users/updateProfile';
            this.updateEvents = this.ip + 'users/updateEvents';
            this.sendChat = this.ip + 'chat/send';
        };
    })
/**
 * Global holder for screen information.
 * Handles window resize event.
 *
 * Sample data for getBoundingClientRect()
 * bottom: 942.6666870117188
 * height: 942.6666870117188
 * left: 364.25
 * right: 1457.041748046875
 * top: 0
 * width: 1092.791748046875
 * @returns {socgame_services_L15.socgame_servicesAnonym$2}
 */
    .service('ScreenInfo', function () {
        this.mapArea = {};

        this.rightMenu = {};
        this.parentWrapper = {};

        this.setSize = SetWindowInfo;

        // It's possible we'll want to handle other things in here after the change.  Like making the sprites a
        // consistent size.
        function SetWindowInfo() {
            this.mapArea = document.getElementById("map_area").getBoundingClientRect();
            this.rightMenu = document.getElementById("right_menu_parent").getBoundingClientRect();
            this.parentWrapper = document.getElementById("parent_wrapper").getBoundingClientRect();
            console.log('Window Sizes SET');
        }
    })

    /**
     * Global holder for http requests
     */
    .service('HTTPRequest', function ($http) {
        this.post = function(url, params, success, error){
            $http.post(url, params).then(success, error);    
        };
        
        this.get = function(url, params, success, error){
            $http.get(url, params).then(success, error);    
        };
        
    })

    .service('DeviceInfo', function () {
        
        this.device = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
        
        this.get = function(){
            
            return (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
        };
        
        this.verbose = function(){
        
            var deviceInfo = {};    
            
            deviceInfo.device = this.device;
            
            deviceInfo.isCordova = false;
            
            if ((window.cordova || window.PhoneGap || window.phonegap) && /^file:\/{3}[^\/]/i.test(window.location.href) && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)) {
                deviceInfo.isCordova = true;
            }
            
            deviceInfo.isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            
            deviceInfo.isFirefox = typeof InstallTrigger !== 'undefined';
            
            deviceInfo.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
            
            deviceInfo.isIE = /*@cc_on!@*/false || !!document.documentMode;
            
            deviceInfo.isEdge = !deviceInfo.isIE && !!window.StyleMedia;
            
            deviceInfo.isChrome = !!window.chrome && !!window.chrome.webstore;
            
            return deviceInfo;
        };
    })


    .service('CoordinateTools', function (DeviceInfo) {
        // Helper functions for mouse events
        // Accepts a MouseEvent as input and returns the x and y
        // coordinates relative to the target element.
        var getCrossBrowserElementCoords = function (mouseEvent)
        {
            var result = {
                x: 0,
                y: 0
            };

            if (!mouseEvent)
            {
                mouseEvent = window.event;
            }

            var platformInfo = DeviceInfo.verbose();
            
            var device = platformInfo.device;
            
            if('changedTouches' in mouseEvent && 'pageX' in mouseEvent.changedTouches[0]){
                if ( device == 'iPad' || device == 'iPhone' ) {
                    result.x = mouseEvent.changedTouches[0].screenX;
                    result.y = mouseEvent.changedTouches[0].screenY;
                } else {
                    result.x = mouseEvent.changedTouches[0].pageX;
                    result.y = mouseEvent.changedTouches[0].pageY;    
                }
            }
            else if (mouseEvent.pageX || mouseEvent.pageY)
            {
                result.x = mouseEvent.pageX;
                result.y = mouseEvent.pageY;
            }
            else //if (mouseEvent.clientX || mouseEvent.clientY)
            {
                result.x = mouseEvent.clientX + document.body.scrollLeft +
                    document.documentElement.scrollLeft;
                result.y = mouseEvent.clientY + document.body.scrollTop +
                    document.documentElement.scrollTop;
            }
            
            console.log("Target");
            console.log(mouseEvent.target.id);
            
            var intendedTarget = mouseEvent.target;
            
            if (intendedTarget.id != 'map') {
                intendedTarget = mouseEvent.parentElement;
            }
            
            if (intendedTarget)
            {
                var offEl = intendedTarget;
                var offX = 0;
                var offY = 0;

                if (typeof(offEl.offsetParent) != "undefined")
                {
                    while (offEl)
                    {
                        offX += offEl.offsetLeft;
                        offY += offEl.offsetTop;

                        offEl = offEl.offsetParent;
                    }
                }
                else
                {
                    offX = offEl.x;
                    offY = offEl.y;
                }

                result.x -= offX;
                result.y -= offY;
            }

            return result;
        };

        this.getMouseCoords = function (mouseEvent)
        {
            return getCrossBrowserElementCoords(mouseEvent);
        };
    })



    .factory('Map', function (ScreenInfo, Config, $http) {

        var map = {};
        map.blockables = [];
        map.portals = [];
        map.position = {};
        map.tiles = [];
        map.tileDefs = [];
        map.xGridCount = 18;
        map.yGridCount = 18;
        map.imgData = null;
        map.transTimeout = new Date('December 17, 1995 03:24:00');

        // kind of a hack calling this here, but we can fix that later.
        ScreenInfo.setSize();

        map.tileSize = ScreenInfo.mapArea.width / map.xGridCount;

        map.isBlocked = function(objBounds){

            var tileSize = ScreenInfo.mapArea.width / map.xGridCount;

            for(var i = 0; i < this.blockables.length ; ++i){

                var tile = this.blockables[i];
                var xLowerBound = (tile.x * tileSize);
                var xUpperBound = (tile.x * tileSize) + tileSize;
                var yLowerBound = (tile.y * tileSize);
                var yUpperBound = (tile.y * tileSize) + tileSize;

                if ( ( (objBounds.xMin > xLowerBound && objBounds.xMin < xUpperBound) || (objBounds.xMax > xLowerBound && objBounds.xMax < xUpperBound) ) &&
                    ( (objBounds.yMin > yLowerBound && objBounds.yMin < yUpperBound) || (objBounds.yMax > yLowerBound && objBounds.yMax < yUpperBound) ) ) {
                    return true;
                }

                if(( objBounds.xMin <= ScreenInfo.mapArea.left || objBounds.xMax >= ScreenInfo.mapArea.right ||
                     objBounds.yMin <= ScreenInfo.mapArea.top  || objBounds.yMax >= ScreenInfo.mapArea.bottom) ) {
                    return true;
                }
            }
            return false;
        };

        map.isPortal = function(objBounds){
            var tileSize = ScreenInfo.mapArea.width / map.xGridCount;

            for( var i = 0; i < this.portals.length ; ++i ){

                var tile = this.portals[i];
                
                var xLowerBound = (tile.x * tileSize) - (tileSize * 0.5);
                var xUpperBound = (tile.x * tileSize) + tileSize + (tileSize * 0.5);
                var yLowerBound = (tile.y * tileSize) - (tileSize * 0.5);
                var yUpperBound = (tile.y * tileSize) + tileSize + (tileSize * 0.5);

                if ( ( (objBounds.xMin > xLowerBound && objBounds.xMin < xUpperBound) || (objBounds.xMax > xLowerBound && objBounds.xMax < xUpperBound) ) &&
                    ( (objBounds.yMin > yLowerBound && objBounds.yMin < yUpperBound) || (objBounds.yMax > yLowerBound && objBounds.yMax < yUpperBound) ) ) {
                    return true;
                }
            }
            return false;
        };

        map.resetTileSize = function(){
            map.tileSize = ScreenInfo.mapArea.width / map.xGridCount;
        };

        map.findTile = function (x, y) {
            // Calculate tile size, bounds, etc.
            // Gets kinda mathy here..
            this.tileSize = ScreenInfo.mapArea.width / map.xGridCount;

            for(var i = 0; i < this.tiles.length ; ++i){

                var tile = this.tiles[i];

                var xLowerBound = (tile.x * this.tileSize);
                var xUpperBound = (tile.x * this.tileSize) + this.tileSize;
                var yLowerBound = (tile.y * this.tileSize);
                var yUpperBound = (tile.y * this.tileSize) + this.tileSize;

                if (x > xLowerBound && x < xUpperBound && y > yLowerBound && y < yUpperBound) {
                    tile.index = i;
                    tile.details = this.findTileDetails(tile.type);
                    console.log('Tile in findTile FOUND');
                    console.log(tile);
                    return tile;
                }
            }

            return null;
        };

        map.findTileDetails = function (type) {

            for(var i = 0; i < this.tileDefs.length ; ++i){

                var def = this.tileDefs[i];

                if(!def){
                    continue;
                }

                if (def.type == type) {
                    return def;
                }
            }

            return null;
        };

        map.setMapActionPoints = function(){
            // iterate through tiles
            // set full blockable buildings (array or xmin,xmax,ymin,ymax)
            // set all portals and their corresponding request (ie get map i,j)
            map.tiles.forEach(function(tile){
                var details = map.findTileDetails(tile.type);

                if(details.blockable == 1) {
                    map.blockables.push({x: tile.x, y: tile.y});
                }

                // Looking for doors here.
                if(details.type == 3){
                    map.portals.push({x: tile.x, y: tile.y});
                }

                // Looking for paths that are on the border of the map (portals to new map)
                //TODO: This should leverage the grid member vars, not hard coded numbers.
                if(tile.type == 2 && (tile.x == 0 || tile.x == 17 || tile.y == 0 || tile.y == 17)){
                   // console.log('Found border tile:');
                   // console.log(tile);
                    map.portals.push({x: tile.x, y: tile.y});
                }
            });
        };

        map.set = function (mapDef) {
            this.position = mapDef.map.map_key;
            this.tiles = mapDef.map.tiles;
            this.tileDefs = mapDef.tileDefs;
            this.xGridCount = mapDef.xGridCount;
            this.yGridCount = mapDef.yGridCount;
            this.setMapActionPoints();
        };

        map.clearTiles = function(){
            map.position = {};
            map.tiles = [];
            map.blockables = [];
            map.portals = [];
            map.tileDefs = [];
        };

        map.getRenderedMap = function(req, next){

            var newTimeout = new Date();
            var timeDiff = (newTimeout - this.transTimeout) / 1000;
            if( timeDiff <= 3){
                //next(false);
                //return;
            }

        var renderUrl = Config.renderMapService;
        var tileDefUrl = Config.getMapService;

        // Set the screen info here.
        req.size = ScreenInfo.mapArea.width;

        $http.post(renderUrl, req)
            .then(function (image) {

                $http.post(tileDefUrl, req)
                    .then(function (mapData) {
                        // We only want to set both map properties if the call went ok.
                        map.clearTiles();
                        // Clear other sprites on new map.
                        
                        map.set(mapData.data);
                        map.imgData = image.data;
                        map.transTimeout = new Date();
                        next(true);

                    }, function (err) {
                        alert("An error occured when getting tile definitions");
                        next(false);
                        console.log(err);
                    });

            }, function (err) {
                alert("An error occured when getting rendered map");
                next(false);
                console.log(err);
            });
        };
        
        return map;
    }
)
    .factory('Chat', function (Config, $http) {
            var chat = {};

            // Implement chat functionality.

            return chat;
        }
    );
