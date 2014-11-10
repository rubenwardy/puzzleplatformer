game.after_load = "menu";

/*
 *	Menu
 */

Crafty.scene("menu", function() {
	// Set up style
	Crafty.background("transparent");
	Crafty.e("CloudSystem").clouds({top:0, height: 350, res: 23});

	Crafty.e("2D, DOM, Image")
		.attr({x: -20, y: Crafty.viewport.height - 110})
		.image("assets/sprites/pp.png");
	Crafty.e("2D, DOM, Image")
		.attr({x: Crafty.viewport.width - 190, y: Crafty.viewport.height - 115})
		.image("assets/sprites/pp_right.png");

	$("#fps").hide();
	var d = "<ul id=\"menu\">\n";
	d += "<li><a onClick=\"play_game(-1);\">Play Game</a></li>\n";
	d += "<li><a onClick=\"\">Level Select</a></li>\n";
	d += "<li><a href=\"editor.html\">Map Editor</a></li>\n";
	d += "<li><a onClick=\"$('#help').fadeToggle(100);\">Help</a></li>\n";
	d += "</ul>\n";
	d += "<div id=\"help\" style=\"display:none;\">\n";
	d += "<b>Help</b>\n";
	d += "<p>Get all the cakes to win!</p>";
	d += "<b>WASD</b> to Move<br>";
	d += "<b>Space</b> to Jump<br>";
	d += "</div>\n";

	$("body").append(d);
	$("#menu").css("left", (Crafty.viewport.width/2 - $("#menu").width()/2 + 20) + "px");
},function(){
	$("#menu").remove();
	$("#fps").fadeIn();
});

function play_game(map_id){
	if (map_id){
		game.next_map = define._map[0];
	}else{
		game.next_map = define._map[map_id];
	}

	Crafty.scene("play");
}
var prev = 0;
game.fpsco = 10000;

Crafty.c('FPS_TICK', {
    init: function() {
        this.ticks = 0;
        this.lastReportedOn = new Date().getTime();

        this.bind('MeasureRenderTime', function(elapsed) {
            this.ticks += 1;
        });

        this.bind('EnterFrame', function() {
            var now = new Date().getTime();
            var seconds = (now - this.lastReportedOn) / 1000;

            if (seconds >= 0.5) {
				$("#fps").html(
					"Puzzle Platform<br>" +
					"CAKE: " + game.inventory.cake +
					"<br>FPS: " + Math.round(this.ticks / seconds) +
					"<br>Facing: " + ((game.player.facing==FACING_RIGHT)?"right":"left")
				);
				this.ticks = 0;
				this.lastReportedOn = now;
            }
        });
    }
});

// Play scene
Crafty.scene("play", function () {
	// Debuging background: warns user that the script has not finished.
	Crafty.background("#ffcccc");

	// Create player
	game.inventory = {};
	game.player = Crafty.e("2D, Player, Keyboard").player();

	// follow player
	Crafty.viewport.clampToEntities = false;
	Crafty.viewport.follow(game.player, 0, 0);

	// Load test_map
	map = Map();
	map.load(game.next_map);

	// Set up physics
	game.player.physics();

	// FPS counter
	var fps = Crafty.e("2D, FPS_TICK");

	// Initiate the inventory
	game.inventory = {cake:0};

	/*Crafty.e("CloudSystem").clouds({
		left:-Crafty.viewport.width/2,
		width: 2*Crafty.viewport.width,
		top:-Crafty.viewport.height/2,
		height: 2 * Crafty.viewport.height / 3,
		res: 32
	});*/

	$("#fps").html("Puzzle Platform");
	Crafty.background("transparent");
});
