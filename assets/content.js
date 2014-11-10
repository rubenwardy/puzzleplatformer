// Define the sprite maps
define.sprite("default","assets/sprites/tiles.png");
define.sprite("editor","assets/sprites/editor.png");

// Can take damage
Crafty.c("crushable",{
	crush: function(){
		if (this.tile_data.crush_sound)
			Crafty.audio.play(this.tile_data.crush_sound);

		if (this.tile_data.destructColor)
			ParticleExplosion({x:this.x, y:this.y}, 300, this.tile_data.destructColor, 0, 750);

		if (this.body)
			Crafty.box2D.world.DestroyBody(this.body);

		if ((this.tile_data.respawn || this.tile_meta.respawn) && this.tile_meta.respawn != false)
			Crafty.e("Tile").tile(this.tile_data.name, this.tile_p.x, this.tile_p.y, map.map_data.width, map.map_data.height);

		this.destroy();
	}
});

// Can pull object with use button
Crafty.c("pull", {
	using: false,
	can_detach: false,
	use: function() {
		if (this.using) {
			return;
		}
		this.can_detach = false;
		setTimeout(function() { this.can_detach = true; }, 5);
		console.log("Use");
		Crafty.bind("using", this.end_use);
		this.using = true;
		game.player.lock_turn = game.player.lock_turn + 1;

		// Delta
		var deltax = this.x - game.player.x;
		var deltay = this.y - game.player.y;
		this.delta = {x: deltax, y: deltay};

		// Destroy tile's body
		Crafty.box2D.world.DestroyBody(this.body);
		this.body = null;

		// Add as fixture
		this.fixture = game.player.addFixture({
			density: 0.1,
			shape: [ [deltax+10,deltay+10], [deltax+72,deltay+10], [deltax+72,deltay+72], [deltax+10,deltay+72] ]
		});
		game.player.attach(this);
		this.bind("EnterFrame", this.move_to_fix);
		this.bind("KeyDown", this.keydown);
		var this_item = this;
		Crafty.bind("PlayerDeath", function(to) { this_item.end_use(this_item, to) });

	},
	move_to_fix: function() {
		this.can_detach = true;
		this.trigger("move", {x: this.x, y: this.y});
	},
	keydown: function(e) {
		if (e.key == Crafty.keys.E && this.can_detach) {
			this.end_use();
		}
	},
	end_use: function(this_item, to) {
		if (this_item.using && (to == null || this_item != to)) {
			Crafty.unbind("using", this_item.end_use);
			this_item.unbind("EnterFrame", this_item.move_to_fix);
			this_item.unbind("KeyDown", this_item.keydown);
			Crafty.unbind("PlayerDeath", this_item.end_use);
			game.player.detach(this_item);
			Crafty.box2D.world.DestroyBody(game.player.body);
			game.player.physics();
			this_item.using = false;
			game.player.lock_turn = game.player.lock_turn - 1;
			this_item.init_physics();
		}
	}
});

Crafty.c("DeathHazzard",{
	init: function(){
		this.bind("EnterFrame",this._enterframe);
	},
	_enterframe: function(){
		if (!game.player)
			return;

		if (this.contact("Player")){
			game.player.hit(20);
		}

		if (this.tile_data.crushes){
			var obj = this.contact("crushable");

			for (var i=0;i<obj.length;i++){
				obj[i].obj.crush();
			}
		}
	}
});

Crafty.c("Button",{
	button: function(){
		this.bind("EnterFrame",this._enterframe);
	},
	OnDown: function(func){this.odown = func;},
	OnUp: function(func){this.oup = func;},
	isdown: false,
	_enterframe: function(){
		if (this.contact("Obstacle, Player")){
			if ( this.isdown != true && this.odown )
				this.odown(this);

			this.isdown = true;
			this.sprite(this.tile_data.tile.x + 1, this.tile_data.tile.y, 80, 80);
		}else{
			if ( this.isdown != false && this.oup )
				this.oup(this);

			this.isdown = false;
			this.sprite(this.tile_data.tile.x, this.tile_data.tile.y, 80, 80);
		}
	}
});

