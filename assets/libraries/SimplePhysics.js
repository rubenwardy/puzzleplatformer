var SimPhys = {
	math: {},
	_step: 0
};

// CLASS: Vector
SimPhys.Vector = function(x, y){
	this.x = x;
	this.y = y;
};

// CLASS: Rectangle
SimPhys.Rect = function(x, y, w, h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};

// CLASS: Body
SimPhys.Body = function(rect, position){
	console.log("New Body Created.");
	this.rect = rect;
	this._awake = true;
	this.forces = [];
	this.position = position;
	this.velocity = new SimPhys.Vector(0, 0);
	this.mass = 1;
	if (SimPhys.world){
		SimPhys.world.bodies.push(this);
	}
};

SimPhys.Body.prototype.applyForce = function(vector){
	this.forces.push(vector);
};

SimPhys.Body.prototype.SetAwake = function(flag){
	this._awake = flag;
};

SimPhys.Body.prototype.IsAwake = function(g){
	return this._awake;
};

SimPhys.Body.prototype.getPosition = function(){
	return this.position;
};

SimPhys.Body.prototype.setPosition = function(value){
	this.position = value;
};

SimPhys.Body.prototype.getRect = function(){
	this.rect.x = this.position.x;
	this.rect.y = this.position.y;
	return this.rect;
};

SimPhys.Body.prototype.move = function(dtime, velocity, rect){
	// Apply velocity
	var pos = this.getPosition();
	var new_pos = new SimPhys.Vector(
		pos.x + velocity.x * dtime,
		pos.y + velocity.y * dtime
	);
	
	// Ray cast for collisions
	var res = SimPhys.math.raycast(pos, new_pos, 0.01, rect, [this]);		
	if (res){
		this.setPosition(res[1]);
		this.velocity.y = 0;
	}else
		this.setPosition(new_pos);	
};

// CLASS: Scenery object 
SimPhys.SceneOBJ = function(rect, position){
	console.log("New SceneOBJ created.");
	this.rect = rect;
	this.position = position;
	if (SimPhys.world){
		SimPhys.world.scene.push(this);
	}
};
SimPhys.SceneOBJ.prototype.getPosition = function(){
	return this.position;
};

SimPhys.SceneOBJ.prototype.getRect = function(){
	this.rect.x = this.position.x;
	this.rect.y = this.position.y;
	return this.rect;
};

// Math module
SimPhys.math.intersectRect = function(one, other) {
	return !(
		other.x > one.x + one.w || 
		other.x + other.w < one.x || 
		other.y > one.y + one.h ||
		other.y + other.h < one.y
	);
};

SimPhys.math.clipRect = function(rect, x, y, w, h){
	new SimPhys.Rect(rect.x + x, rect.y + y, rect.w + w, rect.h + h);
}

SimPhys.math.multVV = function(one, other){
	return new SimPhys.Vector(one.x*other.x, one.y*other.y);
};

SimPhys.math.to3dp = function(number){
	return Math.round(number*100)/100;
};

SimPhys.math.raycast = function(from, to, step, rect, ignore){
	var distance = Math.sqrt( Math.pow(from.x-to.x,2) + Math.pow(from.y-to.y,2) );
	var direction = Math.atan((to.y-from.y)/(to.x-from.x));
	for (var i = 0; i < distance; i += step){
		var pos = {
			x: from.x + Math.cos(direction) * i,
			y: from.y + Math.sin(direction) * i
		};
		console.log(SimPhys.math.to3dp(i) + " ("+SimPhys.math.to3dp(pos.x)+", "+SimPhys.math.to3dp(pos.y)+")");
		var res = SimPhys.math.collideAtRect(new SimPhys.Rect(pos.x, pos.y, rect.w, rect.h), ignore);
		if (res != null){
			return [res, pos];
		}
	}
	var res = SimPhys.math.collideAtRect(new SimPhys.Rect(to.x, to.y, rect.w, rect.h), ignore);
	if (res != null){
		return [res, pos];
	}
	return null;
};

SimPhys.math.collideAtRect = function(rect, ignore){
	for (key in SimPhys.world.bodies){
		var body = SimPhys.world.bodies[key];
		
		if (
			(!ignore || !array_contains(ignore, body)) &&
			SimPhys.math.intersectRect(body.getRect(), rect)
		)
			return body;
	}
	for (key in SimPhys.world.scene){
		var obj = SimPhys.world.scene[key];
		if (
			(!ignore || !array_contains(ignore, obj)) &&
			SimPhys.math.intersectRect(obj.getRect(), rect)
		)
			return obj;
	}
	return null;
};

// Update modules
SimPhys.init = function(gravity){
	SimPhys.world = {
		gravity: gravity,
		bodies: [],
		scene: []
	};
};

function array_contains(arr, item){
	for (idx in arr){
		if (arr[idx] == item)
			return true;
	}
	return false;
};

SimPhys.debugDraw = function(canvas, px_to_m){
	canvas.fillStyle = "black";
	canvas.fillText("Simple Physics Library (Step: "+SimPhys._step+")", 10, 20);
	
	if (!SimPhys.world || !SimPhys.world.bodies){
		canvas.fillText("No physics simulation active", 25, 35);
	}else{
		canvas.fillStyle = "black";
		for (key in SimPhys.world.bodies){
			var body = SimPhys.world.bodies[key];
			var pos = body.getPosition();
			var rect = body.getRect();
			canvas.fillRect(
				(pos.x) * px_to_m,
				(pos.y) * px_to_m,
				rect.w * px_to_m,
				rect.h * px_to_m
			);
			canvas.fillText(
				"P("+SimPhys.math.to3dp(pos.x)+", "+SimPhys.math.to3dp(pos.y)+")",
				pos.x * px_to_m, (pos.y * px_to_m)-20
			);
			canvas.fillText(
				"V("+SimPhys.math.to3dp(body.velocity.x)+", "+SimPhys.math.to3dp(body.velocity.y)+")",
				pos.x * px_to_m, (pos.y * px_to_m)-7
			);
		}
		canvas.fillStyle = "green";
		for (key in SimPhys.world.scene){
			var obj = SimPhys.world.scene[key];
			var pos = obj.getPosition();
			var rect = obj.getRect();
			canvas.fillRect(
				(pos.x) * px_to_m,
				(pos.y) * px_to_m,
				rect.w * px_to_m,
				rect.h * px_to_m
			);			
		}
	}
};

SimPhys.step = function(dtime){
	SimPhys._step = SimPhys._step + 1;
	for (key in SimPhys.world.bodies){
		// Get body details
		var body = SimPhys.world.bodies[key];
		var pos = body.getPosition();
		
		// Calculate forces
		body.applyForce(new SimPhys.Vector(0, SimPhys.world.gravity * body.mass));		
		var sum = new SimPhys.Vector(0, 0);
		for (_force in body.forces){
			var force = body.forces[_force];
			sum.x += force.x;
			sum.y += force.y;
		}
		body.forces = [];
		
		// Apply force
		body.velocity.x += (sum.x / body.mass) * dtime;
		body.velocity.y += (sum.y / body.mass) * dtime;
		
		body.move(dtime, body.velocity, SimPhys.math.clipRect(body.getRect(),0.01,0.01,-0.02,-0.01));	
	}
};
