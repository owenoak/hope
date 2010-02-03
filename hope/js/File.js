

/** Generic 'operation' class. 

	TODO: 	
			- loading and error message handling
			- progress handling
			- don't use jQuery's infrastructure
*/
new hope.Class({
	name : "Operation",
	prototype : {
		name : undefined, 		// name of the operation
		
		url : undefined,
		state : hope.UNLOADED,	
		status : undefined,			// http status
		method : "GET",				// GET, POST, PUT, DELETE
		cacheResults : false,
//		timeout : undefined,		// timeout in milliseconds
		
		message : undefined,		// message to show while executing, 
									//	will be expanded with input if there is one
		errorMessage : undefined,	// generic error message to show, will be expand()ed with the input
		
		inputType : hope.NONE,
		input : undefined,
		inputTransformer : undefined,	// function or string which will be expanded() with input
		
		outputType : 'text',
		outputTransformer : undefined,	// function to transform the output, as transformer(data, outputType)
		output : undefined,

		callbackTarget : undefined,		// object we direct callbacks to
		callbackName : "onDone",		// name of callback events (eg: onDone)
		errbackName : "onError",		// name of error events (eg: onError)
		
		onCompleted : undefined,		// event called when all done, whether finished successfully or not

//		onProgress : undefined,		

		request : undefined,		// last request XmlHttpRequest object
		requestOptions : undefined,	// last jQuery ajax options

		execute : function(options) {
			if (options) this.set(options);

			if (this.message) hope.showMessage(this.message);

			this.state = hope.LOADING;
			var request = this.request = new XMLHttpRequest(), operation = this;
			url = hope.url(this.url).href;
			if (this.cacheResults != true) {
				url += (url.indexOf("?") > -1 ? "&" : "?") + "_" + (new Date()).getTime();
			}
			this.lastUrl = url;
			request.open(this.method, url, hope.ASYNC);
			
			request.onreadystatechange = 
					(    this.requestHandler 
				  	  || (this.requestHandler = hope.bind(this._requestHandler, this))
				  	);

// TODO: manage inputs here...
//			var input = (this.input ? this.processInput(this.input, this.inputType) : null);
//			if (this.input != null) this.processInput(options);
			var input = null;
			request.send(input);
		},


		/** Raw http onload handler, bound to operation in execute. */
		_requestHandler : function() {
			var request = this.request, error;
			if (request.readyState != 4) return;

			this.status = request.status;
			this.state = hope.LOADED;
			if (request.status >= 200 && request.status < 300) {
				try {
					this.output = this.processOutput(request, this.outputType);
					// call the callback on the callbackTarget
					var target = this.callbackTarget || this;
					target.notify(this.callbackName, this.output, this.name, target);
					// call our onCompleted handler
					this.notify("onCompleted", this.output, this.name, this);
					return;
				} catch (e) {
					error = e;
				}
			}

			// if we get to here, there was an error
			if (!error) error = "Error loading "+this.lastUrl;
			this.state = hope.LOAD_ERROR;
			hope.error(error);
			if (this.errorMessage) {
				var message = this.errorMessage.expand(error);
				hope.flashErrorMessage(message);
			}
			try {
				var target = this.callbackTarget || this;
				target.notify(this.errbackName, error, this.name, target);
			} catch (e) {
				hope.error(e);
			}
			this.notify("onCompleted", this.output, this.name, this);
		},
		
		/** Process the input according to the inputType. 
			Your subclasses are free to completely overwrite this.
		*/
		processInput : function(input, inputType) {
			switch (typeof this.inputTransformer) {
				case "string":		input = this.inputTransformer.expand(input); break;
				case "function":	input = this.inputTransformer(input);		 break;
			}
			return input;
		},
		
		/** Process the request output according to the outputType.
			Your subclasses are free to completely overwrite this. */
		processOutput : function(request, outputType) {
			var text = request.responseText;

			switch (outputType.toLowerCase()) {
				case "xml": 	return request.responseXML;
				case "text": 	return text;

				// xml/js will either return an xml file or an expanded version of the same file in js
				//	depending on whether it was pre-compiled or not.
				case "js/xml":	
				case "xml/js":	
								// HACK: check for an <?xml tag and process as xml if we find one
								if (text.indexOf("<?xml") > -1) {
									return hope.xml.fromString(text);
								}
				case "script":
				case "js":		
				case "json":	if (hope.debugging) {
									hope.execute(text);
								} else {
									$.globalEval(text);
								}
			}
		},

		toString : function() {
			return "["+this.classType+" "+(this.name ? this.name : "for "+this.url) +"]";
		}
	},// end prototype
	
	statics : {
		execute : function(name, options) {
			var operation = this.find(name);
			if (!name) return hope.error("Operation.execute(",name,",",options,"): Couldn't find operation.");
			operation.execute(options);
		}
	}
});


/** OperationQueue -- execute a bunch of self-sufficinet operation instances, one after the other,
	and execute a callback when they are all done.
	
	Note that we currently take over the operations' onCompleted callback to go on to the next operation.
	
	TODO: onError semantics?
*/
hope.Class.subclass(
{
	name : "OperationQueue",
	prototype : {
		operations : null,			// array of self-sufficient operations
		results : null,				// array of results of each operation
		onDone : undefined,			// called when all operations complete
		
		execute : function() {
			var operations = this.operations, queue = this;
			if (!operations || operations.length == 0) return;

			// duplicate the operations queue so we can munge its
			operations = operations.slice();
			
			var results = this.results = [];
			function executeNext(result) {
				if (!operations) return;
				if (result != null) results.push(result);
				var operation = operations.shift();
				if (!operation) {
					queue.notify("onDone", results, queue);
					operations = null;
				} else {
					operation.onCompleted = executeNext;
					operation.execute();
				}
			}
			executeNext();
		}
	}
});


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
			if (!this.cache.loader) {
				// create a new loader, setting this as the callbackTarget
				var options = this.loadOptions || {};
				options.callbackTarget = this;
				this.cache.loader = new (this.constructor.loader)(options);
			}
			return this.cache.loader;
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

