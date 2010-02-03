/*! Hope application framework, v 0.1					See: http://hopejs.com
 *	MIT license.										See: http://hopejs.com/license
 *	Copyright (c) 2006-2009, Matthew Owen Williams.
 */
var global = this;

hope = (function() {	/* Begin hidden from global scope */

var slice = Array.prototype.slice;

var hope = {

	/** reference to the global scope. */
	global : global,

	//
	//	constants
	//

	/** Debugging flags */
	OFF			: 0,
	ERROR		: 1,
	WARN		: 2,
	INFO		: 3,
	
	/** Special notification to clear completely (eg: clear a cache). */
	
	/** start of with debug at 'error' level */
	// TODO: pull debugging from cookie, set cacheScripts accordingly
	debugging	: 1,
	cacheScripts : true,
	
	/** Flag indicating a non-specified value. */
	NONE 		: undefined,

	
	/** Flag indicating that a default operation should be skipped. */
	SKIP 		: "__SKIP__",

	/** Flag indicating that we should clear something (eg: a cache). */
	CLEAR 		: "__CLEAR__",

	/** Flag indicating that we should continue or stop processing. */
	CONTINUE	: "__CONTINUE__",
	STOP 		: "__STOP__",

	/** Synchronous/Asynchronous flags. */
	SYNC		: false,
	ASYNC 		: true,


	/** Flag indicating that an iteration has completed. */
	DONE 		: "__DONE__",
	
	/** Flag indicating we should use relative paths. */
	RELATIVE	: "__RELATIVE__",
	
	/** Flag for extend() to indicate merge (where subsequent properties do NOT overwrite). */
	OVERWRITE 	: "OVERWRITE",
	MERGE 		: "MERGE",

	/** Loaded flags. */
	UNLOADED 	: "UNLOADED",
	LOADING 	: "LOADING",
	LOADED 		: "LOADED",
	LOAD_ERROR	: "ERROR",
	
	
	/** List of well-known regexp patterns.  
		Define in hope.pattern once rather than inline in your methods for speed and re-use.
	 */
	Patterns : { 
		// characters that are not legal in an identifier
		illegalIdentifierCharacters : /[^\w$_]/g,
		runOfSpaces : /\s+/g,
		isAllSpaces : /^\s+$/,
		
		splitOnCommas : /\s*,\s*/,
		splitOnLines : /[\n\r]/,
		
		urlParser : /(((?:(\w*:)\/\/)(([^\/:]*):?([^\/]*))?)?([^?]*\/)?)(([^?#.]*)(\.[^?#]*)|[^?#]*)(\?[^#]*)?(#.*)?/,
		mustacheMatcher : /\{\{(.*)\}\}/,
		
	},


	/** Walk down a 'path' of dotted.properties from a context object
		and return what you find.  Handles function calls as well (in an eval).
		NOTE: does not handle function calls with periods in their arguments!
	*/
	get : function(path, context, stopAtParent) {
		if (context == null) context = hope.global;
		path = path.split(".");
		var step, i = 0, last = (stopAtParent ? path.length - 1 : path.length), index;
		while (i < last) {
			step = path[i++];

			// if there are parenthesis, try an eval
			if (step.indexOf("(") > -1) {
				try {
					context = eval("context."+step);
				} catch (e) {
					hope.error("Error evaluating ",path.join("."),e);
					return;
				}
			}
			// try to find as a string
			else if (context[step] != null) {
				context = context[step];
			} 
			// try to find as a number
			else {
				index = parseInt(step);
				if (""+index === step && context[index] != null) {
					context = context[step];		
				} else {
					return;
				}
			}
		}
		return context;
	},
	
	/** Given a string and a context, expand any 'mustaches' in the string, eg: '{{a.b.c}}' */
	expand : function(string, context) {
		if (!string || typeof string != "string") return "";
		if (!context) context = hope.global;
		
		var match, pattern = hope.Patterns.mustacheMatcher, replacement;
		while (match = string.match(pattern)) {
			replacement = hope.get(match[1], context);
			if (replacement == null) replacement = "";
			string = string.replace(match[0], ""+replacement);
		}
		return string;
	},

	/** Do an eval, trapping any errors.  
		If there is a JS error in the code, you will see a console warning.
		The context string will be output as well, if provided.
	*/
	execute : function(script, context) {
		try {
			return eval(script);
		} catch (error) {
			console.group(context || "Error evaluating script:");
			console.error(error);
console.dir(error);
//			console.group("Offending script:");
//			console.debug(script);
//			console.groupEnd();
			console.groupEnd();
			throw error;
			return error;
		}
	},



	/** Add all properties from one or more objects to the first object.
		Very quick, does not getter/setter checking -- if you want that, use 'hope.mixin()'.
		Returns the modified first object.
	*/
	extend : function(destination, source) {
		if (!destination) return null;
		var i = 0, length = arguments.length, key;
		while (++i < length) {
			if (source = arguments[i]) {
				for (key in source) destination[key] = source[key];
			}
		}
		return destination;
	},


	/** Add all properties from one or more objects to the first object.
		This variant ONLY adds if destination[key] === undefined.
		Very quick, does not getter/setter checking -- if you want that, use 'hope.mixin()'.
		Returns the modified first object.
	*/
	merge : function(destination, source) {
		if (!destination) return null;
		var i = 0, length = arguments.length, key;
		while (++i < length) {
			if (source = arguments[i]) {
				for (key in source) {
					if (destination[key] === undefined) destination[key] = source[key];
				}
			}
		}
		return destination;
	},


	/** Simple shallow merge for one or more property object.
		Modifies the first object and returns it.
		
		Sets up getters ("get_property") and setters ("set_property") automatically.
		
		Pass hope.MERGE as first argument to NOT have later properties overwrite those of earlier properties.
		Pass hope.IGNORE as first argument to ignore getters and setters, 
			treating them like normal properties.
		
		TODO: pass 'DEEP' to do a deep copy?
	*/
	mixin : function() {
		var i = 0, 
			overwrite = true,
			length = arguments.length, 
			key, beginning
		;
		// if first argument is a string, that's the overwrite mode
		if (typeof arguments[0] == "string") {
			overwrite = (arguments[0] == hope.MERGE);
			i = 1;
		}
		var destination = arguments[i], source;
		if (destination == null) return null;
		
		while (++i < length) {
			if ((source = arguments[i]) == null) continue;
			for (key in source) {
				value = source[key];

				// check for getters/setters
				beginning = key.substr(0,4);
				// getter?
				if (beginning == "get_" && typeof value === "function") {
					destination.__defineGetter__(key.substr(4), value);
					continue;
				}
	
				// setter?
				if (beginning == "set_" && typeof value === "function") {
					if (key == "set_unknown") {
						destination[key] = value;
					} else {
						destination.__defineSetter__(key.substr(4), value);
					}
					continue;
				}
				// normal property
				if (destination[key] !== value && (overwrite || destination[key] === undefined)) {
					destination[key] = value;
				}
			}
		}
		return destination;
	},


	//
	//	Things = Classes, Mixins and Types
	//

	/** Map of {type->Thing} for *all* Classes, Mixins, or Types  we have created.
		Classes are added by name during class creation in lower case form.
		Use hope.getThing() to find by name or reference.
	 */
	Things : {
		toString : function(){return "hope.Things"}
	},

	/** Return a pointer to a named Class, Mixin or Type.
		If you pass a Thing, it will simply be returned.
	*/
	getThing : function(thing, throwError) {
		if (typeof thing == "string") {
			// look the class up by lower case
			//	so we don't have to worry about case sensitivity
			var it = hope.Things[thing.toLowerCase()];
			if (it) return it;
		}
		// if it is in fact a thing, we're good to go
		if (thing && thing.isAThing) return thing;
		if (throwError !== hope.SKIP) throw new TypeError("Can't find thing "+thing);
	},
		
	
	/** Register a Thing so you can get it back with hope.get(). */
	registerThing : function(name, thing) {
		// register the thing in the list of Things
		// and simply as hope.<name>
		hope.Things[name.toLowerCase()] = thing;
		hope[name] = thing;
		hope.global[name] = thing;	// for debugging.... or is it?
		thing.isAThing = true;
		return this;
	},
	


	/** 
		HTML helpers
	*/

	/** Co-opt the native (document||element).querySelector and .querySelectorAll */
	/** Select the first item that matches a css selector. */
	select : function(selector, context) {
		if (context == null) context = document;
		return context.querySelector(selector);
	},
	
	/** Return all items that match a css selector. */
	selectAll : function(selector, context) {
		if (context == null) context = document;
		var array = context.querySelectorAll(selector);
		return slice.call(array);
		// TODO: convert to a hope.ElementList ?
//		return (hope.ElementList ? new hope.ElementList(array) : array);
	},
	
	
	/** Add/remove/toggle a class from an element. Using jQuery for now. */
	addClassTo : function(element, className) {
		if (element) {
			var classes = element.className.split(hope.Patterns.runOfSpaces);
			if (classes.indexOf(className) != -1) return;
			classes.push(className);
			element.className = className.join(" ");
		}
	},
	
	removeClassFrom : function(element, className) {
		if (element) {
			var classes = element.className.split(hope.Patterns.runOfSpaces);
			var index = classes.indexOf(className);
			if (index == -1) return;
			classes.splice(index, 1);
			element.className = className.join(" ");
		}
	},

	toggleClassOf : function(element, className, condition) {
		return (condition ? hope.addClassTo : hope.removeClassFrom)(element, className);
	},
	
	/** Add/remove a 'Hidden' class on an element, which will show/hide it. 
		We'll use CSS animations in the Hidden class to animate.
	*/
	show  : function(element) {
		hope.removeClass(element, "Hidden");
	},
	hide : function(element) {
		hope.addClass(element, "Hidden");
	},
	
	/** Convert arguments from the calling function to a proper Array.
		
		@param	[startAt=0]	Index to start copying arguments.
		@param	[prefix]	Array of values to add at START of array (before args)
		@param	[suffix]	Array of values to add at the END of the array.
	 */
	args : function getargs(startAt, prefix, suffix) {
		var args = slice.call(getargs.caller.arguments, startAt||0);
		if (prefix && prefix.length)	args.push.apply(args, prefix);
		if (suffix && suffix.length) 	args.push.apply(args, suffix);
		return args;
	},
	
	/** Is the thing like an array? */
	isListLike : function(it) {
		return (it instanceof Array) || (it.length !== undefined && typeof it != "string");
	},
	
	
	/** Given something that may or may not be list like,
		convert it to a proper array.
	*/
	toArray : function(it) {
		if (it instanceof Array) return it;
		if (hope.isListLike(it)) return slice.call(it, 0);
		return [it];
	},
	
	
	// TODO: move the following 3 into hope.functions ?
	
	/** Bind a function to some object, so when the returned function is called, `this` will be `target`.
		@param	method		Method to bind or name of method on context to bind.
		@param	target		Object to bind the method to.
		@param	[boundArgs]	Optional arguments array to pass to bound function.
		@returns			Bound function.
	 */
	bind : function bind(method, target, boundArgs) {
		if (typeof method == "string") {
			if (typeof target[method] == "function") method = target[method];
		}
		if (typeof method != "function") throw TypeError("Method '"+method+"' is not defined");
		
		return function boundMethod() {
			if (boundArgs) {
				var combinedArgs = hope.args(0, boundArgs);
			} else{
				var combinedArgs = arguments;
			}
			return method.apply(target, combinedArgs);
		}
	},
	
	/** Given a function, return another function which will that function to its first argument,
		passing any additional arguments as normal.
	*/
	makeApplier : function(method) {
		return function(thing) {
			if (!thing) return undefined;
			var args = slice.call(arguments, 1);
			return method.apply(thing, args);
		}
	},

	/** Make appliers for an object of key-value pairs, returning a new object. */
	makeAppliers : function(source) {
		var output = {};
		for (var key in source) {
			output[source] = hope.makeApplier(source[key]);
		}
		return output;
	},
	
	/** Make a prototype-based clone of the target object. 
		@param target		Target object to clone.
		@param [properties]	Object of properties to add to the clone.
	*/
	protoClone : function protoClone(target, properties) {
		function cloner(){};
		cloner.prototype = target;
		var clone = new cloner();

		// if they passed any arguments, extend the clone with the arguments
		if (properties) hope.extend(clone, properties);
		return clone;
	},
	
	
	/** Return a new object with all keys of properties which are different than target.
		If all properties are identical, returns null.
	 /
	deltas : function deltas(target, properties) {
		var deltas = {}, deltaFound = false;
		for (var key in properties) {
			if (properties[key] != target[key]) {
				deltas[key] = properties[key];
				deltaFound = true;
			}
		}
		return (deltaFound ? deltas : null);
	},
	*/
	
	/** Formatters */
	format : {
		string : {
			/** Convert a string to a legal identifier.  */
			asIdentifier : function(string, camelCase) {
				if (camelCase) {
					id = hope.format.string.asCamelCase(string);
				} else {
					var id = (""+string).replace(hope.Patterns.illegalIdentifierCharacters, "_");
				}
				// make sure the id does not start with a number
				if (id.match(hope.Patterns.startsWithDigit)) id = "_"+id;
				return id;
			},
			
			
			/** converts "any old string" or "any_old_string" to "AnyOldString" */
			asInitialCaps : function(string, _startIndex) {
				if (_startIndex == null) _startIndex = 0;
				string = ""+string;
				var split = string.split(hope.Patterns.illegalIdentifierCharacters);
				if (_startIndex == 1 && split.length > 1) split[0] = split[0].toLowerCase();
				for (var i = _startIndex, it; it = split[i]; i++) {
					split[i] = it.charAt(0).toUpperCase() + it.substr(1);
				}
				return split.join("");
			},
			
			/** converts "ANY old string" or "any_old_string" to "anyOldString" */
			asCamelCase : function(string) {
				return hope.format.string.asInitialCaps(string, 1);
			}
		}
	},
	
	
	/** Simple debugging -- log an info, warning or error. */

	/** Log an info message if hope.debugging >= hope.info */
	info : function() {
		if (hope.debugging >= hope.INFO) console.info.apply(console, arguments);
	},
	warn : function() {
		if (hope.debugging >= hope.WARN) console.warn.apply(console, arguments);
	},
	error : function() {
		if (hope.debugging >= hope.ERROR) console.error.apply(console, arguments);
	},
	
	
	/** 
		Modal message/error display (main UI is somehow 'disabled' while this is happening) 
	*/
	/** Show a normal (non-error) modal message. */
	modalMessageSelector : "#ModalMessage",
	modalMessageBodySelector : "#ModalMessageBody",
	showMessage : function(message, asError) {
		asError = (asError == hope.ERROR);
		var element = hope.select(hope.modalMessageSelector);
		if (element) {
			hope.toggleClassOf(element, "Error", asError);
			var body = hope.select(hope.modalMessageBodySelector, element) || element;
			body.innerHTML = message;
			hope.show(element);
		} else {
			if (asError) {
				console.warn("hope.showErrorMessage() says: ",message);
			} else {
				console.warn("hope.showMessage() says: ",message);
			}
		}
	},
	
	/** Show a modal 'error' message.	*/
	showErrorMessage : function(message) {
		hope.showMessage(message, hope.ERROR);
	},
	
	/** Clear the current modal message. */
	clearMessage : function() {
		var element = hope.select(hope.modalMessageSelector);
		if (element) hope.hide(element);
	},
	
	
	/**
		Non-modal growl-style message/error display.  Shows for a few seconds, then goes away.
	*/
	flashMessageSelector : "#FlashMessage",		// NOTE: we assume it starts out with class='Hidden' which is hiding it
	flashMessageBodySelector : "#FlashMessageBody",
	flashMessageDuration : 3,	// duration in SECONDS
	flashMessage : function(message, duration, asError) {
		asError = (asError == hope.ERROR);
		var element = hope.select(hope.flashMessageSelector);
		if (element) {
			hope.toggleClassOf(element, "Error", asError);
			var body = hope.select(hope.flashMessageBodySelector, element) || element;
			body.innerHTML = message;
			hope.show(element);
			setTimeout(function() {
						hope.hide(element);
						}, (duration || hope.flashMessageDuration) * 1000);
		} else {
			if (asError) {
				console.warn("hope.flashMessage() says: ",message);
			} else {
				console.warn("hope.flashErrorMessage() says: ",message);
			}
		}
	},
	flashErrorMessage : function(message, duration) {
		hope.flashMessage(message, duration, hope.ERROR);
	},
	
	
	isAnElement : function(it) {
		return (it != null && it.parentNode != null);
	},
	
	// xml/html manipulation utilities
	xml : {

		/** Native browser objects to parse/serialize XML.
			Work in Gecko/Webkit, probably not elsewhere.
		*/
		_parser  	: new DOMParser(),
		_serializer : new XMLSerializer(),

		/** Given an html/xml element, return an object with all of the attributes of the element. 
			Returns null if element has no attributes.
		*/
		attributes : function(element) {
			if (!element || !element.hasAttributes()) return;
			var output = {}, i = 0, attribute;
			while (attribute = element.attributes[i++]) {
				output[attribute.name] = attribute.value;
			}
			return output;		
		},
		
		/** Given a string of XML, return an XML element (NOT document). */
		fromString : function(string, mimeType) {
			var doc = hope.xml._parser.parseFromString(string, mimeType || "text/xml");
			if (	doc.documentElement.nodeName == "parsererror"		// gecko
				||  doc.documentElement.querySelector("parsererror"))	// webkit
			{
				hope.error("Couldn't parse xml string:\n",doc.documentElement.firstChild.textContent);
			} else {
				return doc.firstChild;
			}
		},
		
		/** Given an XML/HTML element, convert it to a string */
		toString : function(element) {
			return hope.xml._serializer.serializeToString(element);
		},

		/** Given an XML/HTML element, convert it to a string */
		childrenToString : function(element) {
			var results = [], child, i=-1;
			while ( (child = element.childNodes[++i]) != null) {
				results[i] = hope.xml._serializer.serializeToString(child);
			}
			return results.join("\n");
		},


		/** Given an xml/html element, try to parse it according to known tag names.
			Default is to just create an anonymous object.
		*/
		// TODO: introduce namespaces
		Parsers : {
			hope : {}
		},
		register : function(tagName, callback, namespace) {
			if (namespace == null) namespace = "hope";
			if (!this.Parsers[namespace]) this.Parsers[namespace] = {}; 
			this.Parsers[namespace][tagName.toLowerCase()] = callback;
		},

		/** Convert an html/xml node (and all children if any) to JS object(s).
			- Element nodes will be converted to JS objects
				- object will have all element attributes as strings (courtesy of attributesOf())
				- object.__type == tag name of the element
				- object.children == hope.toObjects(element.childNodes)
			- Document nodes will call recursively on their first child
			- text/CDATA nodes will be returned as a string
			- comment and other types of nodes will return undefined
		*/
		toJs : function(node, namespace, object) {
			if (!node) return;
//console.warn(1,node);
			// note: order is based on expected frequency
			switch (node.nodeType) {
				// handle text nodes
				case Node.TEXT_NODE:
					return node.textContent;

				// handle element nodes
				case Node.ELEMENT_NODE:

// TODO: handle hooking "onXXX" things up as Events
/*
					// parse according to the namespace
					if (namespace !== "object") {
						var tagName = node.tagName.toLowerCase(),
							parser =   this.Parsers[namespace||"hope"][tagName]
									|| this.Parsers.hope[tagName]		// try in hope namespace
						;
						if (parser) {
							if (parser.fromXML) 	return parser.fromXML(node, namespace);
							else					return parser(node, namespace);
						}
					}
*/
					if (namespace != "object") {
						var tagName = node.tagName.toLowerCase(),
							constructor =   this.Parsers[namespace||"hope"][tagName]
										 || this.Parsers.hope[tagName]	// default to hope namespace
						;
//console.info(2,tagName);
						if (constructor) {
//console.warn(3,constructor.classType);
							if (constructor.parseXML) {
								return constructor.parseXML(element, namespace, object);
							} else {
								// create a new instance of the constructor
								var options = this.attributes(node);
								if (!object) {
									object = new constructor(options);
								} else {
									if (object.set) object.set(options);
									else			hope.mixin(object, options);
								}
								
								if (node.childNodes.length) {
									var i = 0, child, childObject, value = "";
									while (child = node.childNodes[i++]) {
										childObject = this.toJs(child);
										if (childObject == null) continue;
										if (typeof childObject == "string") {
											value += childObject;
										} else {
											var property = childObject.classType || child.tagName;
											if (object.set) object.set(property, childObject);
											else			object[property] = childObject;
										}
									}
									if (value != "") object.set("value", value);
								}
								return object;
							}
						}
					}

					// if we get here, parse as an anonymous object
					return this.toObject(node, namespace);

				case Node.CDATA_SECTION_NODE:
					return node.textContent;

				// for documents, return their first child
				case Node.DOCUMENT_NODE:
					return this.toJs(node.firstChild, namespace);
			}
		},

		/** Convert an element to an anonymous JS object. 
			Children will be converted via childrenToObjects, which uses toJs.
		*/
		toObject : function(element, namespace){
			var object = this.attributes(element) || {};
			object.__type = element.tagName;
			if (element.hasChildNodes()) {
				var children = this.childrenToObjects(element, namespace);
				if (children) object.children = children;
			}
			return object;
		},

		/** Given an html/xml element root, return all children as an array of JS objects. 
			- element nodes will be converted via hope.toObject()
			- comment nodes will be ignored
			- text nodes will be returned as strings
			- adjacent text nodes (including those split by comments) will be merged
			- whitespace between elements is ignored
			
		*/
		childrenToObjects : function(root, namespace, selector) {
			var elements = (selector ? hope.selectAll(selector, root) : root.childNodes);
			if (!elements.length) return null;
			var results = [], 
				element, result, 
				i = 0,
				count = 0,
				allSpaces = hope.Patterns.isAllSpaces,
				previous
			;
			while (element = elements[i++]) {
				var result = hope.xml.toJs(element);
				if (result == null) continue;
				// process strings
				if (typeof result === "string") {
					// convert all-whitespace runs to a single space
					if (allSpaces.test(result)) {
						// skip leading or trailing whitespace
						if (count == 0 || i == elements.length) continue;
						result = " ";
					}
					// if previous was a string, add the string to that
					if (typeof previous === "string") {
						previous = (results[count-1] = previous + result);
						continue;
					}
				}
	
				// if previous is all-whitespace, overwrite it
				if (allSpaces.test(previous)) {
					count--;
				}
				// otherwise add the next result
				previous = results[count++] = result;
			}
			
			return (results.length ? results : null);
		}
	}	// end xml
};


/** Make all strings expandable. */
String.prototype.expand = function(context) {
	return hope.expand(this, context);
}



//
//	url munging
//

// 	Given a url (and optional name of a base dir), 
//	return a hope.Url object that represents the absolute url referenced.
//
//	Use this routine rather than creating hope.Urls directly because we share urls
//		that are the same.
//	TODO: better dox
hope.url = function(url, baseDir) {
	if (url instanceof hope.Url) return url;
	return new hope.Url(url, baseDir);
}


/**
	Url breaks a URL up into pieces (much like window.location).
	Note that urls are cached, so creating them should be relatively efficient.
	
	@param {String} url URL to convert into a location object.

	@example For the url:		http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash

		url.href			=	http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash
		url.fullpath		=	http://www.server.com:81/path/to/a/
		url.prefix			=	http://www.server.com:81
		url.protocol		=	http:
		url.host			=	www.server.com:81
		url.hostname		=	www.server.com
		url.port			=	81
		url.pathname		=	/path/to/a/file.xml
		url.path			=	/path/to/a/
		url.file			=	file.xml
		url.filename		=	file
		url.extension		=	.xml
		url.search			=	?p1=v1&amp;p2=v2
		url.hash			=	#hash
		url.parameters		=	{p1:"v1", p2:"v2"}

*/
function Url(url, baseDir) {
	if (typeof url !== "string") {
		if (url && ((typeof url.url === "string") || url.url instanceof hope.Url)) {
			url = url.url;
		} else {
			return hope.error("hope.Url must be initialized with a string: "+url);
		}
	}
	var name = (baseDir && url.indexOf("{{") == 0 ? baseDir + url : url);
	if (Url.Cache[name]) return Url.Cache[name];
	if (url instanceof hope.Url) return url;

	// normalize and get from the cache if present
	var absoluteUrl = Url.absolutize(url, baseDir);
	if (Url.Cache[absoluteUrl]) return Url.Cache[absoluteUrl];
	
	// match against our regular expression
	this.match = hope.Patterns.urlParser.exec(absoluteUrl);
	if (!this.match) throw hope.error("Url not understood: "+url);
	
	// remember both under the absolute URL and the original one passed in
	Url.Cache[absoluteUrl] = Url.Cache[name] = this;
}
hope.registerThing("Url", Url);

/** Static methods for the Url class. */
hope.extend(Url, {
	// methods to get the various pieces of the url.
	prototype : {
		aliases : "",
		get href()		{ return this.match[0] },
		get fullpath()	{ return "" + this.prefix + this.path },
		get prefix()	{ return this.match[2] || "" },
		get protocol()	{ return this.match[3] || "" },
		get host()		{ return this.match[4] || "" },
		get hostname()	{ return this.match[5] || "" },
		get port()		{ return this.match[6] || "" },
		get pathname()	{ return "" + this.path + this.file},
		get path()		{ return this.match[7] || "" },
		get file()		{ return this.match[8] || "" },
		get filename()	{ return this.match[9] || "" },
		get extension()	{ return this.match[10] || "" },
		get search()	{ return this.match[11] || "" },
		get hash()		{ return this.match[12] || "" },
		get parameters(){
			if (!this.search) return undefined;
			if (this._params) return this._params;
			var params = this._params = {};
			this.search.split("&").forEach(
				function(it){
					it=it.split("=");
					params[it[0]]=it[1]
				}
			)
			return params;
		},
		toString : function(){	return this.href	}
	},

	/** Named paths we can load.  Specify in a url as   "{{namedPath}}file.html" */
	NamedPaths : {
		document 	: undefined,	/** Path to the document. */
		app			: undefined,	/** Path to this 'app' -- assumed to be the same as the document. */
		hopejs		: undefined,	/** Path where the hope javascript files come from. */
		hope		: undefined,	/** The master 'hope' directory (holds js, css, images, etc). */
		lib			: undefined		/** where external libraries come from -- peer of "hope". */
	},
	
	/** Set up some named base paths. */
	initNamedPaths : function() {
		var docLocation = new Url(window.location.href).fullpath;
		this.addNamedPath("document", docLocation);
		this.addNamedPath("app", docLocation);

		// the last script we can find in the document is OUR script
		var scripts = hope.selectAll("script"), 
			hopeScript = hope.hopeScript = scripts[scripts.length-1],
			hopeScriptUrl = new Url(hopeScript.getAttribute("src")).fullpath
		;
		this.addNamedPath("hopejs", hopeScriptUrl);
		this.addNamedPath("hope", new Url(hopeScriptUrl + "../").fullpath);
		this.addNamedPath("lib", new Url(hopeScriptUrl + "../lib/").fullpath);
		

		/** Flag to ignore absolute path conversion. */
		this.addNamedPath(hope.RELATIVE, "");

		//console.dir(paths);
	},
	
	addNamedPath : function(name, path) {
		hope.Url.NamedPaths[name] = path;
	},
	

	Cache : {},

	/** Convert a special characters in URL paths.
		Converts `.`, `..`, and `//`.
		Converts named paths {{foo}}.
		Yields an absolute URL, either starting with "http" or "/".
		@param {String} url URL to convert.
		@param {String} [baseDir] Name of base directory for relative urls.
		@returns {String} URL with special characters converted.
	*/
	absolutize : function(url, baseDir) {
		// first expand any named paths in the url
		url = hope.expand(url, Url.NamedPaths);
		
		// if the url doesn't start with "http", "file" or "/", it's a relative path
		// 	pre-pend the baseDir
		var start = url.substr(0,4);
		if (start != "http" && start != "file" && url.charAt(0) != "/") {
			url = (Url.NamedPaths[baseDir||"document"]||baseDir) + url;
		}
		// convert any "//", "/./" and/or "/../" entries in the url
		url = url.replace(/\/\.\/(\.\/)*/g,"/").replace(/([^:])\/\/+/g, "$1/");
		url = url.split("/");
		for (var i = 0; i < url.length; ) {
			if (url[i] == "..") 	url.splice(--i, 2);
			else					i++;
		}
		return url.join("/");
	}
});
Url.initNamedPaths();




/** Hack in a loader for the 'hope' package, 
	which creates the concepts of classes and such.
	The hope package will be initialized as a package later.
*/
console.time("load hope package");
// TODO: how can inlining avoid this?
var request = new XMLHttpRequest(), 
	pkgUrl = hope.url("{{hope}}hope.package").href,
	pkgXML,
	url
;

function bootstrapPackage() {
	request.open("GET",  pkgUrl + "?_"+ (new Date()).getTime(), hope.ASYNC);
	request.onload = packageLoaded;
	request.send();
}

function packageLoaded() {
	pkgXML = hope.xml.fromString(request.responseText);
	var	dir = hope.url(pkgXML.getAttribute("base")).href,
		scripts = hope.selectAll("script[group=preload]", pkgXML)
	;
	
	function processScript() {
		try {
			hope.execute(request.responseText, "Error excuting script from :"+url);
			loadNext();
		} catch (e) {	console.error(url, e)	}
	}
	
	function loadNext() {
		try {
			var script = scripts.shift();
			if (!script) return hopeScriptsLoaded();
			url = hope.url(script.getAttribute("src"), dir).href;
			request.open("GET", url, hope.ASYNC);
			request.onload = processScript;
			request.send();
		} catch (e) {	console.error(e)	}
	}
	loadNext();
}
// the hope package has loaded successfully
function hopeScriptsLoaded() {
	// 1) create the hope package as a real Package
	pkgXML.setAttribute("src", pkgUrl);
	hope.hopePackage = hope.xml.toJs(pkgXML, "hope", hope.hopePackage);
	
	// mark the script files as loaded, and load the rest of the preload stuff
	hope.hopePackage.markAsLoaded("preload", "Script");
	hope.hopePackage.loadPreloads();
	
	// 2) grab any code inside the hopeScript and execute it
	var script = hope.hopeScript.textContent;
	if (script) hope.execute(script);
	console.timeEnd("load hope package");
}

bootstrapPackage();



return hope;

/* End hidden from global scope */ })();

