
/*
the cloud db connects but cannot write or read from it, so always returns true

the local db works and its code is on app.js
 to run this file please do please change the name  of this file to app.js and make app.js  into appcopy.js

*/
//note: it connects to DB but cannout read or write

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://aman:aman@cluster0-znxui.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
var express = require('express');
var app = express();
var serv = require('http').Server(app);


//for getting the files
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
serv.listen(process.env.PORT || 2000);
console.log("Server has initilziled.");


// idea of code for Robot,Laser - source :https://www.youtube.com/watch?v=Tm-PXo9udWQ&list=PLcIaPHraYF7k4FbeGIDY-1mZZdjTu9QyL&index=5

var List_loggedin = {};
var Moving_objects = function(args){
	var object = {
		username:"",
		mo_id:"",
		obj_x:Math.floor(1500 * Math.random()),
		obj_y:Math.floor(1500 * Math.random()),
		object_vel_x:0,
		object_vel_y:0,
	}
	if(args){ // if argument are present in constructor then modify attributes
		if(args.obj_x)
			object.obj_x = args.obj_x;
		if(args.obj_y)
			object.obj_y = args.obj_y;
		if(args.mo_id)
			object.mo_id = args.mo_id;		
		if(args.username)
			object.username = args.username;	
	}
	
	object.game_state = function(){
		object.state_posistion(); //update the stats
	}
	object.state_posistion = function(){ //update posisiton
		object.obj_x += object.object_vel_x;
		object.obj_y += object.object_vel_y;
	}
	object.distance = function(pt){ // update distance for laser
		return Math.sqrt(Math.pow(object.obj_x-pt.obj_x,2) + Math.pow(object.obj_y-pt.obj_y,2)); //getting hypotenous
	}
	return object;
}

var Robot = function(args){
	var object = Moving_objects(args);
	object.number = "" + Math.floor(10 * Math.random());
	object.obj_v = 5;
	object.obj_health_state = 20;
	object.obj_health_limit = 20;
	object.score = 0;
	object.cooldown=0;
	object.coolDown_status=true;
	object.pressingRight = false;
	object.pressingLeft = false;
	object.pressingUp = false;
	object.pressingDown = false;
	object.pressingAttack = false;
	object.mouseAngle = 0;
	var state_update = object.game_state;
	object.game_state = function(){
		object.state_vel();
		state_update();
		if(object.pressingAttack){
			object.laser_fire(object.mouseAngle);
		}
	}
	object.laser_fire = function(angle){
		if (object.cooldown<100 && object.coolDown_status==true){
			object.cooldown++; //after 100 frames of animation, a cooldown is initiated
		Laser({
			parent:object.mo_id,
			angle:angle,
			obj_x:object.obj_x,
			obj_y:object.obj_y,
		});	}
	   if (object.cooldown>=100 || object.coolDown_status==false){
		object.coolDown_status=false;
		object.cooldown-=2;  }

	   if(object.cooldown<=0){object.coolDown_status=true;
	object.cooldown=0;}
	}

	
	object.state_vel = function(){
		
		if(object.pressingRight && object.obj_x<1478)
			object.object_vel_x = object.obj_v;
			
		else if(object.pressingLeft && object.obj_x>35)
			object.object_vel_x = -object.obj_v;
		else
			object.object_vel_x = 0;
		
		if(object.pressingUp&& object.obj_y>40)
			object.object_vel_y = -object.obj_v;
		else if(object.pressingDown && object.obj_y<1479)
			object.object_vel_y = object.obj_v;
		else
			object.object_vel_y = 0;		
	}
	
	object.obj_state = function(){
	
		return {
			mo_id:object.mo_id,
			obj_x:object.obj_x,
			obj_y:object.obj_y,	
			number:object.number,	
			obj_health_state:object.obj_health_state,
			obj_health_limit:object.obj_health_limit,
			score:object.score,
			cooldown:object.cooldown,
			username:object.username,
		};		
	}
	object.getUpdatePack = function(){
		
		return {
			mo_id:object.mo_id,
			obj_x:object.obj_x,
			obj_y:object.obj_y,
			obj_health_state:object.obj_health_state,
			score:object.score,
			cooldown:object.cooldown,
			username:object.username,
		}	
	}
	
	Robot.list[object.mo_id] = object;
	
	start_state.robot_obj.push(object.obj_state());
	return object;
}
Robot.list = {};
Robot.onConnect = function(socket,username){
	console.log(username + "  has joined the game");
	var uSername=username;
	var robot_obj = Robot({
		mo_id:socket.mo_id,
		username:uSername,
	});
	

	socket.on('keyPress',function(data){
		if(data.inputId === 'left' )
			robot_obj.pressingLeft = data.state;
		else if(data.inputId === 'right')
			robot_obj.pressingRight = data.state;
		else if(data.inputId === 'up')
			robot_obj.pressingUp = data.state;
		else if(data.inputId === 'down')
			robot_obj.pressingDown = data.state;
		else if(data.inputId === 'attack')
			robot_obj.pressingAttack = data.state;
		else if(data.inputId === 'mouseAngle')
			robot_obj.mouseAngle = data.state;
	});
	
	socket.emit('start_state',{
		selfId:socket.mo_id,
		robot_obj:Robot.OBJ_state(),
		laser_object:Laser.OBJ_state(),
	})
}
Robot.OBJ_state = function(){
	var players = [];
	for(var i in Robot.list)
		players.push(Robot.list[i].obj_state());
	return players;
}

