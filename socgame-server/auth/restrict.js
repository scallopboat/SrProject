module.exports = function(req, res, next){
    var vm = {
        error: true,
        msg: 'Login required'
    };
    
     if (req.isAuthenticated()) {
    return next();
  }
    
    res.send(vm);
};