// TODO: saveable/etc as necessary


/** Generic file loader. */
new hope.Class({
	name : "File",
	caches : true,
	mixins : "Loadable",
	prototype : {
		
	}
});


/** ScriptLoader */


/** Script -- JS file that can be loaded.  
	You can use hope.ScriptLoader as a top-level class as well.
*/
new hope.File.subclass({
	name 	: "Script",
	statics : {
		loader : new hope.Loader.subclass({
			name : "ScriptLoader",
			prototype : {
				// we load as text and process the output ourselves so we can be sure to catch errors
				// TODO: this may be a problem in going from debugging -> production mode!
				cacheResults : hope.debugging === hope.OFF,
				outputType : "script",
			}			
		}),
		fromXML : function(element) {
			var options = hope.xml.attributes(element);
			if (element.firstChild) options.data = hope.xml.childrenToString(element);
			return new hope.Script(options);
		}
	}
});
hope.xml.register("script", hope.Script);




/** XML file which can be loaded.  
	You can use hope.XmlLoader as a top-level class as well.
*/
new hope.File.subclass({
	name 	: "XmlFile",
	statics : {
		loader : new hope.Loader.subclass({
			name : "XmlLoader",
			prototype : {
				// we load as text and process the output ourselves so we can be sure to catch errors
				// TODO: this may be a problem in going from debugging -> production mode!
				cacheResults : hope.debugging === hope.OFF,
				outputType : "xml"
			}
		})
	}
});



/** A Package is a collection of grouped files. 
	All files with group='preload' are loaded automatically.
	Package can have 'onLoaded' handler.
*/
new hope.File.subclass({
	name 	: "Package",
	prototype : {

		// list of Script, Template, Stylesheet, etc objects, segmented by group
		_fileGroup : undefined,
		_files : undefined,

		onCreate : function() {
			this._fileGroup = {};
			this._files = [];
		},
		
		
		/** Set a bunch of files all at once. */
		setFiles : function(files) {
			var i = 0, file;
			while (file = files[i++]) {
				this.setFile(file);
				this._files.push(file);
				if (file.group) {
					var groups = file.group.split(hope.Patterns.splitOnCommas), group, g = 0;
					while (group = groups[g++]) {
						(this._fileGroup[group] || (this._fileGroup[group] = [])).push(file);
					}
				}
			}
			console.dir(this._fileGroup);
		},
		*/
		/* Called as we absorb each file in turn.  
		   Puts the file in the appropriate group(s).
		*/
		setFile : function(file) {
			this._files.push(file);
			if (file.group) {
				var groups = file.group.split(hope.Patterns.splitOnCommas), group, i = 0;
				while (group = groups[i++]) {
					var group = (this._fileGroup[group] || (this._fileGroup[group] = []));
					var list = group
					().push(file);
				}
			}
		},
		setScript : function(file) {	this.setFile(file)	},
		setTemplate : function(file) {	this.setFile(file)	},
		setStylesheet : function(file) {this.setFile(file)	},		

		setEvent : function(event) {
console.warn("setEvent",event,this);
		},
		
		/** The packge itself was loaded, either as XML or JS. */
		onLoaded : function(data) {
			if (hope.isAnElement(data)) {
				hope.xml.toJs(data, null, this);
			} else {
				this.set(data);
			}
			// load all preload files.
			this.loadGroup("preload");
		},
		
		
		// event handlers for a group of files being loaded
		onFilesLoaded : undefined,
		onFilesLoadError : undefined,

		/** Load all files of a particular group which have not been loaded. */
		loadGroup : function(groupName, onLoaded) {
			var files = this._fileGroup[groupName];
			console.warn("loading ",groupName," :",files);
			return this;
		},
		
		loadPreloads : function() {
		
		},
	
		/** Mark all files in a group as already being loaded. */
		markAsLoaded : function(groupName, classType) {
			var files = this._fileGroup[groupName], i = 0, file;
			if (!files) return;
			while (file = files[i++]) {
				if (classType && file.classType != classType) continue;
				file.set("loaded", true);
			}
			return this;
		}
		
	},
	statics : {
		loader : new hope.Loader.subclass({
			name : "PackageLoader",
			prototype : {
				cacheResults : hope.debugging === hope.OFF,
				outputType : "js/xml"
			}
		})
/*		
		,
		
		parseXML : function(element, namespace) {
			var options = hope.xml.attributes(element);
			var scripts = hope.xml.childrenToObjects(element, namespace, "script"),
				stylesheets = hope.xml.childrenToObjects(element, namespace, "stylesheet"),
				templates = hope.xml.childrenToObjects(element, namespace, "templates")
			;
			options.files = [].concat(scripts, stylesheets, templates);
			return options;
		},
		
		fromXML : function(element, namespace) {
			var options = this.parseXML(element, namespace);
			return new hope.Package(options);
		}
*/
	}
});
hope.xml.register("package", hope.Package);


/** Simple event class */
new hope.Class({
	name : "Event",
	prototype : {
		event : undefined,		// name of the event
		part : undefined,		// part of the target
		target : undefined,		// target for the event
		data : undefined,		// data for the event
		
		language : undefined,	// language for the event
		value : undefined		// script of the event, as text
	}
});
hope.xml.register("on", hope.Event);


//window.it = new hope.Package({url:"{{hope}}hope.package"}); it.load()