var button_init =  function(ent){
	ent.button();
	ent.OnDown(function(ent){
		if (ent.tile_meta.method == 'downtoggle'){
			for(var i=0;i<ent.tile_meta.action.length;i++){
				var x = ent.tile_meta.action[i].x;
				var y = ent.tile_meta.action[i].y;
				var tmp = map.tiles[y][x];
				if (tmp.visible){
					tmp.hide();
					Crafty.box2D.world.DestroyBody(tmp.body);
				}else{
					tmp.show();
					if (tmp.init_physics){
						tmp.init_physics();
						var con = Crafty("crushable");
						con.each(function(i){
							if (this.contains(x*64+10,y*64+10,20,20)){
								this.crush();
							}
						});
					}
				 }
			}
		}else 	if (ent.tile_meta.method == 'toggle'){
			for(var i=0;i<ent.tile_meta.action.length;i++){
				var x = ent.tile_meta.action[i].x;
				var y = ent.tile_meta.action[i].y;
				var tmp = map.tiles[y][x];
				if (tmp.visible){
					tmp.hide();
					Crafty.box2D.world.DestroyBody(tmp.body);
				}else{
					tmp.show();
					if (tmp.init_physics){
						tmp.init_physics();
						var con = Crafty("crushable");
						con.each(function(i){
							if (this.contains(x*64+10,y*64+10,20,20)){
								this.crush();
							}
						});
					}
				 }
			}
		}else if (ent.tile_meta.method == 'func'){
			ent.tile_meta.action(ent,"down");
		}
	});
	ent.OnUp(function(ent){
		if (ent.tile_meta.method == 'downtoggle'){
			for(var i=0;i<ent.tile_meta.action.length;i++){
				var x = ent.tile_meta.action[i].x;
				var y = ent.tile_meta.action[i].y;
				var tmp = map.tiles[y][x];
				if (tmp.visible){
					tmp.hide();
					Crafty.box2D.world.DestroyBody(tmp.body);
				}else{
					tmp.show();
					if (tmp.init_physics){
						tmp.init_physics();
						var con = Crafty("crushable");
						con.each(function(i){
							if (this.contains(x*64+10,y*64+10,20,20)){
								this.crush();
							}
						});
					}
				 }
			}
		}else if (ent.tile_meta.method == 'func'){
			ent.tile_meta.action(ent,"up");
		}
	});
	return false;
}

// Blank concrete block
define.block({
	name: "blank",
	desc: "Concrete",
	drawtype: "Block",
	tile: {x: 0,y: 0},
	physics: {
		friction: 1,
		restitution: 0
	},
	ascii: 'X'
});

// Bouncy block
define.block({
	name: "bounce",
	desc: "Bounce",
	drawtype: "Block",
	tile: {x: 1,y: 0},
	physics: {
		friction: 0.5,
		restitution: 1
	},
	ascii: '^'
});

// Tech Block
define.block({
	name: "tech",
	desc: "Tech",
	drawtype: "Block",
	tile: {x: 3, y: 0, ani: {dur: 500, l: 2}},
	physics: {
		friction: 4,
		restitution: 0
	},
	ascii: 'D'
});

// Cardboard box Block
define.block({
	name: "box",
	desc: "Cardboard Box",
	drawtype: "Block",
	c: "push, crushable, usable, pull",
	respawn: true,
	destructColor: "#b5926c",
	tile: {x: 2,y: 0},
	crush_sound: AUDIO_CARDB_CRUSH,
	physics: {
		friction: 4,
		restitution: 0,
		bodyType: "dynamic",
		density: 0.005
	},
	ascii: 'B'
});
define.alias("push","box");

// Drop box
define.block({
	name: "drop",
	desc: "Dropping Box",
	drawtype: "Block",
	c: "crushable",
	respawn: true,
	tile: {x: 2,y: 0},
	physics: {
		friction: 4,
		restitution: 0,
		bodyType: "dynamic",
		density: 0.6,
		limit_x: true
	},
	ascii: 'V'
});

