var USE_DB = true;

var mongojs = USE_DB ? require("mongojs"): null;
var db = SE_DB ?  mongojs('localhost:27017/myGame', ['account','progress']) : null;

Database={};

Database.ValidPassword = function(data,cb){
    if(!USE_DB)
        return cb(true);
	db.account.find({username:data.username,password:data.password},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});}
    Database.isUsernameTaken = function(data,cb){
    if (!USE_DB)
        return cb(true);
	db.account.find({username:data.username},function(data,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});}
    Database.addUser = function(data,cb){
    if(res.length > 0)
        cb(true);
	db.account.insert({username:data.username,password:data.password},function(err){ //adds user
		cb();
	});


    }