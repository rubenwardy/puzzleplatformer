/*
*	part of PUZZLE PLATFORMER
*	   by rubenwardy (rubenwardy@gmail.com)
*	Licensed under GNU GPL 3.0 or later. See LICENSE.txt
*/

Crafty.c("ParticleSystem",{
	init: function(){},
	particles: function(data){
		this.requires("2D");
		this.data = data;
		this.start = new Date().getTime();
		this.last = this.start;
		this.bind("EnterFrame",this.tick);
		return this;
	},
	tick: function(){
		var now = new Date().getTime();
		if (this.data && this.data.expire && now > (this.start+this.data.expire)){
			console.log("Deleting particle spawner");
			this.destroy();
		}

		if (now > this.last + this.data.delay){
			this.last = now;
			var amt = 1;
			if (this.data.spawn && this.data.spawn.amt)
				amt = this.data.spawn.amt;
			for (var i=0;i<amt;i++){
				this.addParticle();
			}
		}
	},
	addParticle: function(){
		var an = (Math.random() * 0.25 * Math.PI)-0.6*Math.PI;
		var spawnpos = {x:this.x,y:this.y};

		if (this.data.spawn && this.data.spawn.pos){
			if (this.data.spawn.pos.type == "range"){
				spawnpos.x += (
					this.data.spawn.pos.from[0]+
					(this.data.spawn.pos.to[0]-this.data.spawn.pos.from[0])
					* Math.random()
				);
				spawnpos.y += (
					this.data.spawn.pos.from[1]+
					(this.data.spawn.pos.to[1]-this.data.spawn.pos.from[1])
					* Math.random()
				);
			}
		}

		var clr = this.data.color;
		if (this.data.color instanceof Array) {
			clr = this.data.color[Math.round(Math.random()*(this.data.color.length-1))];
		}
		if (!clr || clr==""){
			clr = "red";
		}

		var velo = {x:0,y:0};
		if(this.data.spawn && this.data.spawn.velocity && this.data.spawn.velocity.constructor == Object){
			velo = {x:this.data.spawn.velocity.x,y:this.data.spawn.velocity.y};
		}else if (this.data.spawn && this.data.spawn.angle){
			var an = 0;

			if (this.data.spawn.angle.type == "range"){
				an = this.data.spawn.angle.from + (this.data.spawn.angle.to-this.data.spawn.angle.from)*Math.random();
			}

			velo = {x:this.data.spawn.velocity * Math.cos(an*Math.PI),y:this.data.spawn.velocity * Math.sin(an*Math.PI)};
		}

		var acc = {x:0, y:9.81};
		if (this.data.spawn && this.data.spawn.acc)
			acc = {x:this.data.spawn.acc.x,y:this.data.spawn.acc.y};

		//console.log("Adding particle ");
		Crafty.e("2D, drawmode, TheParticle, Color")
		.attr(spawnpos)
		.attr({w:10,h:10,z:this.z})
		.color(clr)
		.particle(
			velo,
			acc,
			this.data.decay
		);
	}
});

Crafty.c("TheParticle",{
	init: function(){},
	particle: function(vel,acc,ex){
		this.vel = vel;
		this.acc = acc;
		this.start = new Date().getTime();
		this.last = this.start;
		this.expire = ex;
		if (!this.expire.fo)
			this.expire.fo = 0;

		this.decay = -1;
		this.bind("EnterFrame",this.tick);
	},
	tick: function(){
		var now = new Date().getTime();
		if (
			(this.expire && this.expire.t && now > (this.start+this.expire.t)) ||
			(this.expire && this.expire.vy_gt && this.vel.y > this.expire.vy_gt) ||
			(this.expire && this.expire.vy_lt && this.vel.y < this.expire.vy_lt) ||
			(this.expire && this.expire.vx_gt && this.vel.x > this.expire.vx_gt) ||
			(this.expire && this.expire.vx_lt && this.vel.x < this.expire.vx_lt)
		){
			if (this.decay == -1)
				this.decay = now;
		}
		if (this.decay != -1){
			if (now > (this.decay + this.expire.fo)){
				this.destroy();
				return;
			}
			var perc = 1-((now-this.decay)/this.expire.fo);
			this.alpha = perc;
			this.visible = (perc>0);
		}
		var dtime = (now - this.last)/1000;
		this.x += this.vel.x * dtime;
		this.y += this.vel.y * dtime;
		this.vel.x += this.acc.x * 32 * dtime;
		this.vel.y += this.acc.y * 32 * dtime;

		this.last = now;
	}
});

function ParticleExplosion(pos, speed, tcolor, g, timeout, width, amt){
	if (!width)
		width = 64;
	if (!amt)
		amt = 8;

	for (var x=0;x<amt;x++){
		for (var y=0;y<amt;y++){
			var xcolor = tcolor;

			if (xcolor instanceof Array) {
				xcolor = xcolor[Math.round(Math.random()*(xcolor.length-1))];
			}

			var an = Math.random() * 2 * 3.1415;
			var e = Crafty.e("2D, drawmode, TheParticle, Color")
			.attr({x:pos.x + x*(width/amt),y:pos.y + y*(width/amt)})
			.attr({w:(width/amt),h:(width/amt),z:1002})
			.color(xcolor);

			e.particle(
				{x:speed * Math.cos(an),y:speed * Math.sin(an)},
				{x:0,y:g},
				{t:timeout}
			);
		}
	}
}

Crafty.c("CloudSystem",{
	init: function(){
		this.requires("2D");
		console.log("Creating cloud system.");
        this.last = new Date().getTime();
        this.delay = 0;
		this.current_y = 0;
		this.old_y = 0;
	},
	clouds: function(data){
		this.data = data;
		this.last = new Date().getTime();
        this.delay = 0;

		var width = Crafty.viewport.width;
		if (this.data.width)
			width = this.data.width;
		var left = 0;
		if (this.data.left)
			left = this.data.left

		var res = 16;
		if (this.data.res)
			res = this.data.res;

		for (var i=0; i<=res+1; i++){
			this.placeCloud((i/res) * width + left)
		}
		this.bind("EnterFrame",this.tick);
	},
	tick: function(){
		var now = new Date().getTime();
		if (now > this.last + 4000){
			this.last = now;
			this.placeCloud(Crafty.viewport.width + 100);
		}
	},
	placeCloud: function(x){
		var top = 0;
		if (this.data.top)
			top = this.data.top;
		var height = 200;
		if (this.data.height)
			height = this.data.height;

		//this.current_y = (this.current_y + 59) % 200;
		var cloud = Crafty.e("Cloud");
		var new_y = this.old_y;
		while (Math.abs(new_y-this.old_y) < 80){
			new_y = Math.random() * height + top;
		}
		cloud.attr({
			x: x,
			y: new_y // this.current_y + top
		});
		this.old_y = new_y;
	}

});

Crafty.c("Cloud",{
	init: function(){
        this.requires("2D, drawmode, Sprite, CloudS");
		this.attr({z:-10});
        this.sprite(0,0,128,64);
		this.crop(0,0,128,64);
        this.last = new Date().getTime();
		this.speed = 25;
		this.bind("EnterFrame",this.tick);
	},
	tick: function(){
		var now = new Date().getTime();
		var dtime = (now - this.last)/1000;
		this.last = now;

		this.x -= this.speed * dtime;

		if (this.x < -(Crafty.viewport.width/2)){
			this.destroy();
		}
	},
});