// Button
define.block({
	name: "button",
	desc: "Button",
	drawtype: "Tile",
	tile: {x: 0,y: 1},
	physics: {
		bodyType: "static",
		shape: [[20,64],[62,64],[62,72],[20,72]],
		isSensor: true
	},
	c: "Button",
	init: button_init,
	ascii: '_',
	editor: {
		tile: {x: 0, y: 0, tile: "editor"}
	}
});

// Vertical button left
define.block({
	name: "vbuttonl",
	desc: "Left Vertical Btn",
	drawtype: "Tile",
	tile: {x: 2,y: 1},
	physics: {
		bodyType: "static",
		shape: [[8,20],[8,62],[16,62],[16,20]],
		isSensor: true
	},
	c: "Button",
	init: button_init,
	ascii: '|',
	editor: {
		tile: {x: 1, y: 0, tile: "editor"}
	}
});

// Ladder
define.block({
	name: "ladder",
	desc: "Ladder",
	drawtype: "Tile",
	tile: {x: 4,y: 1},
	physics: {
		bodyType: "static",
		shape: [[38,0],[47,0],[47,69],[38,69]],
		isSensor: true
	},
	c: "Ladder",
	ascii: 'H',
	editor: {
		tile: {x: 2, y: 0, tile: "editor"}
	}
});

// Spikes
define.block({
	name: "spikes",
	desc: "Spikes",
	drawtype: "Tile",
	tile: {x: 5,y: 1},
	physics: {
		bodyType: "static",
		shape:[[10,50],[72,50],[72,72],[10,72]],
		isSensor: true
	},
	crushes: true,
	c: "DeathHazzard",
	ascii: '*'
});

// Spring
define.block({
	name: "spring",
	desc: "Spring",
	drawtype: "Tile",
	tile: {x: 0,y: 1},
	physics: {
		bodyType: "static",
		shape: [[20,64],[62,64],[62,72],[20,72]],
		isSensor: true
	},
	c: "Button",
	init: button_init,
	ascii: '/'
});

// Cake block
define.block({
	name: "cake",
	desc: "Cake!",
	drawtype: "Tile",
	tile: {x: 0,y: 2},
	c: "PickUp",
	init: function(ent){
		ent.PickUp("cake",1);
		return false;
	},
	onPickUp: function(ent){
		ParticleExplosion({x:ent.x,y:ent.y},100,["#975224","#6e3815","#44210a","#1a0c02"],9.81,2000);
	},
	ascii: '$'
});

// Flag
define.block({
	name: "flag",
	desc: "Flag",
	drawtype: "Tile",
	tile: {x: 3,y: 2, ani: {dur: 100, l:2}},
	c: "Flag",
	init: function(ent){
		ent.pauseAnimation();
		ent.resetAnimation();
	},
	onFlag: function(ent){
		ent.animate("normal",0);
		ParticleExplosion({x:ent.x + 25, y:ent.y - 10}, 100, ["#7a7a7a", "#adadad"], -9.81, 2000, 50, 10);
	},
	onFlagReset: function(ent){
		ent.pauseAnimation();
		ent.resetAnimation();
	},
	ascii: 'F'
});

// Water
define.block({
	name: "water",
	desc: "Water",
	drawtype: "Block",
	tile: {x: 0,y: 3, ani:{dur: 750, l:2}},
	top: 38,
	right: 80,
	physics: {
		bodyType: "static",
		shape:[[10,40],[72,40],[72,72],[10,72]],
		isSensor: true
	},
	crushes: true,
	ascii: 'w',
	c: "DeathHazzard",
});

// Sign
define.block({
	name: "sign_jump",
	desc: "Sign (Jump)",
	drawtype: "Tile",
	tile: {x: 3,y: 3, ani:{dur: 3000, l:3}},
	ascii: 'S'
});

