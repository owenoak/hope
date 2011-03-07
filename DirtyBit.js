/* Section.  Can have header/footer/bodies */

Script.require("", function(){

//TODO: associate directly with a dataset ?

new Element.Subclass("hope.DirtyBit", {
	tag : "dirtybit",
	properties : {
		onReady : function() {
			if (!this.filename) this.filename = "Unknown file";
			if (!this.state) this.state = "unloaded";
		},

		// states:  unloaded, loadError, saved, dirty, error		
		state		: Attribute({name:"state", 
			get : function() {
				return this._state || "unloaded";
			},
			set: function(newState) {
				this._state = newState;
				this.attr("state", newState);
				var message = this[newState + "Message"];
				this.message = (message ? message.expand(this) : "");
			}
		}),
		
		// file we're representing
		filename	: Attribute({name:"filename", update:true}), 
		
		// message about state of file
		message		: Attribute({name:"title", update:true}), 

		// messages to show for the different states
		unloadedMessage : Attribute({name:"unloadedMessage", inherit:true, value:"{{filename}} has not been loaded."}),
		loadErrorMessage : Attribute({name:"loadErrorMessage", inherit:true, value:"Error loading {{filename}}."}),
		savedMessage : Attribute({name:"savedMessage", inherit:true, value:"{{filename}} saved."}),
		dirtyMessage : Attribute({name:"dirtyMessage", inherit:true, value:"{{filename}} needs to be saved."}),
		errorMessage : Attribute({name:"errorMessage", inherit:true, value:"Error saving {{filename}}.  Check permissions?"})
	}
});



Script.loaded("{{hope}}DirtyBit.js");
});
