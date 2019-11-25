var mongojs = require("mongojs");
//var db = mongojs('localhost:27017/myGame', ['account','progress']);


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://aman:aman@cluster0-znxui.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const db = client.db("user-details").collection("account");
  // perform actions on the collection object
  
});



var express = require('express');
var app = express();
var serv = require('http').Server(app);



app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");



var Username;

var SOCKET_LIST = {};



var Entity = function(param){
	var self = {
		x:Math.floor(1500 * Math.random()),
		y:Math.floor(1500 * Math.random()),
		spdX:0,
		spdY:0,
		id:"",
		map:'forest',
		username:"",
	}
	if(param){
		if(param.x)
			self.x = param.x;
		if(param.y)
			self.y = param.y;
		if(param.map)
			self.map = param.map;
		if(param.id)
			self.id = param.id;		
		if(param.username)
			self.username = param.username;	
	}
	
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}

var Player = function(param){
	var self = Entity(param);
	self.number = "" + Math.floor(10 * Math.random());

	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingAttack = false;
	self.mouseAngle = 0;
	self.maxSpd = 5;
	self.hp = 20;
	self.hpMax = 20;
	self.score = 0;
	self.cooldown=0;
	self.coolDown_status=true;
	
	
	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		
		super_update();
		
		if(self.pressingAttack){
			self.shootBullet(self.mouseAngle);
		}
	}
	
	
	self.shootBullet = function(angle){
		if (self.cooldown<100 && self.coolDown_status==true){
			self.cooldown++;
		Bullet({
			parent:self.id,
			angle:angle,
			x:self.x,
			y:self.y,
			map:self.map,
		});	}
	   if (self.cooldown>=100 || self.coolDown_status==false){
		self.coolDown_status=false;
		self.cooldown-=2;  }

	   if(self.cooldown<=0){self.coolDown_status=true;
	self.cooldown=0;}
	
	
	


	}

	
	self.updateSpd = function(){
		
		if(self.pressingRight && self.x<1478)
			self.spdX = self.maxSpd;
			
		else if(self.pressingLeft && self.x>35)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;
		
		if(self.pressingUp&& self.y>40)
			self.spdY = -self.maxSpd;
		else if(self.pressingDown && self.y<1479)
			self.spdY = self.maxSpd;
		else
			self.spdY = 0;		
	}
	
	self.getInitPack = function(){
	
		return {
			id:self.id,
			x:self.x,
			y:self.y,	
			number:self.number,	
			hp:self.hp,
			hpMax:self.hpMax,
			score:self.score,
			cooldown:self.cooldown,
			username:self.username,
			
			map:self.map,
		};		
	}
	self.getUpdatePack = function(){
		
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			score:self.score,
			cooldown:self.cooldown,
			username:self.username,

		}	
	}
	
	Player.list[self.id] = self;
	
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};
Player.onConnect = function(socket,username){
	var map = 'forest';
	console.log(username + "  has joined the game");
	var uSername=username;
	var player = Player({
		id:socket.id,
		map:map,
		username:uSername,
	});
	

	socket.on('keyPress',function(data){
		if(data.inputId === 'left' )
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});
	
	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})
}
Player.getAllInitPack = function(){
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());		
	}
	return pack;
}

setInterval(function(){
			


   
},1000);	

var Bullet = function(param){
	var self = Entity(param);
	self.id = Math.random();
	self.angle = param.angle;
	self.spdX = Math.cos(param.angle/180*Math.PI) * 10;
	self.spdY = Math.sin(param.angle/180*Math.PI) * 10;
	self.parent = param.parent;
	
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;

	
	self.update = function(){
		if(self.timer++ > 10)
	
			self.toRemove = true;
		super_update();
		
		for(var i in Player.list){
			var p = Player.list[i];
			if(self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id){
				p.hp -= 1;
								
				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.score += 1;
					p.hp = p.hpMax;
					p.x = Math.random() * 500;
					p.y = Math.random() * 500;					
				}
				self.toRemove = true;
			}
		}
	}
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			map:self.map,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,	
			
		};
	}
	
	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;
}
Bullet.list = {};

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());		
	}
	return pack;
}

Bullet.getAllInitPack = function(){
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}

var DEBUG = true;

var isValidPassword = function(data,cb){
	//cb(true);
	client.connect(err => {
		const db = client.db("user-details").collection("account");
		db.find({username:data.username,password:data.password},function(err,res){
			if(res.length > 0)
				cb(true);
			else
				cb(true);
		});
		
	  });
	
}
var isUsernameTaken = function(data,cb){
	//cb(true);
	client.connect(err => {
		const db = client.db("user-details").collection("account");
		
		db.find({username:data.username},function(data,res){
	 	if(res.length > 0)
	 		cb(true);
	 	else
	 		cb(true);
	 });
	  });
     
}
var addUser = function(data,cb){
	client.connect(err => {
		const db = client.db("user-details").collection("account");
		// perform actions on the collection object
		db.insert({username:data.username,password:data.password},function(err){ //adds user
		cb();
	});
	  });

	


}
var playercounter=0;
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	socket.on('signIn',function(data){
		isValidPassword(data,function(res){
			if(res){
				Player.onConnect(socket,data.username);
			
				
				socket.emit('signInResponse',{success:true});
			} else {
				socket.emit('signInResponse',{success:false});			
			}
		});
	});
	socket.on('signUp',function(data){
		isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signUpResponse',{success:false});		
			} else {
				addUser(data,function(){
					socket.emit('signUpResponse',{success:true});					
				});
			}
		});		
	});
	
	var stopper =true;
	setInterval(function(){
			
			if (stopper){  // so that this runs only at the start
			playercounter=0;
			for(var i in Player.list){
				
			   playercounter++;
		   }

		   
		   if (playercounter >= 3){socket.emit('startGame',{success:true}); //only when 4 players join the game starts
		   console.log("game has started")
		   stopper=false;}
		}
		   var score_counter=0;
		   var scoreboard=[];
		   var score_loop_counter=0;
		   
		   for(var i in Player.list){
			 
			 score_counter=Player.list[i].score;
		  
		  
		  if ( score_counter >= 10){ 
			   socket.emit('endGame',{success:true}); //ends game when score is 10
			   console.log("game has ended");}}

 for(var i in Player.list){
  scoreboard[score_loop_counter]=Player.list[i];  //makes an array of scores 
			   score_loop_counter++;
			  

	}
	scoreboard=scoreboard.sort((a,b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0)); //sort them according to score (source :https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value)
	scoreboard=scoreboard.reverse(); // reverse the array as it is sorted in ascending order

		
var temp_score={scoreboard:scoreboard}
	if (playercounter>=3){ socket.emit('scoreboard',temp_score); }//send the info to client for scoreboard

	},1000);	

	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	socket.on('sendMsgToServer',function(data){
		var playerName = ("" + socket.id).slice(2,7);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
		}
	});
	
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);		
	});
	
	
	
});

var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};


setInterval(function(){ 
	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
	}
	
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
		
	}
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
	
	
},1000/25);










