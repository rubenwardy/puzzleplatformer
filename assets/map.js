function Map(){
	return {
		tiles: null,
		map_data: null,
		load: function(data){
			if (!data){
				throw("MapNotFound");
				return;
			}
		
			this.tiles = [];
			this.map_data = data;			

			for (var y = data.map.length-1; y >= 0; y--) {
				this.tiles[y] = [];
				for (var x = 0; x < data.map[y].length; x++) {
					if (data.map[y][x] != ''){
						this.tiles[y][x] = Crafty.e("2D, Tile")
							.tile(data.map[y][x],x,y,data.width,data.height);
					}else{
						this.tiles[y][x] = null;
					}
				}
			}
			
			if (game.player){
				game.player.newSpawn(data.spawn);
				game.player.attr({x: data.spawn.x*64+15,y: data.spawn.y*64+25});
			}
			
			if (this.map_data.help)
				this.show_bubble(this.map_data.help[0]);
		},
		get: function(x,y){
			return this.tiles[y][x];
		},
		set: function(x,y,data){
			while (y>=this.tiles.length){
				this.tiles.push([]);
			}
			while (x>=this.tiles[y].length){
				this.tiles[y].push(null);
			}
			if (this.tiles[y][x]){
				this.tiles[y][x].destroy();
				this.tiles[y][x] = null;
			}
			if (data != ''){
				this.tiles[y][x] = Crafty.e("Tile").tile(data,x,y,this.map_data.width,this.map_data.height);
			}else{
				this.tiles[y][x] = null;
			}
			//this.debug();
		},
		debug: function(){
			var res = "";
			for (var y=0;y<this.tiles.length;y++){				
				for (var x=0;x<this.tiles[y].length;x++){
					if (this.tiles[y][x] && this.tiles[y][x].tile_meta && this.tiles[y][x].tile_data.ascii)
						res += this.tiles[y][x].tile_data.ascii;
					else
						res += ".";
				}
				res += "\n";
			}
			$('#console').remove();
			var out = '<textarea id="console" style="font-family: Courier New, Courier, monospace;height:200px;background:transparent;border: 0;margin-left:180px;';
			out += 'position:fixed;bottom:0;left:0;right:0;padding:1em;">';
			out += res;
			out += '</textarea>';
			$('body').append(out);
		},
		getDim: function(){
			var h = this.tiles.length;
			var w = 0;
			for (var y=0;y<this.tiles.length;y++){
				if (this.tiles[y].length > w)
					w = this.tiles[y].length;
			}
			this.map_data.width = w;
			this.map_data.height = h;			
		},
		getCakes: function(){
			var c = 0;
			for (var y=0;y<this.tiles.length;y++){
				for (var x=0;x<this.tiles[y].length;x++){
					if (this.tiles[y][x] && this.tiles[y][x].tile_meta && this.tiles[y][x].tile_meta.node == "cake")
						c++;
				}
			}
			return c;
		},
		save: function(){
			var res = "";	
			for (var y=0;y<this.tiles.length;y++){
				if (res != "")
					res += ",\n";
				var row = "";
				for (var x=0;x<this.tiles[y].length;x++){
					if (row!="")
						row += ", ";
						
					if (this.tiles[y][x] && this.tiles[y][x].tile_meta && this.tiles[y][x].tile_meta.node)
						row += '"' + this.tiles[y][x].tile_meta.node + '"';
					else
						row += '""';
				}
				res += "\t\t["+row+"]";
			}
			return res;
		},
		raycast_player: function(from, to, rect, step){
			function interRect(one, other) {
				return !(
					other.x > one.x + one.w || 
					other.x + other.w < one.x || 
					other.y > one.y + one.h ||
					other.y + other.h < one.y
				);
			};
		
			var distance = Math.sqrt( Math.pow(from.x - to.x, 2) + Math.pow(from.y - to.y, 2) );
			var direction = Math.atan((to.y - from.y) / (to.x - from.x));
			for (var i = 0; i < distance; i += step){
				var pos = {
					x: from.x + Math.cos(direction) * i,
					y: from.y + Math.sin(direction) * i,
					w: 27,
					h: 29
				};
				if (interRect(rect, pos))
					return true;
			}
			if (interRect(rect, {x: to.x, y: to.y, w: 27, h: 29}))
				return true;
				
			return false;
		},
		show_bubble: function(data){
			Crafty.e("Bubble_E").bubble(data);
		}
	};
};

var BUBBLES = 0;
Crafty.c("Bubble_E",{
	init: function(){
		this.bub_id = BUBBLES;
		BUBBLES = BUBBLES + 1;
	},
	bubble: function(data){		
		if (data.at){
			this.requires("2D, DOM, bubble, Text");
			this.text(data.msg);
			this.attr({
				x: data.at.x * 64,
				y: data.at.y * 64 + 10,
				z: 1000
			});
			if (data.behind)
				this.attr({z: 0});
			if (data.at.w)
				this.attr({w: data.at.w});
			if (data.at.h)
				this.attr({h: data.at.h});
			
		}else{		
			$("#bubble").remove();
			$("body").append("<div id=\"bubble_" + this.bub_id + "\" class=\"bubble\">" + data.msg + "</div>");
			if (data.behind)
				$("#bubble").css("z-index", "0");
		}
	}

});

