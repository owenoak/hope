/* Datasets 
	- use .load()  (from Element-load.js) to load contents into the dataset
*/

//TODO: refactor to use Saveable

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("hope.Dataset", {
	tag : "dataset",
	properties : {
		listeners : "save",
		visible : false,

		onReady : function() {
			var global = this.globalizeAs;
			if (global) {
				hope.setGlobal(global, this.firstChild);
			}
		},

		// if set, when we load, we'll set first child of dataset as global with this name
		globalizeAs : new Attribute("globalizeAs"),

		// generic save url -- note that we encode the file name based on dataset.url
		// NOTE: THIS IS ALL KINDS OF UNSAFE!
		saveUrl : "editor/save.php?file={{url}}",
		
		// Mark this element as dirty (needing to be saved).
		//	This will cause an actual save to be issued in about 1 second.
		dirty : new Property({
			get : function(){return this._dirty},
			set : function(value) {
				this._dirty = !!value;
				if (this._dirty) this.soon(1000, "save");
			}
		}),
		
		onSave : function() {
			this.save();
		},


		// actually do the save
		//  TODO: pass in callback/errback ?
		save : function(callback, errback, scope) {
			var url = this.url;
			if (!this.url) throw "No @url specified for dataset "+this;
			if (!this.isLoaded) return console.warn(this,"not loading, nothing to save, exiting");
			var saveUrl = this.saveUrl.expand(this);
			
			if (typeof callback == "function") {
				var itemCallback = callback;
				callback = function() {
					this.saveCallback();
					itemCallback.call(scope||this);
				}
			} else {
				callback = this.saveCallback;
			}
			
			if (typeof errback == "function") {
				var itemErrback = errback;
				errback = function() {
					this.saveErrback();
					itemErrback.call(scope||this);
				}
			} else {
				errback = this.saveErrback;
			}
			
			XHR.post(saveUrl, null, this.innerHTML, callback, errback, this);

			// NOTE: mark us as not dirty NOW, before save completes
			//			so we'll be re-marked as dirty if another change comes in while we're saving
			this._dirty = false;
		},
		
		// data actually saved
		saveCallback : function(scope, response, request) {},

		// something went wrong during saving, re-mark us as dirty
		saveErrback : function(scope, status, request) {
			console.error("Save error ",scope, status, request);
			this._dirty = true;
		}


	}
});


Script.loaded("{{hope}}Dataset.js");
});
