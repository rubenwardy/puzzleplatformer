/*
**  PUZZLE PLATFORM
**    by Andrew Ward (anjayward@gmail.com)
**   (c) All rights reserved
**   You may not modify, redistribute, sell
**   or license this product in any way.
**
**   Copyrights to scripts and resources
**   in assets/libraries are owned by other people
*/

var FACING_RIGHT   = 0;
var FACING_LEFT    = 1;
var FACING_FORWARD = 2;

// Player component
// Handles player related stuff
Crafty.c("Player",{
	pbody: null,
	deadbody: null,
	lastSpawn: {x:1,y:1},
	pulling: null,
	head: null,
	pbody: null,
	foot: null,
	left_hand: null,
	right_hand: null,
	facing: FACING_RIGHT,
	lock_turn: 0,
	health: 10,
	freeze: false,
	data: {
		head: 'default',
		body: 'default'
	},
	hit: function(amt){
		if (this.health == 0 && this.dstart){
			return;
		}

		this.health -= amt;

		var f = $("#flash");
		f.show();
		f.fadeOut();

		if (this.health <= 0){
			this.kill();
		}
	},
	kill: function(){
		if (this.health == 0 && this.dstart){
			return;
		}
		console.log("Player has died!");
  		this.head.visible = false;
		this.pbody.visible = false;
		this.deadbody.visible = true;
		$(".DeadPlayer").show();
		this.health = 0;
		this.freeze = true;
		this.dstart = new Date().getTime();
		this.body.SetAwake(false);
	},
	revive: function(){
		console.log("Reviving player");
		this.goto(this.lastSpawn);
		this.attr({x: this.body.GetPosition().x, y: this.body.GetPosition().y});
		this.head.visible = true;
		this.pbody.visible = true;
		this.deadbody.visible = false;
		$(".DeadPlayer").hide();
		setTimeout(function(){
			console.log("Unfrozen");
			game.player.health = 10;
			game.player.freeze = false;
			game.player.body.SetAwake(true);
		}, 10);
	},
	goto: function(pos){
		console.log("Going to tile ("+pos.x+","+pos.y+")");		
		this.body.SetPosition({x: pos.x,y: pos.y});
		this.body.SetAwake(true);
	},
	newSpawn: function(pos){
		console.log("Last spawn position changed");
		this.lastSpawn = pos;
	},
	init: function(){
		this.requires("Box2D");
		return this;
	},
	player: function(){
		// Set up physics
		this.attr({w:20,h:46,z:500});

		// Create body parts
		this.head = Crafty.e("2D, drawmode, SpriteAnimation, PlayerHead")
			.attr({x:3,z:501});
		this.pbody = Crafty.e("2D, drawmode, SpriteAnimation, PlayerBody")
			.attr({y:8,z:500});
		this.deadbody = Crafty.e("2D, drawmode, SpriteAnimation, DeadPlayer");
		this.deadbody.attr({y:8,x:-2,z:500});

		// Attach body parts
		this.attach(this.head);
		this.attach(this.pbody);
		this.attach(this.deadbody);
		this.deadbody.visible=false;
		$(".DeadPlayer").hide();

		// Bind to events
		/*this.head.bind("NewDirection",function (direction) {
			if (direction.x < 0) {
				if (!this.isPlaying("walk"))
					this.stop().animate("walk", 10, -1);
			}
			if (direction.x > 0 ) {
				if (!this.isPlaying("walk"))
					this.stop().animate("walk", 10, -1);
			}
			if(!direction.x && !direction.y) {
				this.stop();
			}
		});*/
		this.bind("EnterFrame",this._enterframe);
		this.bind("KeyDown", function(e) {				
			if (!this.body || this.freeze)
				return;
			
			// Punch
			if (e.key == Crafty.keys.K) {
				if (this.facing == FACING_RIGHT) {
					var contact = this.contactWithFixture("crushable", this.right_hand);
					if (contact)
						contact[0].obj.crush();
				} else if (this.facing == FACING_LEFT) {
					var contact = this.contactWithFixture("crushable", this.left_hand);
					if (contact)
						contact[0].obj.crush();
				}
			}
			
			// Use
			if (e.key == Crafty.keys.E) {
				if (this.facing == FACING_RIGHT) {
					var contact = this.contactWithFixture("usable", this.right_hand);
					if (contact) {					
						Crafty.trigger("using", contact[0].obj);
						contact[0].obj.use();
					}
				} else if (this.facing == FACING_LEFT) {
					var contact = this.contactWithFixture("usable", this.left_hand);
					if (contact)
						contact[0].obj.use();
				}
			}			
		});

		return this;
	},
	_enterframe: function() {
		// Progress to next level
		if (game.inventory.cake >= map.map_data.cakes  && !game.switching){
			game.switching = true;
			setTimeout(function(){
				game.switching = false;
				game.next_map = define._map[map.map_data.id + 1];
				
				if (game.next_map)
					Crafty.scene("play");
				else
					Crafty.scene("menu");
			}, 2000);
			return;
		}
		
		// Die and revive
		if (this.health <= 0){
			if (!this.dstart)
				this.kill();
				
			if (new Date().getTime() > this.dstart + 500)
				this.revive();
			return;
		}
		if (!this.body || this.freeze)
			return;
		
		// Die if falling too far
		if (this.y > (map.map_data.height + 5)* 64){
			this.kill();
			return;
		}
		this.update_player();
	},
	update_player: function() {
		assert(this.lock_turn >= 0);
		
		var on_ladder = (this.contact("Ladder"))?true:false;
		var up_key = (Crafty.keydown[Crafty.keys['W']] || Crafty.keydown[Crafty.keys['UP_ARROW']] || Crafty.keydown[Crafty.keys['SPACE']]);
		var left_key = (Crafty.keydown[Crafty.keys['A']] || Crafty.keydown[Crafty.keys['LEFT_ARROW']]);
		var right_key = (Crafty.keydown[Crafty.keys['D']] || Crafty.keydown[Crafty.keys['RIGHT_ARROW']]);
		
		// Physics
		var vvel = 3.8;
		
		// Ladder physics
		if (on_ladder) {
			this.body.ApplyForce(new b2Vec2(0, -(9.81 * this.body.GetMass())), this.body.GetPosition());
			this.body.SetLinearDamping(10);
			vvel = 10;
			if ((Crafty.keydown[Crafty.keys['S']] || Crafty.keydown[Crafty.keys['DOWN_ARROW']])){
				this.body.ApplyImpulse(new  b2Vec2(0, 0.5), this.body.GetPosition());
			}
			if (up_key)
				this.body.ApplyImpulse(new  b2Vec2(0, -0.7), this.body.GetPosition());
		} else {
			this.body.SetLinearDamping(0.5);
			
			// Handle Jumping
			var on_ground = (this.contactWithFixture("Obstacle", this.foot)) ? true : false;
			if (up_key && on_ground)
				this.body.ApplyImpulse(new  b2Vec2(0,-0.5), this.body.GetPosition());
		}
		
		// Walk left
		if (left_key) {
			if (this.lock_turn == 0)
				this.facing = FACING_LEFT;
			this.body.ApplyForce(new  b2Vec2(-vvel, 0), this.body.GetPosition());
		} else if (right_key) {
			if (this.lock_turn == 0)
				this.facing = FACING_RIGHT;
			this.body.ApplyForce(new  b2Vec2(vvel, 0), this.body.GetPosition());
		}
	},
	physics: function() {
		this.box2d({
			bodyType: "dynamic",
			density: 1,
			shape: [[0,0],[27,0],[27,29],[0,29]]
		},true);
		this.foot = this.addSensor([[9,30],[20,30],[20,33],[9,33]]);
		this.left_hand = this.addSensor([[-5,10],[0,10],[0,20],[-5,20]]);
		var wid = 27; // width of character
		this.right_hand = this.addSensor([[wid,10],[wid+5,10],[wid+5,20],[wid,20]]);
		return this;
	},
	addSensor: function(loc) {
		this.addFixture({
			bodyType: 'static',
			shape: loc,
			isSensor: true
		});
		return this.fixtures[this.fixtures.length - 1];
	}
});

