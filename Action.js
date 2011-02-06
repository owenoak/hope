/* Actions -- button-like things. */

//TEST CHANGE

//TODO:   	set title dynamically, just like we're setting checked?
//TODO:		different event handlers (eg: down, etc)

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("hope.Action", {
	tag : "action",
	properties : {

//TODO: touchStart ???
		listeners : "mousedown,click",

		// named icon to show
		icon : new Attribute({name:"icon", update:true,
			onChange : function(newValue) {
				// make sure we have an icon sub-element
				if (this.select("icon") == null) this.prepend(new hope.Icon());
//console.warn(this,"changing icon to ",newValue, this.select("icon"));
				return newValue;			
			}
		}),

		// label for the action (user-visible)
		label : new Attribute({name:"label", update:true,
			onChange : function(newValue) {
				// get a pointer to our <label> or create one if necessary
				var label = this.select("label") || this.append(new hope.Label());
				label.html = newValue;
//console.warn(this,"changing label to ",newValue, label);
				return newValue;
			}
		}),
		

		// action to do when clicked
//TODO: recast this as an event...  "onDo" ? "onActivated" (yuck)
		handler : new Attribute({name:"handler", type:"function", args:"event"}),

		onMousedown : function(event) {
			if (!this.enabled) return;
			this.activate();
			document.body.once("mouseup", this.deactivate, this);
		},
		
		// show as "active"
		activate : function() {
			this.classList.add("active");
		},

		// show as "inactive"
		deactivate : function() {
			this.classList.remove("active");
		},

		onMouseup : function(event) {
			if (this.enabled) this.deactivate();
		},

		onClick : function(event) {
			if (this.enabled && this.handler) this.handler(event);
		},
		
		// When our parent is shown, check our visible, enabled and checked attributes.
		//	If we have a showif, enableif or checkif property, that will update it.
		onShown : function() {
			this.visible;
			this.enabled;
			this.selected;
		}
	}

});


Script.loaded("{{hope}}Action.js");
});
