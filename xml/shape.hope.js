/* BEGIN hide from global scope */(function($, hope) {

new Thing({
	type : "shape",
	isA  : "drawable",
	
	mixins : [
				"showingPoints",
				"mouseEvents",
				"keyboardEvents",
				"containerEvents",
				"gestures"
			],
	
	properties : [
		"paths", "closed"
	],

	prototype : {
		initialize : function(){},
		
		set_path : function(path) {	
			hope.types.path.normalize(path);
			this.paths.setItem(path, 0); 
		},
		

	// closed = is the path closed, setter generated from flag to transform value		
		closed	: true,
		setClosed : function(value) { return hope.properties.Flag.set(this, "closed", true, value) },
		
	// draw variants
		draw : function() {},
		drawBorder : function() {},
		drawFill : function() {},
		drawAsMask : function() {},
		erase : function() {}
	},
	
	// initialize the Shape class
	initialize : function() {
		// set up the path/paths notification binding
		hope.bind
	
	}
});


/* END hide from global scope */ })();
