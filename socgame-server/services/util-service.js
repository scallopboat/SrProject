/**
 * @brief Defines whether or not a string is an int.
 * @param [in] string val A value that could be defined as numeric
 * @return bool
 */
exports.isNumeric = function(val){
    return Number(parseFloat(val))==val;
};

exports.getServerDateString = function(){
    return new Date().toGMTString();
};
