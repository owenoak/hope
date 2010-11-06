/* Panel. */

Script.require("{{hope}}Section.js", function(){


new $Section.Subclass("$Panel", {
	tag : "panel",
	properties : {
		template : "<container></container>",
	}
});



Script.loaded("{{hope}}Panel.js");
});