Robot.loggedout = function(socket){
	delete Robot.list[socket.mo_id];
	logout_state.robot_obj.push(socket.mo_id);
}
Robot.game_state = function(){
	var game_state = [];
	for(var i in Robot.list){
		var robot_obj = Robot.list[i];
		robot_obj.game_state();
		game_state.push(robot_obj.getUpdatePack());		
	}
	return game_state;
}

	
var Laser = function(args){
	var object = Moving_objects(args);
	object.mo_id = Math.random();
	object.angle = args.angle;
	object.object_vel_x = Math.cos(args.angle/180*Math.PI) * 10;
	object.object_vel_y = Math.sin(args.angle/180*Math.PI) * 10;
	object.parent = args.parent;
	
	object.frame_counter = 0;
	object.delete_object = false;
	var state_update = object.game_state;

	
	object.game_state = function(){
		if(object.frame_counter++ > 10) //object exists only for 10 frames 
			object.delete_object = true;
		state_update();
		
		for(var i in Robot.list){
			var p = Robot.list[i];
			if( object.distance(p) < 32 && object.parent !== p.mo_id){
				p.obj_health_state -= 1;
								
				if(p.obj_health_state <= 0){
					var shooter = Robot.list[object.parent];
					if(shooter)
						shooter.score += 1;
					p.obj_health_state = p.obj_health_limit;
					p.obj_x = Math.random() * 500;
					p.obj_y = Math.random() * 500;					
				}
				object.delete_object = true;
			}
		}
	}
	object.obj_state = function(){
		return {
			mo_id:object.mo_id,
			obj_x:object.obj_x,
			obj_y:object.obj_y,
		};
	}
	object.getUpdatePack = function(){

		return {
			mo_id:object.mo_id,
			obj_x:object.obj_x,
			obj_y:object.obj_y,	
			};}

	Laser.list[object.mo_id] = object;
	start_state.laser_object.push(object.obj_state());
	return object;
}
Laser.list = {};

Laser.game_state = function(){
	var game_state = [];
	for(var i in Laser.list){
		var laser_object = Laser.list[i];
		
		laser_object.game_state();
		if(laser_object.delete_object){
			delete Laser.list[i];
			logout_state.laser_object.push(laser_object.mo_id);
		} else
			game_state.push(laser_object.getUpdatePack());		
	}
	return game_state;
}

Laser.OBJ_state = function(){
	var bullets = [];
	for(var i in Laser.list)
		bullets.push(Laser.list[i].obj_state());
	return bullets;
}

var check_password = function(data,cb){
	//cb(true);
	client.connect(err => {
		const db = client.db("user-details").collection("account");
		db.find({username:data.username,password:data.password},function(err,res){
			if(res.length > 0)
				cb(true);
			else
				cb(true);
		});
		
	  });}

var check_username = function(data,cb){
	//cb(true);
	client.connect(err => {
		const db = client.db("user-details").collection("account");
		
		db.find({username:data.username},function(data,res){
	 	if(res.length > 0)
			 cb(true);
			 
	 	else cb(true);
	 });
	  });   
}
var insert = function(data,cb){

	client.connect(err => {
		
		const db = client.db("user-details").collection("account");
		// perform actions on the collection object
		db.insert({username:data.username,password:data.password},function(err){ //adds user
		cb();	});
	});
     }

var playercounter=0; // global
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.mo_id = Math.random();
	List_loggedin[socket.mo_id] = socket;
	
	socket.on('check_signin',function(data){
		check_password(data,function(res){
			if(res){
				Robot.onConnect(socket,data.username);
				socket.emit('signin_state',{check:true});} 

			else {socket.emit('signin_state',{check:false});}
		});});

	socket.on('add_user(signup)',function(data){
		check_username(data,function(res){
			if(res){socket.emit('signUpResponse',{check:false});}
			else {insert(data,function(){socket.emit('signUpResponse',{check:true});});}
		});	});

	var stopper =true;
	setInterval(function(){
	
	if (stopper){  // so that this runs only at the start
	playercounter=0;
	for(var i in Robot.list){
		playercounter++;
	}	   
	if (playercounter >= 3){socket.emit('startGame',{check:true}); //game logic for only when 4 players join the game starts
	console.log("game has started")
	stopper=false;}}

	var score_counter=0;
	var scoreboard=[];
	var score_loop_counter=0;
	
	for(var i in Robot.list){
		
	    score_counter=Robot.list[i].score;
	
	    if ( score_counter >= 10){ 
			socket.emit('endGame',{check:true}); //ends game when score is 10
			console.log("game has ended");}
	   }

 for(var i in Robot.list){
     scoreboard[score_loop_counter]=Robot.list[i];  //makes an array of logged in players
	 score_loop_counter++;}

	 scoreboard=scoreboard.sort((a,b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0)); //sort them according to score (source :https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value)
	 scoreboard=scoreboard.reverse(); // reverse the array as it is sorted in ascending order

		
var temp_score={scoreboard:scoreboard}  //makes an object to emit the scoreboard array to client
	if (playercounter>=3){ socket.emit('scoreboard',temp_score); }//send the info to client for scoreboard

	},1000);	

	socket.on('logout',function(){
		delete List_loggedin[socket.mo_id];
		Robot.loggedout(socket);
	});	
	
});

var start_state = {robot_obj:[],laser_object:[]};
var logout_state = {robot_obj:[],laser_object:[]};
var reset=function(){
	start_state.robot_obj = [];
	start_state.laser_object = [];
	logout_state.robot_obj = [];
	logout_state.laser_object = [];
};
setInterval(function(){ 
	var game_state = {
		robot_obj:Robot.game_state(),
		laser_object:Laser.game_state(),
	}
	
	for(var i in List_loggedin){
		var socket = List_loggedin[i];
		socket.emit('start_state',start_state);
		socket.emit('game_state',game_state);
		socket.emit('logged_out',logout_state);
	}
	reset(); 	
},1000/25);
