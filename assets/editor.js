/*
*	part of PUZZLE PLATFORMER
*	   by rubenwardy (rubenwardy@gmail.com)
*	Licensed under GNU GPL 3.0 or later. See LICENSE.txt
*/

game.after_load = "editor";
game.is_editor = true;

function ed_save(){
	console.log("Exporting...");
	var maps = map.save();
	map.getDim();
	var cakes = map.getCakes();

	var res = "define.map({\n";
	res += "\tspawn:{\n";
	res += "\t\tx: 1,\n";
	res += "\t\ty: 2\n";
	res += "\t},\n";
	res += "\twidth: "+map.map_data.width+",\n";
	res += "\theight: "+map.map_data.height+",\n";
	res += "\tcakes: "+cakes+",\n";
	res += "\tmap: [\n";
	res += maps;
	res += "\n\t]\n";
	res += "});";

	$("#load_dia").remove();
	var out = '<div id="load_dia"><h2>Save Level</h2><textarea id="load_code">'+res+'</textarea>';
	out += '<p><a onClick="$(\'#load_dia\').remove();">Close</a></p></div>';
	$("body").append(out);
}

function ed_load(){
	$("#load_dia").remove();
	var out = '<div id="load_dia"><h2>Load level</h2><textarea id="load_code"></textarea>';
	out += '<p><a onClick="ed_doload();">Load</a> - <a onClick="$(\'#load_dia\').remove();">Close</a></p></div>';
	$("body").append(out);
}

var NEXT_MAP = {
	spawn:{
		x: 1,
		y: 2
	},
	width: 4,
	height: 4,
	cakes:1,
	map: [
		["blank","blank","blank","blank"],
		["blank","cake","","blank"],
		["blank","","","blank"],
		["blank","blank","blank","blank"]
	]
};

function ed_doload(){
	code = $("#load_code").val();
	console.log(code);
	$("#load_dia").remove();
	eval(code);
	NEXT_MAP = define._map[define._map.length-1];
	Crafty.scene("editor");
}

render_grid = function(c){
	var topx = (Crafty.viewport.x%64)-10;
	var topy = (Crafty.viewport.y%64)+5;
	c.beginPath();
	for (var x = topx; x<($(window).width()); x+=64){
		if (x>0){
			if (Crafty.viewport.x-10 == x){
				c.strokeStyle="white";
				c.stroke();
				c.beginPath();
				c.moveTo(190+x+0.5,0);
				c.lineTo(190+x+0.5,$(window).height());
				c.strokeStyle="black";
				c.stroke();
				c.beginPath();
			}else{
				c.moveTo(190+x+0.5,0);
				c.lineTo(190+x+0.5,$(window).height());
			}
		}
	}
	for (var x = topy; x<($(window).height()); x+=64){
		if (Crafty.viewport.y+5 == x){
			c.strokeStyle="white";
			c.stroke();
			c.beginPath();
			c.moveTo(192,x-0.5);
			c.lineTo($(window).width(),x-0.5);
			c.strokeStyle="black";
			c.stroke();
			c.beginPath();
		}else{
			c.moveTo(192,x-0.5);
			c.lineTo($(window).width(),x-0.5);
		}
	}
	c.strokeStyle="white";
	c.stroke();
};

var EDMODE = "rubber";
var EDTOOL = "pencil";

function ed_updatetoolbar(){
	$("#tools").children('ul').children('li').each(function(){
		console.log("Removing...");
		$(this).children('a').removeClass('selected');
	});
	$("#"+EDMODE).addClass('selected');
	$("#tool_"+EDTOOL).addClass('selected');
}

function change_mode(name){
	EDMODE = name;
	ed_updatetoolbar();
}

function dotool(x,y){
	if (x<0 || y<0)
		return;

	if (EDMODE == "rubber"){
		map.set(x,y,'');
	}else if (EDMODE == "player"){

	}else{
		map.set(x,y,EDMODE);
	}
}