define.block({
	name: "sign_wet",
	desc: "Sign (Wet)",
	drawtype: "Tile",
	tile: {x: 2,y: 3}
});

// Fire
define.block({
	name: "fire",
	desc: "Fire",
	drawtype: "None",
	physics: {
		bodyType: "static",
		isSensor: true
	},
	c: "",
	init: function(ent){
		var one = Crafty.e("ParticleSystem")
			.particles({
				delay: 25,
				decay: {
					t: 300,
					fo: 750
				},
				color: ["grey","darkgrey"],
				spawn: {
					pos: {
						type: "range",
						from: [0,0],
						to: [64,0]
					},
					velocity: {x:0,y:-100},
					acc: {x:0,y:0},
					amt: 3
				}
			})
			.attr({
				x:ent.x,
				y:ent.y+44,
				w:10,
				h:10,
				z:ent.z
			});

		var two = Crafty.e("ParticleSystem")
			.particles({
				delay: 10,
				decay: {
					t: 200,
					fo: 200
				},
				color: ["red","orange"],
				spawn: {
					pos: {
						type: "range",
						from: [0,0],
						to: [64,0]
					},
					velocity: {x:0,y:-100},
					acc: {x:0,y:0},
					amt: 5
				}
			})
			.attr({
				x:ent.x,
				y:ent.y+64,
				w:10,
				h:10,
				z:ent.z
			});
		ent.attach(one);
		ent.attach(two);
		ent.hit_tick = 0;
		if (game.player)
			ent.bind("EnterFrame",function(){
				var now = new Date().getTime();
				if (now > this.hit_tick+1000){
					this.hit_tick = now;
					if (this.contact("Player")){
						game.player.hit(1);
					}
				}
			});
		return false;
	},
	init_req: true,
	ascii: '$'
});

