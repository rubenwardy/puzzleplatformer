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
			skygrad.addColorStop(0,"#87C1EB");
			skygrad.addColorStop(1,"#9DDDF2");
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
	$("#fps").hide();

	if (!game.is_editor) {
		Crafty.background("transparent");
		setInterval(render_bg, 1000/20);

		Crafty.e("2D, DOM, Image, logo")
			.attr({x: Crafty.viewport.width / 2 - 92, y: Crafty.viewport.height / 2 - 190, w: 186})
			.image("assets/sprites/rubenwardy.jpg");
		Crafty.e("2D, DOM, Text, logo")
			.attr({x: Crafty.viewport.width / 2 - 92, y: Crafty.viewport.height / 2, w: 186})
			//.textColor("#ffffff")
			.textFont({ family: 'Arial',  size: '20px'})
			.css("text-align", "center")
			.text("rubenwardy");
		$(".logo").hide();
		$(".logo").fadeIn();
	} else {
		Crafty.background("#000");
	}

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

	var time_before = new Date().getTime();
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
			ind[key] = [0, 0];
			Crafty.sprite(80, 80,define._sprite[key], ind, 0, 0);
		}
		if (game.is_editor)
			Crafty.scene(game.after_load);
		else {
			Crafty.e("CloudSystem").clouds({top:0, height: 350, res: 23});
			setTimeout(function() {
				$(".logo").fadeOut();
				setTimeout(function(){Crafty.scene(game.after_load);}, 500);
			}, 2000 - (new Date().getTime() - time_before));
		}
	});
});
