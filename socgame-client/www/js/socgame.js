/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//
var socgame = angular.module('socgame', ['ngAnimate', 'ngTouch', 'ui.bootstrap', 'SocGameServices', 'SpriteInterface']);

socgame.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

socgame.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function(file, uploadUrl){
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .success(function(){
            })
            .error(function(){
            });
    };
}]);

/*
 * Main controller for game.
 * @param {type} param1
 * @param {type} param2
 */
socgame.controller('mainController', function ($rootScope, $scope, $sce, $http, $interval, HTTPRequest, Config, $uibModal, Sprite, ScreenInfo, Map, $window) {

    $scope.user = {};
    $scope.user.email = "scallopboat@gmail.com";
    //$scope.user.email = "";
    $scope.user.password = "test";
    //$scope.user.password = "";
    $scope.user.isNew = false;
    $scope.user.validUser = false;
    $scope.welcome = {}; // object for Welcome modals
    $scope.items = [0, 1, 2];
    $scope.mapImg = Map.imgData;
    $scope.heroImage = null;
    $scope.animation = false;
    $scope.inMotion = false;
    $scope.mapLastUpdated = new Date().toUTCString();
    $scope.hasInit = false;
    $scope.hideUser = false;
    $scope.currentOther = {};
    $scope.currentOther.name = "Test User Profile";
    $scope.imageFile = null;
    $scope.dispOther = {};
    $scope.editProfile = true;
    $scope.spriteImageBaseUrl = Config.getSpriteService;
    $scope.tabs = {
        chat : true,
        others : false,
        editProfile: false
    };
    
    // Alert header
    $scope.notification = '';
    
    //Location for header
    $scope.location = 'Chat';
    
    $scope.status = {
        isopen: false
    };
    
    // Loading div
    $scope.loading = false;
    $scope.loadMessage = "Logging In";
    // Chat related
    $scope.chat = {};
    $scope.chat.toSendMessage = '';
    $scope.chat.allMessages = [];
    $scope.helpWanted = false;
    
    var msgIds = [];
    
    //$scope.test = function(){ alert("Keyboard is OFF");};

    $rootScope.$on('startLoading', function () {
             $scope.loading = true;
        });

    $rootScope.$on('endLoading', function () {
             $scope.loading = false;
        });
    
    $scope.switchView = function(id){
        document.getElementById('chat-wrapper').style.display = 'none';
        document.getElementById('dispOther').style.display = 'none';
        document.getElementById('edit-profile').style.display = 'none';
        document.getElementById('about').style.display = 'none';
        document.getElementById(id).style.display = 'inline';
        
        $scope.location = id == 'chat-wrapper' ? 'Chat' : id == 'dispOther' ? 'Profile' : id == 'edit-profile' ? 'Edit Profile' : id == 'about' ? 'About' : 'Unknown';
        $scope.status.isopen = false;
        
        if (id == 'chat-wrapper') {
            $scope.notification = '';
        }
    };
    
    $scope.toggleDropdown = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.status.isopen = !$scope.status.isopen;
    };
    
    $interval(function(){
        var menu = document.getElementById("right_menu_parent");
        menu.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";
        menu.style.height = "100vh";//ScreenInfo.parentWrapper.height + "px";

        var tabs = document.getElementsByClassName("menu");

        if('style' in tabs && 'height' in tabs.style){
            tabs.style.height =  (ScreenInfo.parentWrapper.height) + "px";
        }

        //tabs = document.getElementById("tabs");
        //tabs.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";
        //tabs.style.height =  (ScreenInfo.parentWrapper.height) + "px";
        //
        //tabs = document.getElementById("receive-message-area");
        //tabs.style.height =  "55vh";
    }, 100);

    function CheckCurrentOthers(currentSpriteArray, newSpriteArray, i) {
        
        var found = false;
        
        newSpriteArray.forEach(function(other){
            if(currentSpriteArray[i].uuid == other.uuid){
                Sprite.others[i].displayName = other.displayName;
                Sprite.others[i].firstName = other.firstName;
                Sprite.others[i].lastName = other.lastName;
                Sprite.others[i].aboutMe = other.aboutMe;
                Sprite.others[i].favBooks = other.favBooks;
                Sprite.others[i].favMovies = other.favMovies;
                
                if (other.uuid == $scope.dispOther.uuid) {
                    $scope.dispUSer = other;
                }
                
                found = true;
            }
        });
        
        return found;
        
    }
    
    // Perform this every second.
    var updateInProgress = false;
    $interval(function () {
        var menu = document.getElementById("right_menu_parent");
        
        menu.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";

        var tabs = document.getElementsByClassName("menu");

        if('style' in tabs){
            tabs.style.height =  (ScreenInfo.parentWrapper.height) + "px";
        }

        if(updateInProgress || Sprite.hero.mapTransition){
        
            return;
        }

        updateInProgress = true;

        if ($scope.hasInit === false) {
            updateInProgress = false;
            return;
        }

        var updateEventUrl = Config.updateEvents;

        var heroUUID = angular.copy(Sprite.hero.uuid);

        var req = angular.copy(Sprite.hero);

        HTTPRequest.post(updateEventUrl, req, function (ret) {

            var toDestroy = [];
            var foundUUIDs = [];

            if (!('msgList' in ret.data)) {
                console.log('MESSAGE NOT FOUND!');
            }

            // Look for any sprites that need to be removed. If a sprite in Sprite.others does not exist in data.others then destroy the character.
            for(var i = 0 ; i < Sprite.others.length ; ++i){
                
                if(!CheckCurrentOthers(Sprite.others, ret.data.others, i)){
                    toDestroy.push(i);
                } else {
                    foundUUIDs.push(Sprite.others[i].uuid);
                }
            }

            // Removal of image from map happens in the destroy method, then remove the object from the array.
            toDestroy.forEach(function(i){
                if (typeof Sprite.others[i] != 'undefined') {
                    Sprite.others[i].destroySprite();
                    Sprite.others.splice(i, 1);
                }
                
            });
            
            // If other is in Sprite.others and the x,y position has not changed, then do nothing.
            if (!Sprite.hero.mapTransition) {
                ret.data.others.forEach(function(other) {
            
                    // If other is not in Sprite.others then add the new character.
                    if ((other.uuid != heroUUID) && (foundUUIDs.indexOf(other.uuid) == -1)) {
                        Sprite.setOthers(other);
                    }
                    // If other is in Sprite.others and the x,y position has changed, then move the character.
                    else if ((other.uuid != heroUUID) && (foundUUIDs.indexOf(other.uuid) > -1)) {
            
                        var current = Sprite.getSpriteByUUID(other.uuid);
            
                        if ((current.sprite.x != other.x) || (current.sprite.y != other.y)) {
            
                            var pos = {
                                x: other.x * Map.tileSize,
                                y: other.y * Map.tileSize
                            };
            
                            Sprite.others[current.index].moveOther(pos, function() {
                                Sprite.others[current.index].x = other.x;
                                Sprite.others[current.index].y = other.y;
                            });
                        }
                    }
            
                });
            }
            
            // msgList
            ret.data.msgList.forEach(function(msgObj){
                var name = 'unknown';
                Sprite.others.forEach(function(other){
                    if(other.uuid == msgObj.uuid) {
                        name = other.displayName;
                    }
                });
                
                var checkId = msgObj._id;
                
                // For Android it's possible their time is offset. so never log the same message twice.
                if (msgIds.indexOf(msgObj._id) < 0) {
                    msgIds.push(msgObj._id);
                    $scope.chat.allMessages.push(name + ' : ' + msgObj.msg.toString());
                    
                    if (document.getElementById('chat-wrapper').style.display == 'none') {
                        $scope.notification = 'New message from ' + name;
                    }
                    
                }
                
                var objDiv = document.getElementById("receive-message-area");
                objDiv.scrollTop = objDiv.scrollHeight;
                
            });

            if(ret.data.msgList.length > 0){
                Sprite.hero.lastUpdated = new Date().toISOString();
            }

            $scope.mapLastUpdated = new Date().toUTCString();

            updateInProgress = false;

        }, function (err) {
            console.log('Update error');
            console.log(err);
            updateInProgress = false;
        });
    }, 2000);

    $scope.$watch(function () { return Map.imgData; }, function (newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
            $scope.mapImg = Map.imgData;
        }
    });

    $scope.uploadImage = function(){
        var file = $scope.imageFile;
        console.log('file is ' );
        console.dir(file);
        var uploadUrl = "/fileUpload";
        fileUpload.uploadFileToUrl(file, uploadUrl);
    };

    /////// Edit Profile
    $scope.noWrapSlides = false;
    $scope.sprites = [];

    // Temp until get permanent server
    $scope.serverIp = '';

    $scope.SetIP = function(){
        var ip = $scope.serverIp;

        Config.SetServer(ip);
    };
    // Temp until get permanent server

    var slides = $scope.slides = [];
    $scope.addSlide = function(spriteObj) {
        
        slides.push({
            image: Config.getSpriteService + '/' + spriteObj.fileName,
            text: spriteObj.text,
            file: spriteObj.fileName
        });
    };

    $scope.GetSpriteImage = function(fileName){
        var url = Config.getSpriteService;

        var data = {fileName: fileName};

        $http.post(url, data).then(function(ret){
            if(ret.data.error){
                console.log(ret.data.msg);
                return null;
            }

            return ret.data;

        }, function (err) {
            console.log(err);
            return null;
        });
    };

    $scope.GetAllSprites = function(){
        var url = Config.getAvailableSpritesService;

        $http.post(url).then(function(ret){
            if(ret.data.error){
                console.log(ret.data.msg);
                return;
            }

            if(ret.data && Array.isArray(ret.data)){
                $scope.sprites = ret.data;

                angular.forEach(ret.data, function(spriteObj){
                    $scope.addSlide(spriteObj);
                });
            }

        }, function (err) {
            console.log(err);
        });
    };
    /////////////// Edit Profile end

    $scope.updateProfile = function(){
        console.log("Profile Update!");
        console.log($scope.user);
        
        var url = Config.updateProfile;

        var data = {
            uuid: Sprite.hero.uuid,
            displayName: $scope.user.displayName,
            firstName: $scope.user.firstName,
            lastName: $scope.user.lastName,
            aboutMe: $scope.user.aboutMe,
            favMovies: $scope.user.favMovies,
            favBooks: $scope.user.favBooks
        };

        $http.post(url, data).then(function(ret){
            if(ret.data.error){
                console.log(ret.data.msg);
            } else {
                // Update Sprite.hero in form and class
                Sprite.hero.aboutme = data.aboutMe;
                Sprite.hero.favMovies = data.favMovies;
                Sprite.hero.favBooks = data.favBooks;
            }
            
        }, function (err) {
            console.log(err);
            return null;
        });
        
        // Android makes me do this...
        tabs = document.getElementById("edit-profile");
        tabs.style.height =  "87vh";
    };
    
    /**
     * Runs when body is loaded.
     * @returns {undefined}
     */
    $scope.init = function () {

        var serverIp = '';
        //serverIp = prompt("Server Override?  Leave blank to default : " + Config.ip);

        if (serverIp !== null && serverIp.trim() !== '') {
            Config.SetServer(serverIp);
        }

        ScreenInfo.setSize();
        
        // Fix the right menu issue..
        var menu = document.getElementById("right_menu_parent");
        menu.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";

        $scope.DisplayLogin();
        $scope.GetAllSprites();
    };
    
    // Monitor for window resize
    angular.element($window).bind('resize', function () {

        var mapArea = ScreenInfo.mapArea;
        var rightMenu = ScreenInfo.rightMenu;
        var parentWrapper = ScreenInfo.parentWrapper;

        var oldWindowSize = {mapArea: mapArea, rightMenu: rightMenu, parentWrapper: parentWrapper};

        ScreenInfo.setSize();
        Map.resetTileSize();

        // Fix the right menu issue..
        var menu = document.getElementById("right_menu_parent");
        menu.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";
        menu.style.height =  ScreenInfo.mapArea.width + "px";

        if ('hero' in Sprite && 'rePosition' in Sprite.hero) {
            Sprite.hero.rePosition(oldWindowSize);
        }
        
        Sprite.others.forEach(function(sprite){
            sprite.rePosition(oldWindowSize);
        });
        
        var optionWrapper = document.getElementById("option-wrapper");
                        
        var menuWrapper = document.getElementById("menu-wrapper").getBoundingClientRect();
        
        optionWrapper.style.height = (ScreenInfo.rightMenu.height - menuWrapper.height - 5) + "px";
    });

    $scope.sendMessage = function(){

        var messageToSend = angular.copy($scope.chat.toSendMessage);

        Sprite.hero.sendMessage(messageToSend);

        $scope.chat.toSendMessage = '';

        $scope.chat.allMessages.push(Sprite.hero.displayName + ' : ' + messageToSend.toString());

        var menu = document.getElementById("right_menu_parent");
        menu.style.width =  (ScreenInfo.parentWrapper.width - ScreenInfo.mapArea.width) + "px";

        var tabs = document.getElementsByClassName("menu");

        if('style' in tabs && 'height' in tabs.style){
            tabs.style.height =  (ScreenInfo.parentWrapper.height) + "px";
        }
        
        // receive-message-area
        //tabs = document.getElementById("receive-message-area");
        //tabs.style.height =  "55vh";
        //
        //tabs = document.getElementById("chat-wrapper");
        //tabs.style.height =  "80vh";
        
        var objDiv = document.getElementById("receive-message-area");
        objDiv.scrollTop = objDiv.scrollHeight;
    };

    $scope.DisplayLogin = function () {

        $scope.modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'LoginScreen.html',
            controller: 'LoginScreenController',
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            resolve: {
                user: function () {
                    return $scope.user;
                }
            }
        }).result.then(function (result) {
                if (result.validUser) {
                    
                    $scope.loading = true;
                    
                    Map.getRenderedMap(result, function(){
                        Sprite.setHero(result);
                        
                        $scope.dispOther = Sprite.hero;
                        $scope.hasInit = true;
                        $scope.user = angular.copy(Sprite.hero);
                        $scope.loading = false;
                        $scope.loadMessage = "Loading";
                        
                        var optionWrapper = document.getElementById("option-wrapper");
                        
                        var menuWrapper = document.getElementById("menu-wrapper").getBoundingClientRect();
                        
                        optionWrapper.style.height = (ScreenInfo.rightMenu.height - menuWrapper.height - 5) + "px";
                    });

                    console.log("Login Return");
                    console.log(result);
                }
            });
    };

    var customClick = {
        firstClickTime : null,
        waitingSecondClick : false,
        isSecondClick : false,
        DblClickInterval : 300 //milliseconds
    };

    $scope.ExecuteClickEventOnMap = function ($event) {
        // NgTouch does not support the double click directive.  Make one.
        if ($scope.loading) {
            return;
        }
        if (!customClick.waitingSecondClick) {
            customClick.firstClickTime = (new Date()).getTime();
            customClick.waitingSecondClick = true;

            setTimeout(function () {
                customClick.waitingSecondClick = false;
                if(!customClick.isSecondClick)
                {
                    // Get uuid of clicked user.  Which is also the id tag of html element.
                    var uuidToFind = $event.srcElement.id;
                    
                    // Get the user info.
                    var found = Sprite.getSpriteByUUID(uuidToFind);
                    
                    if (('sprite' in found) && found.sprite) {
                        $scope.editProfile = found.sprite.uuid == Sprite.hero.uuid;
                        $scope.dispOther = found.sprite;
                        
                        if ($scope.editProfile) {
                            $scope.switchView('edit-profile');
                        } else {
                            $scope.switchView('dispOther');
                        }
                        
                    }
                }
                
                customClick.isSecondClick = false;
                
            }, customClick.DblClickInterval);
        }
        else {
            customClick.waitingSecondClick = false;

            var time = (new Date()).getTime();
            if (time - customClick.firstClickTime < customClick.DblClickInterval) {
                customClick.isSecondClick = true;

                $scope.inMotion = true;

                Sprite.hero.move($event, function () {

                    Sprite.hero.updateStatus(function(){
                        $scope.inMotion = false;
                    });
                });
            }
        }
    };
});

