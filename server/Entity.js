Moving_Objects={};

Moving_Objects.Entity = function(param){
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