// Editor
var prev;
Crafty.scene("editor", function () {
	game.player = null;
	map = Map();
	map.load(NEXT_MAP);
	Crafty.viewport.x = 75;
	Crafty.viewport.y = 60;

	// Debugging background:
	//		warns user that the script has not finished.
	Crafty.background("#ffcccc");
	var tmp = 'Level Editor<hr style="border: 0;height:1px;background:black;">';//'<div id="editor">';
	tmp += '<a onClick=\"ed_save();\" style="text-decoration:underline;">Save</a> - ';
	tmp += '<a onClick=\"ed_load();\" style="text-decoration:underline;">Load</a>';
	tmp += ' - <a href=\"index.html\">Exit</a>';
	//tmp += '</div>';
	$("#fps").html(tmp);
	tmp = '<div id="tools">';
	tmp += '<ul>';
	tmp += '<li><a id="tool_pencil" onClick="change_tool(\'pencil\');">Pencil</a></li>';
	tmp += '<li><a id="tool_rect" onClick="change_tool(\'pencil\');">Rectangle</a></li>';
	tmp += '<li><hr style="border: 0;height:1px;background:black;"></li>';
	tmp += '<li><a id="rubber" onClick="change_mode(\'rubber\');">Rubber</a></li>';
	tmp += '<li><a id="player" onClick="change_mode(\'player\');">Player</a></li>';
	tmp += '<li><hr style="border: 0;height:1px;background:black;"></li>';
	for (key in define._bloc) {
		var b = define._bloc[key];
		if (b.desc)
			tmp += '<li><a id="'+b.name+'" onClick="change_mode(\''+b.name+'\');">'+b.desc+'</a></li>';
		else
			tmp += '<li><a id="'+b.name+'" onClick="change_mode(\''+b.name+'\');">'+b.name+'</a></li>';
	}
	tmp += '</ul>';
	tmp += '</div>';
	$("#panel").append(tmp);

	// FPS counter
	/*var fps = Crafty.e("FPS")
	.bind("MessureFPS",function(fps){
		var res = "Map Editor<br>";
		res += "FPS: " + fps.value;
		$("#fps").html(res);
	});*/

	Crafty.e("Keyboard").bind("EnterFrame",function(){
		var cur = (new Date).getTime();
		var dt = (cur - prev) / 1000;
        prev = cur;

		var sp = 128;
		if ((Crafty.keydown[Crafty.keys['W']] || Crafty.keydown[Crafty.keys['UP_ARROW']])){
			Crafty.viewport.y += sp * dt;
		}
		if ((Crafty.keydown[Crafty.keys['D']] || Crafty.keydown[Crafty.keys['RIGHT_ARROW']])){
			Crafty.viewport.x -= sp * dt;
		}
		if ((Crafty.keydown[Crafty.keys['S']] || Crafty.keydown[Crafty.keys['DOWN_ARROW']])){
			Crafty.viewport.y -= sp * dt;
		}
		if ((Crafty.keydown[Crafty.keys['A']] || Crafty.keydown[Crafty.keys['LEFT_ARROW']])){
			Crafty.viewport.x += sp * dt;
		}
		render_bg();
	});

	var win = $(window)[0];
	win.addEventListener('mousemove', function(e) {
        game.mouse = {
          x: e.clientX,
          y: e.clientY
        };
	});
	win.addEventListener('click', function(e){
		if (game.mouse.x > 190 && !$("#load_dia")[0]){
			dotool(
				Math.floor((game.mouse.x-Crafty.viewport.x-180)/64),
				Math.floor((game.mouse.y-Crafty.viewport.y)/64)
			);
		}
	}, false);

	// Initiate the inventory
	ed_updatetoolbar();
	//dotool(0,0);
	Crafty.background("transparent");
},function(){
	$('#tools').remove();
	$('#editor').remove();
});