/*
 * Modal Controllers
 */
angular.module('socgame').controller('LoginScreenController', function ($scope, $http, $modalInstance, user, Config, HTTPRequest) {

    $scope.user = user;
    $scope.verifyPassword = '';
    $scope.goodToGo = true;
    $scope.message = {color: 'red', text: ''};
    $scope.noWrapSlides = false;
    $scope.sprites = [];

    // Temp until get permanent server
    $scope.serverIp = '';

    $scope.SetIP = function(){
        var ip = $scope.serverIp;

        Config.SetServer(ip);
    };
    // Temp until get permanent server

    var slides = $scope.slides = [];
    $scope.addSlide = function(spriteObj) {

        slides.push({
            image: Config.getSpriteService + '/' + spriteObj.fileName,
            text: spriteObj.text,
            file: spriteObj.fileName
        });
    };

    $scope.GetSpriteImage = function(fileName){
        var url = Config.getSpriteService;

        var data = {fileName: fileName};

        $http.post(url, data).then(function(ret){
            if(ret.data.error){
                console.log(ret.data.msg);
                return null;
            }

            return ret.data;

        }, function (err) {
            console.log(err);
            return null;
        });
    };

    $scope.GetAllSprites = function(){
        var url = Config.getAvailableSpritesService;

        $http.post(url).then(function(ret){
            if(ret.data.error){
                console.log(ret.data.msg);
                return;
            }

            if(ret.data && Array.isArray(ret.data)){
                $scope.sprites = ret.data;

                angular.forEach(ret.data, function(spriteObj){
                    $scope.addSlide(spriteObj);
                });
            }

        }, function (err) {
            console.log(err);
        });
    };
    // Example with return
    $scope.Login = function () {
        var url = $scope.user.isNew ? Config.createUserService : Config.loginService;

        // If they're a new user, lets see what sprite they picked.
        if($scope.user.isNew){
            // Figure out which character was chosen.
            angular.forEach($scope.slides, function(slide){
                if(slide.active) {
                    $scope.user.spriteImage = slide.file;
                }
            });
        }

        HTTPRequest.post(url, $scope.user, function (ret) {
                if ($scope.user.isNew && !ret.data.error) {

                    $scope.message.color = 'green';
                    $scope.message.text = 'User created. Please login.';
                    $scope.user.isNew = false;

                    console.log('User Created');
                    console.log(ret);

                } else {
                    if (!ret.data.error) {
                        $scope.message.color = 'green';
                        $scope.message.text = 'Success';

                        // Convert from date string to object.
                        ret.data.user.birthDate = new Date(ret.data.user.birthDate);
                        ret.data.user.created = new Date(ret.data.user.created);
                        ret.data.user.lastLoginDate = new Date(ret.data.user.lastLoginDate);
                        ret.data.user.lastUpdated = new Date(ret.data.user.lastUpdated);

                        $scope.user = ret.data.user;
                        $scope.user.validUser = true;

                        console.log($scope.user);
                        console.log('Valid Login');
                        console.log(ret);

                        $modalInstance.close($scope.user);
                    }
                    $scope.message.text = ret.data.msg;
                }

            }, function (err) {
                $scope.message.text = 'Login Failed';
            });
/*
        $http.post(url, $scope.user)
            .then(function (ret) {
                if ($scope.user.isNew && !ret.data.error) {

                    $scope.message.color = 'green';
                    $scope.message.text = 'User created. Please login.';
                    $scope.user.isNew = false;

                    console.log('User Created');
                    console.log(ret);

                } else {
                    if (!ret.data.error) {
                        $scope.message.color = 'green';
                        $scope.message.text = 'Success';

                        // Convert from date string to object.
                        ret.data.user.birthDate = new Date(ret.data.user.birthDate);
                        ret.data.user.created = new Date(ret.data.user.created);
                        ret.data.user.lastLoginDate = new Date(ret.data.user.lastLoginDate);
                        ret.data.user.lastUpdated = new Date(ret.data.user.lastUpdated);

                        $scope.user = ret.data.user;
                        $scope.user.validUser = true;

                        console.log($scope.user);
                        console.log('Valid Login');
                        console.log(ret);

                        $modalInstance.close($scope.user);
                    }
                    $scope.message.text = ret.data.msg;
                }

            }, function (err) {
                $scope.message.text = 'Login Failed';
            });
*/
    };

    $scope.Cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.GetAllSprites();
});
