/* Actions -- button-like things. */

//TEST CHANGE

//TODO:   	set title dynamically, just like we're setting checked?
//TODO:		different event handlers (eg: down, etc)

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("$Action", {
	tag : "action",
	properties : {
		listeners : "click",

		// action to do when clicked
//TODO: recast this as an event...  "onDo" ? "onActivated" (yuck)
		handler : new Attribute({name:"handler", type:"function", args:"event"}),

		onClick : function(event) {
			if (this.enabled && this.handler) this.handler(event);
		},
		
		// When our parent is shown, check our visible, enabled and checked attributes.
		//	If we have a showif, enableif or checkif property, that will update it.
		onParentShown : function() {
			this.visible;
			this.enabled;
			this.selected;
		}
	}

});


Script.loaded("{{hope}}Action.js");
});
