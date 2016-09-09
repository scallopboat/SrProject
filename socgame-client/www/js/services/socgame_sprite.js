/**
 * Created by ScallopBo on 11/13/2015.
 */

    var SpriteInterface = angular.module('SpriteInterface', ['SocGameServices'])
        .factory('Sprite', function ($rootScope, Map, CoordinateTools, Config, ScreenInfo, $http, HTTPRequest) {

            function css( element, property ) {
                return window.getComputedStyle( element, null ).getPropertyValue( property );
            }

            var spriteHandler = {};
            spriteHandler.hero = {};
            spriteHandler.others = [];

            var SpriteModel = function(spriteInfo){
                this.isAnimated = false;
                this.uuid = spriteInfo.uuid;
                this.displayName = spriteInfo.displayName;
                this.email = spriteInfo.email;
                this.firstName = spriteInfo.firstName;
                this.lastName = spriteInfo.lastName;
                this.spriteImage = spriteInfo.spriteImage;
                this.validUser = ('validUser' in spriteInfo && spriteInfo.validUser) ? true : false;
                this.i = spriteInfo.i;
                this.j = spriteInfo.j;
                this.k = spriteInfo.k;
                this.x = spriteInfo.x;
                this.y = spriteInfo.y;
                this.z = spriteInfo.z;
                this.aboutMe = spriteInfo.aboutMe;
                this.favMovies = spriteInfo.favMovies;
                this.favBooks = spriteInfo.favBooks;
                this.lastUpdated = new Date().toISOString();
                this.mapTransition = false;

                // Just needs to init to an old date.
                this.transTimeout = new Date('December 17, 1995 03:24:00');

                this.imgWidth = Map.tileSize;
                this.imgHeight = (Map.tileSize + Math.floor((Map.tileSize * .40)));

                // Set the image of the sprite on the map.
                var elem = document.createElement("img");
                elem.setAttribute("src", Config.getSpriteService + '/' +  this.spriteImage);
                elem.setAttribute("id", this.uuid);
                elem.style.height = this.imgHeight + "px";
                elem.style.width = this.imgWidth + "px";
                elem.style.left = (this.x * Map.tileSize) + "px";  // this needs to be calculated from x
                elem.style.top = (this.y * Map.tileSize) + "px"; // this needs to be calculated from y
                elem.style.position = "absolute";
                elem.style.zIndex = this.validUser ? "2" : "1";  // Only the hero gets the valid user definition, therefore gets the high index.
                document.getElementById("map_area").appendChild(elem);

                // Gets called on a window resize event.
                this.sendMessage = function(messageToSend){
                    var req = {};
                    req.gmtDate = this.lastUpdated;
                    req.message = messageToSend;
                    req.uuid = this.uuid;
                    req.i = this.i;
                    req.j = this.j;
                    req.k = this.k;
                    req.x = this.x;
                    req.y = this.y;
                    req.z = this.z;
                    req.type = 3;

                    HTTPRequest.post(Config.sendChat, req, function (ret) {

                        if(ret && ret.error !== 'true'){
                            SpriteModel.lastUpdated = new Date().toISOString();
                        } else {
                            console.log('Update chat error');
                        }
                    }, function (err) {
                        console.log('Update chat error');
                        console.log(err);
                    });
                };

                // Gets called on a window resize event.
                this.rePosition = function(oldWindowSize){
                    // Handle the resize
                    var elem = document.getElementById(this.uuid);

                    // Scale the sprite image size
                    this.imgWidth = Map.tileSize;
                    this.imgHeight = (Map.tileSize + Math.floor((Map.tileSize * .40)));
                    elem.style.height = this.imgHeight + "px";
                    elem.style.width = this.imgWidth + "px";

                    // Set the new left, top properties
                    elem.style.left = (this.x * Map.tileSize) + "px";
                    elem.style.top = (this.y * Map.tileSize) + "px";
                };

                this.destroy = function(){
                    var parent = document.getElementById("map_area");
                    var child = document.getElementById(this.uuid.toString());
                    parent.removeChild(child);
                };

                this.startLoading = function(){
                    $rootScope.$broadcast('startLoading');
                };
                
                this.endLoading = function(){
                    $rootScope.$broadcast('endLoading');
                };
                
                this.destroySprite = function(){
                    var parent = document.getElementById("map_area");
                    var child = document.getElementById(this.uuid.toString());
                    parent.removeChild(child);
                };

                this.move = function($event, next){
                    if(this.isAnimated){
                        next();
                        return;
                    }

                    // Need to do a position update here too?? maybe..
                    var coords = CoordinateTools.getMouseCoords($event);
                    console.log("Hero Coords");
                    console.log(coords);
                    // We have a double click at coords.x & coords.y
                    // Move the hero
                    var elem = document.getElementById(this.uuid);
                    var left = parseInt( css( elem, 'left' ), 10 );
                    var top = parseInt( css( elem, 'top' ), 10 );
                    var height = parseInt( css( elem, 'height' ), 10 );
                    var width = parseInt( css( elem, 'width' ), 10 );

                    // check to see if the desitination within the bounds of sprite image
                    //TODO: Fix clicking on sprite doesn't execute a move.
                    if(coords.x > left && coords.x < (left + width) && coords.y > top && coords.y < (top + height)){
                        return;
                    }

                    var dx = left - coords.x;
                    var dy = top - coords.y;
                    var i = 1;
                    var count = 30;
                    var delay = 30;
                    var last_left = elem.style.left;
                    var last_top = elem.style.top;
                    var portalOk = false;

                    // If destination is closer to the center of the image than the current location then we
                    // know the user isn't trying to exit the map.

                    // Find center of map.
                    var centerX = ScreenInfo.mapArea.width / 2;
                    var centerY = ScreenInfo.mapArea.height / 2;

                    // Get the deltas for current location and destination.
                    var destDx = Math.abs(centerX - coords.x);
                    var destDy = Math.abs(centerY - coords.y);
                    var currentX = parseInt(last_left, 10);
                    var currentY = parseInt(last_top, 10);
                    var currentDx = Math.abs(centerX - currentX);
                    var currentDy = Math.abs(centerY - currentY);
                    var newMap = false;

                    // Determine whether or not the sprite is walking towards a portal
                    if(destDx > currentDx || destDy > currentDy){
                        portalOk = true;
                    }

                    function loop(parent) {

                        var x = parseInt( css( elem, 'left' ), 10 );
                        var y = parseInt( css( elem, 'top' ), 10 );

                        var heightOffset = Map.tileSize * .4;

                        // The px bounds of the sprite.
                        var spriteBounds = {
                            xMin: x,
                            xMax: (x + Map.tileSize) - 10,
                            yMin: y + heightOffset,
                            yMax: (y + Map.tileSize + heightOffset)  - 10
                        };

                        // The px center of the sprite
                        var spriteCenter = {
                            x: x + (Map.tileSize * .5),
                            y: y + (Map.tileSize * .5)
                        };

                        // Approximation of which tile the sprite is on
                        // Evaluated by which tile the center of the sprite is on.
                        var currentTileApprox = {
                            x: Math.floor(spriteCenter.x / (Map.tileSize)),
                            y: Math.floor(spriteCenter.y / (Map.tileSize))
                        };

                        if ( i >= count ) {
                            parent.isAnimated = false;
                            // Set the current "tile" the sprite is on.
                            parent.lastUpdated = new Date().toUTCString();
                            newMap = false;
                            next();
                            return;
                        }

                        i += 1;

                        if(parent.isAnimated && Map.isBlocked(spriteBounds)){
                            i = count + 1;
                            elem.style.left = last_left;
                            elem.style.top  = last_top;
                        } else {
                            parent.isAnimated = true;
                            if(portalOk && Map.isPortal(spriteBounds)){

                                var newTimeout = new Date();
                                var timeDiff = (newTimeout - parent.transTimeout) / 1000;
                                if( timeDiff <= 4) {
                                    last_left = elem.style.left;
                                    last_top = elem.style.top;
                                    elem.style.left = ( left - ( dx * i / count ) ).toFixed( 0 ) + 'px';
                                    elem.style.top  = ( top - ( dy * i / count ) ).toFixed( 0 ) + 'px';
                                } else {
                                    i = count + 1;
                                    // Need to determine direction of portal (N, E, W, S)
                                    // Change i,j accordingly
                                    var nextX = last_left;
                                    var nextY = last_top;

                                    // Start loading the new map.
                                    var req = {
                                        i: parent.i,
                                        j: parent.j,
                                        k: parent.k
                                    };

                                    //if(currentTileApprox.x <= 1){
                                    //    // Going West
                                    //    console.log("Moving west");
                                    //    --req.i;
                                    //    nextX = parseInt(last_left, 10) + (14 * Map.tileSize) + 'px';
                                    //}
                                    //if(currentTileApprox.x >= 16){
                                    //    // Going East
                                    //    console.log("Moving east");
                                    //    ++req.i;
                                    //    nextX = parseInt(last_left, 10) - (14 * Map.tileSize) + 'px';
                                    //}
                                    //if(currentTileApprox.y <= 1){
                                    //    // Going North
                                    //    console.log("Moving north");
                                    //    --req.j;
                                    //    nextY = parseInt(last_top, 10) + (14 * Map.tileSize) + 'px';
                                    //}
                                    //if(currentTileApprox.y >= 16){
                                    //    // going South
                                    //    console.log("Moving south");
                                    //    ++req.j;
                                    //    nextY = parseInt(last_top, 10) - (14 * Map.tileSize) + 'px';
                                    //}
                                    
                                    if(currentTileApprox.x <= 2){
                                        // Going West
                                        console.log("Moving west");
                                        --req.i;
                                        nextX = parseInt(last_left, 10) + (14 * Map.tileSize) + 'px';
                                    }
                                    if(currentTileApprox.x >= 15){
                                        // Going East
                                        console.log("Moving east");
                                        ++req.i;
                                        nextX = parseInt(last_left, 10) - (14 * Map.tileSize) + 'px';
                                    }
                                    if(currentTileApprox.y <= 2){
                                        // Going North
                                        console.log("Moving north");
                                        --req.j;
                                        nextY = parseInt(last_top, 10) + (14 * Map.tileSize) + 'px';
                                    }
                                    if(currentTileApprox.y >= 15){
                                        // going South
                                        console.log("Moving south");
                                        ++req.j;
                                        nextY = parseInt(last_top, 10) - (14 * Map.tileSize) + 'px';
                                    }

                                    if(parent.i >= -1 && parent.i <= 1 && parent.j >= -1 && parent.j <= 1){
                                        
                                        parent.mapTransition = true;
                                        parent.startLoading();
                                        spriteHandler.clearOthers();
                                        parent.updateStatus(function(){ return; });
                                        Map.getRenderedMap(req, function(success){
                                            if(success){
                                                newMap = true;
                                                //spriteHandler.clearOthers();
                                                parent.transTimeout = new Date();
                                                elem.style.left = nextX;
                                                elem.style.top  = nextY;
                                                
                                                //TODO: Try to update the user in here somewhere?

                                                // The px center of the sprite
                                                var SC = {
                                                    x: parseInt(nextX, 10) + (Map.tileSize * .5),
                                                    y: parseInt(nextY, 10) + (Map.tileSize * .5)
                                                };

                                                // Approximation of which tile the sprite is on
                                                // Evaluated by which tile the center of the sprite is on.
                                                var CTA = {
                                                    x: Math.floor(SC.x / (Map.tileSize)),
                                                    y: Math.floor(SC.y / (Map.tileSize))
                                                };

                                                parent.x = CTA.x;
                                                parent.y = CTA.y;
                                                parent.i = req.i;
                                                parent.j = req.j;

                                                i = count + 1;

                                                parent.lastUpdated = new Date().toUTCString();
                                                Map.loadedNewMap = true;
                                            }
                                            parent.isAnimated = false;
                                            parent.mapTransition = false;
                                            parent.endLoading();
                                            next();
                                            return;
                                        });
                                        
                                    } else {
                                        if (parent.i < -1){
                                            parent.i = -1;
                                        }
                                        if (parent.j < -1){
                                            parent.j = -1;
                                        }
                                        if (parent.i > 1){
                                            parent.i = 1;
                                        }
                                        if (parent.j > 1){
                                            parent.j = 1;
                                        }
                                    }
                                }

                            } else{
                                last_left = elem.style.left;
                                last_top = elem.style.top;
                                elem.style.left = ( left - ( dx * i / count ) ).toFixed( 0 ) + 'px';
                                elem.style.top  = ( top - ( dy * i / count ) ).toFixed( 0 ) + 'px';
                                if(!newMap){
                                    parent.x = currentTileApprox.x;
                                    parent.y = currentTileApprox.y;
                                }
                            }

                        }

                        setTimeout( function(){loop(parent);}, delay );
                    }
                    // Need to bring this scope into the loop function.
                    var parent = this;
                    loop(parent);
                    //next();
                };

                // Simplified version of move.
                this.moveOther = function(pos, next){

                    if(this.isAnimated){
                        return;
                    }

                    // Need to do a position update here too?? maybe..
                    var coords = pos;

                    var elem = document.getElementById(this.uuid);
                    var left = parseInt( css( elem, 'left' ), 10 );
                    var top = parseInt( css( elem, 'top' ), 10 );
                    var dx = left - coords.x;
                    var dy = top - coords.y;
                    var i = 1;
                    var count = 30;
                    var delay = 30;

                    function loop(parent) {

                        parent.isAnimated = true;

                        if ( i >= count ) {
                            parent.isAnimated = false;
                            // Set the current "tile" the sprite is on.
                            parent.lastUpdated = new Date().toUTCString();
                            next();
                            return;
                        }

                        i += 1;

                        elem.style.left = ( left - ( dx * i / count ) ).toFixed( 0 ) + 'px';
                        elem.style.top  = ( top - ( dy * i / count ) ).toFixed( 0 ) + 'px';

                        setTimeout( function(){loop(parent);}, delay );
                    }
                    // Need to bring this scope into the loop function.
                    var parent = this;
                    loop(parent);
                    //next();
                };


                /**
                * Method for updating the hero's position.
                * Only the hero should have need to use this method, but we'll see...
                */
                this.updateStatus = function(next){
                    
                    var updateUserUrl = Config.updateUser;

                    var heroUUID = this.uuid;

                    var req = {
                        x: this.x,
                        y: this.y,
                        z: this.z,
                        i: this.i,
                        j: this.j,
                        k: this.k,
                        uuid: this.uuid,
                        lastUpdated: this.lastUpdated
                    };

                    HTTPRequest.post(updateUserUrl, req, function (ret) {

                            this.lastUpdated = new Date().toUTCString();
                            next(true);

                        }, function (err) {
                            alert("Error occured when trying to update position");
                            console.log('Update error');
                            console.log(err);
                            next(false);
                        });
                };

                this.setPosition = function(){
                    var elem = document.getElementById(this.uuid);
                    this.x = parseInt( css( elem, 'left' ), 10 ) / Map.tileSize;
                    this.y = parseInt( css( elem, 'top' ), 10 ) / Map.tileSize;
                };
            };

            spriteHandler.clearOthers = function(){
                spriteHandler.others.forEach(function(other){
                    other.destroy();
                });

                spriteHandler.others = [];
            };

            spriteHandler.setOthers = function(spriteInfo){
                spriteHandler.others.push(new SpriteModel(spriteInfo));
            };

            spriteHandler.setHero = function(spriteInfo){
                spriteHandler.hero = new SpriteModel(spriteInfo);
            };

            spriteHandler.getSpriteByUUID = function(searchUUID){
                var retSprite = null;
                
                var indx = -1;
                
                if ('uuid' in spriteHandler.hero && searchUUID == spriteHandler.hero.uuid){
                    indx = 0;
                    retSprite = spriteHandler.hero;
                }
                
                for(var i = 0 ; i < spriteHandler.others.length ; ++i){
                    if(spriteHandler.others[i].uuid == searchUUID){
                        retSprite = spriteHandler.others[i];
                        indx = i;
                    }
                }

                return {index : indx, sprite : retSprite};
            };

            return spriteHandler;
        }
    );