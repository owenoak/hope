/*** Control class ***/
Script.require("{{hope}}ElementAdapter.js", function(){


// new Control()
new Class("Control", {
	constructor : function(control) {
		console.warn("new control ",control);
		var name = control.getAttribute(name);
		var attributes = control.selectAll("attribute");
		var templates = control.selectAll("template");
		console.warn("Attributes",attributes);
		
		
	},
	
	adapt : function(element) {
		console.warn("new control ",control);
		var name = control.
		var attributes = control.selectAll("attribute");
		var templates = control.selectAll("template");
		console.warn("Attributes",attributes);
	}
});

ElementAdapter.registerAdapter(Control, "control");


Script.loaded("{{hope}}Control.js");
});// end Script.require