// Maps
define.map({
	spawn:{
		x: 1,
		y: 2
	},
	width: 12,
	height: 4,
	cakes: 1,
	map: [
		["", "", "", ""],
		["", "", "", "", ""],
		["", "", "", "", "", "", "", "", "", "", "", "cake"],
		["blank", "blank", "blank", "blank", "", "", "", "", "", "", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 3,
		y: 2
	},
	width: 29,
	height: 12,
	cakes: 1,
	map: [
		["", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["", "", "blank", "", "", "", "", "", "", "", "tech", "", "", "", "", "blank"],
		["", "", "blank", "", "", "", "", "", "", "", "tech", "", "", "cake", "", "blank"],
		["blank", "blank", "blank", "blank", "blank", "blank", {node:"tech", visible:false}, {node:"tech", visible:false}, {node:"tech", visible:false}, "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "ladder", "", "", "", "tech", "", "", "", "", "", "ladder", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "ladder", "", "", "", "tech", "", "", "", "", "", "ladder", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "ladder", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "ladder", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "ladder", "", "", "", "", "", "", "", "", "blank", "ladder", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "ladder", "", "", "", "", "", "", "", "blank", "blank", "ladder", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "ladder", "", "", "", "", "button", "", "", "box", "blank", "ladder", "", "", {node:"button",method:"downtoggle",action:[{x:5,y:4},{x:5,y:5}, {x:6, y:3}, {x:7, y:3}, {x:8, y:3}]}, "", "", "", "", "", "", "", "", "flag", "", "box", "", "box", "blank"],
		["blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "water", "water", "water", "blank", "water", "water", "water", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 1,
		y: 2
	},
	width: 3,
	height: 4,
	cakes:1,
	map: [
		["blank","blank","blank"],
		["blank","cake","blank"],
		["blank","","blank"],
		["blank","blank","blank"]
	]
});

define.map({
	spawn:{
		x: 27,
		y: 5
	},
	width: 29,
	height: 13,
	cakes: 2,
	map: [
		["blank", "blank", "blank", "blank", "drop", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
		["blank", "cake", "", "", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
		["blank", "", "", "", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "", "", "", "", "", "", "", "", "", "cake", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "", "flag", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank", "blank", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "bounce", "", "", "bounce", "", "", "bounce", "", "", "bounce", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "spikes", "spikes","blank",  "", "blank", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "blank"],
		["", "", "", "blank", "blank", "blank", "blank", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 5,
		y: 5
	},
	width: 13,
	height: 8,
	cakes: 1,
	map: [
		["blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank"],
		["blank","blank", {node:"vbuttonl",method:"toggle",action:[{x:4,y:4},{x:4,y:5}]},"","","","","","","","","ladder","blank"],
		["blank","push","","","","","","","","","","ladder","blank"],
		["blank","blank","blank","blank","blank","blank","blank","blank","blank","","","ladder","blank"],
		["blank","","","tech","tech","","","","","","","ladder","blank"],
		["blank","cake","","tech","tech","","","",{node:"button",method:"downtoggle",action:[{x:3,y:4},{x:3,y:5}]},"","","ladder","blank"],
		["blank","blank","blank","blank","blank","blank","blank","spikes","blank","blank","blank","blank","blank"],
		["blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank","blank"]
	]
});

define.map({
	spawn:{
		x: 11,
		y: 7
	},
	width: 13,
	height: 9,
	cakes: 1,
	map: [
		["blank", "blank", "blank", "blank"],
		["blank", "", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "cake", "flag", "", "spikes", "", "", "", "", "", "", "", "blank"],
		["blank", "blank", "blank", "ladder", "", "", "", "", "", "", "", "", "blank"],
		["", "", "blank", "ladder", "", "", "", "spikes", "spikes", "", "", "", "blank"],
		["", "", "blank", "ladder", "", "spikes", "", "", "", "", "", "", "blank"],
		["", "", "blank", "ladder", "", "", "", "spikes", "", "", "", "", "blank"],
		["", "", "blank", "ladder", "spikes", "", "", "", "", "", "", "", "blank"],
		["", "", "blank", "blank", "blank", "blank", "blank", "water", "bounce", "blank", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 27,
		y: 5
	},
	width: 29,
	height: 13,
	cakes: 2,
	map: [
		["blank", "blank", "blank", "blank", "drop", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
		["blank", "cake", "", "", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
		["blank", "", "", "", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "ladder", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "", "", "", "", "", "", "", "", "", "cake", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "ladder", "", "", "flag", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank", "blank", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "bounce", "", "", "bounce", "", "", "bounce", "", "", "bounce", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "", "", "blank", "", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["", "", "", "blank", "spikes", "spikes","blank",  "", "blank", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "blank"],
		["", "", "", "blank", "blank", "blank", "blank", "", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 1,
		y: 2
	},
	width: 26,
	help: [
		{
			msg: "Welcome traveller!<br /><br />Collect the cakes to proceed to the next level.",
			at: {x: -3, y: 1, w: 120},
			behind: true,
			trigger: {
				type: "x_range",
				from: 2,
				to: 5
			},
			disperse: {
				type: "collide"
			}
		}
	],
	height: 5,
	cakes: 1,
	map: [
		["blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "bounce", "bounce", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "bounce", "bounce", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "", "", "sign_jump", "", "sign_wet", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "cake", "blank"],
		["blank", "blank", "blank", "bounce", "water", "water", "water", "water", "water", "water", "water", "water", "water", "blank", "blank", "bounce", "water", "water", "water", "water", "water", "water", "water", "water", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"]
	]
});

define.map({
	spawn:{
		x: 1,
		y: 3
	},
	width: 21,
	height: 10,
	cakes: 4,
	map: [
		["blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"],
		["blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank"],
		["blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "cake", "", "blank"],
		["blank", "blank", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "", "", "cake", "", "", "", "cake", "", "", "", "cake", "", "", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "", "", "bounce", "", "", "", "bounce", "", "", "", "bounce", "", "", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "", "", "", "", "", "", "", "", "", "", "", "", "", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "spikes", "blank", "blank", "blank", "blank"],
		["blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank", "blank"]
	]
});

