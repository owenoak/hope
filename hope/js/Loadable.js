

new hope.Operation.subclass({
	name : "Loader",
	prototype : {
		callbackName : "onLoaded",
		errbackName : "onLoadError"
	}
});

/** Loadable mixin.  
	Specify loadOptions for customization, or create an Operation called <mixeeType>Loader for full custom loader.
	TODO: different semantics for the constructor?
*/
new hope.Mixin({
	name : "Loadable",

	/** Don't overwrite properties already set on the mixee. */
	overwrite : hope.MERGE,

	prototype : {
		/** Loader for this instance, created automatically and stored in the cache.  */
		get_loader : function() {
			if (!this._loader) {
				// create a new loader, setting this as the callbackTarget
				var options = this.loadOptions || {};
				options.callbackTarget = this;
				this._loader = new (this.constructor.loader)(options);
			}
			return this._loader;
		},
		/** Has this thing been loaded successfully? */
		get_loaded : function(){return this.loader.state == hope.LOADED},
		set_loaded : function(flag){return this.loader.state = (flag == true ? hope.LOADED : hope.UNLOADED)},
		
		/** Aliases for the load url. */
		get_src : function(){return this.loader.url},
		set_src : function(url){return this.loader.set("url", url)},

		/** Alias for the load output. */
		get_data : function(){return this.loader.output},
		get_dataType : function(){return this.loader.outputType},
		set_dataType : function(type){return this.loader.set("outputType", type)},
		
		/** Aliases for load/load error messages. */
		get_loadMessage : function(){return this.loader.message},
		set_loadMessage : function(msg){return this.loader.set("loadMessage", msg)},
		get_loadErrorMessage : function(){return this.loader.errorMessage},
		set_loadErrorMessage : function(url){this.loader.set("errorMessage", errorMessage)},
		
		/** Load command.  Pass a url (string) or object of options to load. */
		load : function(options, onLoaded, onLoadError) {
			options = (typeof options == "string" ? {url:options} : options||{});
			if (onLoaded) options.onLoaded = onLoaded;
			if (onLoadError) options.onLoadError = onLoadError;
			this.loader.execute(options);
			return this;
		},

		// onLoaded and onLoadError handlers, called as:   (event, [data|error], key, target)
		onLoaded : undefined,
		onLoadError : undefined
	},
	
	statics : {
		load : function(options, onLoaded, onLoadError) {
			// if options is an array of strings, make an OperationQueue and load them all one at a time
			if (hope.isListLike(options)) {
				var operations = options, i = -1, url;
				while (url = operations[++i]) {
					operations[i] = new (this.loader)({url:url});
				}
				var options = {operations:operations};
				if (onLoaded) options.onCompleted = onLoaded;
				if (onLoadError)  options.onError = onLoadError;

				return (new hope.OperationQueue(options)).execute();
			} else {
				options = (typeof options == "string" ? {url:options} : options||{});
				if (onLoaded) options.onLoaded = onLoaded;
				if (onLoadError) options.onLoadError = onLoadError;

				return (new (this.loader)(options)).execute();
			}
		}
	},
	
	/** Create a custom loader for the Loadable thing. 
		If an operation named <classType>Loader is already defined, we'll use that.
		Otherwise we'll create one.
	*/
	onMixin : function(it) {
		var loaderName = it.classType + "Loader", operation;
		try {
			operation = hope.getThing(loaderName);	// will throw if not found
		} catch (e) {
			// create an operation if not already defined
			operation = new hope.Loader.subclass({ name : loaderName });
		}
		// assign to the element (and its prototype, if applicable)
		it.loader = operation;
	}
});
