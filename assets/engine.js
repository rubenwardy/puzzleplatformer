var game = {
	player: null,
	inventory: {},
	next_map: "not-ready"
};
var AUDIO_CARDB_CRUSH = "boxCrush1";
var AUDIO_DEATH = "playerDie";
var DEBUG = true;

function assert(cond) {
	if (!cond)
		throw("Assertion Failed!");	
}

var define = {
	// Private definition tables
	_bloc: {},
	_map: [],
	_sprite: {},
	_alias: {},
	
	// Define map
	map: function(data){
		data.id = this._map.length;
		this._map.push(data);		
	},
	
	// Define block
	block: function(data){
		if (game.is_editor && data.editor){
			for (key in data.editor){
				data[key] = data.editor[key];
			}
			data.editor = null;
		}
		
		this._bloc[data.name] = data;
	},
	
	sprite: function(name,file){
		this._sprite[name] = file;
	},
	
	alias: function(old, newn){
		this._alias[old] = newn;
	}
};

var map = Map();
var bg_render = 0;

var render_grid = 0;

function render_bg(){	
	if (
		bg_render == 0 ||
		bg_render.width != $(window).width() ||
		bg_render.height != $(window).height() ||
		Crafty.viewport.y > bg_render.y + 20 || Crafty.viewport.y < bg_render.y - 20 ||
		game.is_editor
	){
		bg_render = {
			width: $(window).width(),
			height: $(window).height(),
			y: Crafty.viewport.y
		};
		var ce = $("#bg")[0];
		ce.width = $(window).width();
		ce.height = $(window).height();
		var c = ce.getContext("2d");
		if (!game.is_editor){
			var skygrad= c.createLinearGradient(0,(ce.height/4)+Crafty.viewport.y/5,0,ce.height);
			skygrad.addColorStop(0,"#87CEEB");
			skygrad.addColorStop(1,"#E6F8FF");
			c.fillStyle = skygrad;
		}else{
			c.fillStyle = "#87CEEB";
		}
		c.fillRect(0,0,ce.width,ce.height);
		//c.fillStyle="#4b4b33";
		
		if (render_grid!=0)
			render_grid(c);
	}
}

// Auto mode select
Crafty.c("drawmode",{
	init: function(){
		this.requires("2D, DOM");
	}
});

// Load
Crafty.scene("Load", function() {
	$("body").prepend("<canvas id='bg' style='position:absolute;'></canvas>");
	//render_bg();
	
	if (!game.is_editor)
		setInterval(render_bg,1000/20);


	// Set up style
	Crafty.background("#000");	

	//Crafty.e("2D, drawmode, Text").attr({ w: Crafty.viewport.width, h: 30, x: 0, y: Crafty.viewport.height/2 })
		//.text("Loading...")
		//.textColor("white");
		//.css({ "text-align": "center", "font-color": "white" });
		
	var resources = [
		"assets/sprites/player_body.png",
		"assets/sprites/player_head.png",
		"assets/sprites/DeadPlayer.png",
		"assets/sprites/cloud.png",
		"assets/sounds/cboxCrush.wav",
		"assets/sounds/playerDie.wav"
	];
	
	for (key in define._sprite){
		resources.push(define._sprite[key]);
	}

	// Load stuff
	Crafty.load(resources,function() {
		Crafty.audio.add(AUDIO_CARDB_CRUSH, "assets/sounds/cboxCrush.wav");
		Crafty.audio.add(AUDIO_DEATH, "assets/sounds/playerDie.wav");
		Crafty.sprite(27,21,"assets/sprites/player_body.png", {
			PlayerBody:[0,0]
		});
		Crafty.sprite(20,13,"assets/sprites/player_head.png", {
			PlayerHead:[0,0]
		});
		Crafty.sprite(31,28,"assets/sprites/DeadPlayer.png", {
			DeadPlayer:[0,0]
		});
		Crafty.sprite(128,64,"assets/sprites/cloud.png", {
			CloudS:[0,0]
		});
		for (key in define._sprite){
			console.log("Loading '"+key+"' from '"+define._sprite[key]+"'");
			var ind = {};
			ind[key] = [0,0];
			Crafty.sprite(80,80,define._sprite[key], ind,0,0);
		}
		Crafty.scene(game.after_load);
	});
});