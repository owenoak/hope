/** Colors -- parses various color forms, lightens/darkens/etc */

function Color(string) {
	string = string.toLowerCase();
	if (hope.Colors[string]) return hope.Colors[string];
}

hope.extend(Color, {
	

	prototype : {
		r : 0,
		g : 0,
		b : 0,
		a : 255,
		
		// darkens/lightens and returns a new color
		darken : function(percent) {},
		lighten : function(percent) {},
		adjustColor : function(percent) {},
		
		// output hex value
		toHex : function(){},


		toString : function(){}
		
	}
});

hope.registerThing("Color", Color);
hope.registerThing("Colors", {});
