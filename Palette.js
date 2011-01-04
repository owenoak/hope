/* Palette. */

Script.require("{{hope}}Element.js", function(){


new $Section.Subclass("$Palette", {
	tag : "palette",
	properties : {
		visible : false,
		
		open : function() {
			this.fire("opened");
			this.visible = true;
		},
		
		close : function() {
			this.fire("closed");
			this.visible = false;
		}
	}
});



Script.loaded("{{hope}}Palette.js");
});
