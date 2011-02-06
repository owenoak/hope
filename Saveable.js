/*** Make an element saveable by mixing this in.
	 Will fire "saved" and "saveError" as appropriate after saving.

	 Also provides `dirty` semantics: set element.dirty to true to automatically save
	 	if element.autoSave is true.
	 
	 
	 You should implement:
	 	- element.saveUrl			- url on the server to call to do the actual saving
	 	- element.url 				- file name on the server to save to
	 	- element.getSaveText()		- text to save.  Default is our outerHTML.
 ***/

Script.require("{{hope}}Element.js", function() {
var Saveable = {
	// mix methods into an element, but don't intialize
	mixinTo : function(it) {
		if (it.isAClass) it = it.prototype;
		hope.extendIf(it, this.prototype);
		return it;
	},
	
	// apply directly to an element and set things up
	applyTo : function(element) {
		this.mixinTo(element);
	}
}
hope.setGlobal("Saveable", Saveable);
Saveable.prototype = {
		// generic save url -- note that we encode the file name based on element.url
// NOTE: THIS IS ALL KINDS OF UNSAFE!
		saveUrl : "save.php?file={{url}}",

		// if true, we automatically save after autoSaveDelay once we're set to dirty
		autoSave : Attribute({name:"autoSave", type:"flag", update:true, inherit:true, 
								trueIf:["",true,"yes","true"]
							}),
		
		// delay in SECONDS to delay before saving.  
		//	Set to 0 to save right away when dirty (although it will not block).
		autoSaveDelay : Attribute({name:"autoSaveDelay", type:"number", update:true, inherit:true,
									value:5
								}),

		// Mark this element as dirty (needing to be saved).
		//	This will cause an actual save to be issued if autoSave is true.
		dirty : new Property({
			get : function(){return this._dirty},
			set : function(value) {
				this._dirty = !!value;
				if (this._dirty && this.autoSave) this.soon(this.autoSaveDelay*1000, "save");
			}
		}),
		
		// return the text to save
		getSaveText : function() {
			return this.outerHTML;
		},

		// actually do the save
		onSave : function(event, callback, errback, scope) {
			var url = this.url;
			if (!this.url) throw "No @url specified to save "+this;
			var saveUrl = this.saveUrl.expand(this);
			
			function saved() {
				this.fire("saved");
				if (callback) callback.call(scope, this);
			}
			function saveError() {
				this.fire("saveError");
				if (errback) errback.call(scope, this);
			}
			
			// NOTE: mark us as not dirty NOW, before save completes
			//			so we'll be re-marked as dirty if another change comes in while we're saving
			this._dirty = false;

			XHR.post(saveUrl, null, this.getSaveText(), saved, saveError, this);
		}
};

Script.loaded("{{hope}}Saveable.js");


});	// end Script.require
