

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
			var url = hope.url(this.url, this.cacheResults != true);
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
					target.notify(this.callbackName, this.output, this.name);
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


/** OperationQueue -- execute a bunch of self-sufficient operation instances, one after the other,
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
