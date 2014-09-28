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
						this.tiles[y][x] = Crafty.e("Tile").tile(data.map[y][x],x,y,data.width,data.height);
					}
				}
			}
			
			game.player.newSpawn(data.spawn);
			game.player.attr({x: data.spawn.x*64+15,y: data.spawn.y*64+25});;
		},
		get: function(x,y){
			return this.tiles[y][x];
		}
	};
};

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
			x:(this.tile_p.x*64)-10,
			y:(this.tile_p.y*64)-10,
			z:_x + (mapheight-_y) * mapwidth
		});
		
		this.bind("move",function(from){
			this.attr({z: Math.floor((this.x+10)/64 + (this.mapheight-(this.y+10)/65) * this.mapwidth)}); 
		});

		// Init physics
		this.init_physics();

		// Do draw type
		this.addComponent("Tile"+this.tile_data.drawtype);

		// Run function, if needed
		if (this.tile_data.init)
			if (this.tile_data.init(this)==false)
				return null;

		return this;
	},
	require: function(){
		var def = "2D, "+DrawMode;
		// Extra components
		if (this.tile_data.c)
			def += ", "+this.tile_data.c;

		// Standard components
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

		// Give the position
		this.tile_p = {
			x:_x,
			y:_y
		};
	}
});

// THIS DEFINES BUILT IN TILE DRAW TYPES
// -------------------------------------
// Drawtypes:
// 	* Tile - Adds a sprite that fits behind.
//	* Block - Does above and makes a perspective block.
//	* Anim - Defines an animated sprite.
// -------------------------------------

Crafty.c("TileTile",{
	spritemap: null,
	init: function(){
		if (!this.tile_data.tile){
			this.spritemap = "Tiles";
		}else{
			this.spritemap = this.tile_data.tile.tile;
			if (!this.spritemap)
				this.spritemap = "Tiles";
		}

		this.addComponent(this.spritemap);

		this.sprite(this.tile_data.tile.x,this.tile_data.tile.y,80,80);

		return this;
	}
});

Crafty.c("TileBlock",{
	front: null,
	init: function(){
		this.addComponent("TileTile");

		this.front = Crafty.e("2D, "+DrawMode+", Sprite, " + this.spritemap);

		this.front.attr({
				x:(this.tile_p.x*64)-10,
				y:(this.tile_p.y*64)+5,
				z:1000
			});
		this.front.sprite(this.tile_data.tile.x,this.tile_data.tile.y,80,80);
		this.front.crop(0,15,64,65);

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
			this._physics = {};

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