Crafty.c("PickUp",{
	type: null,
	amount: null,
	count: 0,
	init: function(){
	},
	PickUp: function(type,amount){
		this.type = type;
		this.amount = amount;
		this.count = 0;
		this.bind("EnterFrame",this._enterframe);
	},
	_enterframe: function(){
		this.count += 1;
		if ( this.count > 2 ){
			this.count = 0;			
			var now_pos = {x: game.player.x, y: game.player.y, w: 27, h: 29};
			if ( !this.last_pos ){
				this.last_pos = now_pos;
				return;
			}
			if ( map.raycast_player(this.last_pos, now_pos, {x: this.x+10, y: this.y+10, w: 62, h: 62}, 2) ){
				this.destroy();
				if ( game.inventory[this.type] )
					game.inventory[this.type]+=this.amount;
				else
					game.inventory[this.type]=this.amount;
					
				console.log(this.amount+"x "+this.type+" added to the Inventory");
				Crafty.trigger("PickUp",{type:this.type,amount:this.amount});
				if (this.tile_data.onPickUp){
					this.tile_data.onPickUp(this);
				}
			}
			
		}
	}
});

Crafty.c("Flag",{
	type: null,
	amount: null,
	count: 0,
	init: function(){
		this.count = 0;
		this.triggered = false;
		this.bind("EnterFrame",this._enterframe);
		this.bind("reset_flags", function(){
			if (this.tile_data.onFlagReset)
				this.tile_data.onFlagReset(this);
				
			this.triggered = false;
		});
	},
	_enterframe: function(){
		if (this.triggered)
			return; 
		this.count += 1;
		if ( this.count > 2 ){
			this.count = 0;			
			var now_pos = {x: game.player.x, y: game.player.y, w: 27, h: 29};
			if ( !this.last_pos ){
				this.last_pos = now_pos;
				return;
			}
			if ( map.raycast_player(this.last_pos, now_pos, {x: this.x+10, y: this.y+10, w: 62, h: 62}, 2) ){
				Crafty.trigger("reset_flags");
			
				game.player.newSpawn({x: this.tile_p.x, y: this.tile_p.y});
				
				if (this.tile_data.onFlag)
					this.tile_data.onFlag(this);
					
				this.triggered = true;
			}
			
		}
	}
});