// Tile components
Crafty.c("Tile",{
	// Tile properties
	tile_data: null, // The tile definition
	tile_meta: null, // The tile meta data
	tile_p: null, // The tile position
	
	show: function(){
		this.visible = true;
	},
	hide: function(){
		this.visible = false;
	},

	// Set up functions
	tile: function(_tile,_x,_y,mapwidth,mapheight){
		this.mapwidth = mapwidth;
		this.mapheight = mapheight;
		this.get_def(_tile,_x,_y);

		// Check stuff
		if (!this.tile_data)
			return null;

		// Load required components
		this.addComponent(this.require());

		// Set position
		this.attr({
			x: (this.tile_p.x*64)-10,
			y: (this.tile_p.y*64)-10,
			z: _x + (mapheight-_y) * mapwidth
		});
		
		this.bind("move",function() {
			this.attr({z: Math.floor((this.x+10)/64 + (this.mapheight-(this.y+10)/65) * this.mapwidth)}); 
		});

		// Do draw type
		this.addComponent("Tile"+this.tile_data.drawtype);
		
		
		// Init physics
		if (this.tile_meta && this.tile_meta.visible == false) {
			this.hide();
		} else {
			if (this.init_physics)
				this.init_physics();
		}

		// Run function, if needed
		if ((game.player && this.tile_data.init) || this.tile_data.init_req)
			if (this.tile_data.init(this)==false)
				return null;

		return this;
	},
	require: function(){
		var def = "2D, drawmode";
		// Extra components
		if (this.tile_data.c)
			def += ", "+this.tile_data.c;

		// Standard components
		if (this.tile_data.physics)
			def += ", TilePhysics";

		return def;
	},
	get_def: function(_tile,_x,_y){
		var tile;

		if (typeof(_tile) == "string"){
			tile=_tile;
			this.tile_meta = {node:tile};
		}else{
			tile=_tile.node;
			this.tile_meta = _tile;
		}

		this.tile_data = define._bloc[tile];
		
		if (!this.tile_data && define._alias[tile]){
			this.tile_meta.node = define._alias[tile];
			this.tile_data = define._bloc[define._alias[tile]];
		}

		// Give the position
		this.tile_p = {
			x:_x,
			y:_y
		};
	}
});

// THESE DEFINE BUILT IN TILE DRAW TYPES
// -------------------------------------
// Drawtypes:
// 	* Tile - Adds a sprite that fits behind.
//	* Block - Does above and makes a perspective block.
//	* Anim - Defines an animated sprite.
// -------------------------------------

Crafty.c("TileTile",{
	spritemap: null,
	init: function(){		
		if (this.tile_data.tile && this.tile_data.tile.tile)
			this.spritemap = this.tile_data.tile.tile;
		else
			this.spritemap = "default";	
		
		if (this.tile_data.tile && this.tile_data.tile.ani) {
			this.applyAnimation(this.tile_data.tile, this);
		}else{
			this.requires("Sprite");
			this.addComponent(this.spritemap);
			this.sprite(this.tile_data.tile.x, this.tile_data.tile.y, 80, 80);
			this.crop(0, 0, 80, 80);
		}
		
		if (game.is_editor && this.tile_data.drawtype=="Block")
			this.visible = false;

		return this;
	},
	applyAnimation: function(tile_data, sprite){
		sprite.requires("SpriteAnimation");
		sprite.addComponent(this.spritemap);	
		var frames = [];
		if (tile_data.ani.frames) {
			frames = tile_data.ani.frames;
		} else {
			for (var i = 0; i < tile_data.ani.l; i++) {
				frames.push([tile_data.x + i, tile_data.y]);
			}
		}
		sprite.reel("normal", tile_data.ani.dur, frames);
		sprite.animate("normal", -1);
	}
});

Crafty.c("TileBlock",{
	front: null,
	init: function(){		
		this.addComponent("TileTile");
		this.front = Crafty.e("2D, drawmode");
		if (this.tile_data.tile && this.tile_data.tile.ani)
			this.applyAnimation(this.tile_data.tile, this.front);
		else{			
			this.front.requires("Sprite");
			this.front.addComponent(this.spritemap);
			this.front.sprite(this.tile_data.tile.x, this.tile_data.tile.y, 80, 80);			
		}
		function getOrDef(one, two){
			if (one!=null)
				return one;
			else
				return two
		}
		var height = getOrDef(this.tile_data.top, 15);
		var right = getOrDef(this.tile_data.right, 64);
		var bottom = getOrDef(this.tile_data.bottom, 80);
		this.front.crop(0, height, right, bottom - height);		
		this.front.attr({
			x: (this.tile_p.x*64)-10,
			y: (this.tile_p.y*64)-10+height,
			z: 1000
		});
		this.attach(this.front);
		return this;
	},
	show: function(){
		this.visible = true;
		this.front.visible = true;		
	},
	hide: function(){
		this.visible = false;
		this.front.visible = false;
	},
});

Crafty.c("TilePhysics",{
	_physics: null,
	init_physics: function(){
		// Get physics object def
		this._physics = this.tile_data.physics;
		
		if (!this._physics.isSensor){
			this.addComponent("Obstacle");
		}


		this.addComponent("Box2D");


		// Create physics object, if not defined
		if (!this._physics)
			return;

		// Set body type, if not defined
		if (!this._physics.bodyType)
			this._physics.bodyType = "static";

		// Set shape, if not defined
		if (!this._physics.shape)
			this._physics.shape = [[10,10],[72,10],[72,72],[10,72]];

		// Add Box2D physics, if needed
		if (this.box2d)
			this.box2d(this._physics,true);

		return this;
	}
});