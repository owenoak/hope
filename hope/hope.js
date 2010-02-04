/*! Hope application framework, v 0.1					See: http://hopejs.com
 *	MIT license.										See: http://hopejs.com/license
 *	Copyright (c) 2006-2009, Matthew Owen Williams.
 */
var global = this;

hope = (function() {	/* Begin hidden from global scope */

var slice = Array.prototype.slice;


// figure out if we're in a browser we can support
var UA = ""+navigator.userAgent,
	isFirefox = UA.indexOf("Firefox") > -1,
	isWebKit = UA.indexOf("WebKit") > -1,
	isChrome = UA.indexOf("Chrome") > -1,
	isSupported = (isFirefox || isWebKit || isChrome)
;

// show a very severe message if this browser is not supported
if (isSupported == false) {
	document.open();
	document.write("<div style='font:bold italic 24px Arial;width:70%;border:1px solid #999; margin:10%;padding:5%;'>"
					 + "This browser is not supported.  Please try again with a recent version of "
					 + "<a href='http://getfirefox.com'>Firefox</a>, "
					 + "<a href='http://apple.com/safari/download/'>Safari</a>, or "
					 + "<a href='http://google.com/chrome'>Google Chrome</a>."
				  +"</div>");
	document.close();
}


//
//	simple cookie management
//
//		hope.cookie("key")				<-- returns value for cookie at key
//		hope.cookie("key","value")		<-- sets cookie value at key
//		hope.cookie("key", hope.CLEAR)	<-- clears a cookie
//
//	escapes() cookie values as they go into and out of the cookie.
//  If passed an object, will JSON.stringify/JSON.parse the object.
//
// NOTE: installed as hope.cookie below
function cookie(key, value) {
	if (!document.cookie) return;

	// get
	if (value === undefined) {
		value = (document.cookie || "").match(new RegExp(name+"=([^;]*)"));
		if (!value) return;
		value = unescape(value[1]);
		if (value.charAt(0) === "{" && value.charAt(value.length-1) === "}") {
			value = JSON.parse(value);
		}
		return value;
	} 
	// clear
	else if (value == hope.CLEAR) {
		return document.cookie = name+"=;expires="+(new Date(0)).toGMTString();
	} 
	// set
	else {
		if (typeof value === "object") value = JSON.stringify(value);
		return document.cookie = name+"="+escape(value);
	}
}


var hope = {

	// see above
	cookie : cookie,
	
	//! browser name == "Firefox", "WebKit", "Chrome" or "Unknown"
	browser : {
		name : (isFirefox ? "Firefox" 
			 : (isChrome  ? "Chrome"
			 : (isWebKit  ? "WebKit" 
			 : "Unknown"))),
		isFirefox : isFirefox,
		isWebKit : isWebKit,
		isChrome : isChrome,
		
		// if true, we can append scripts to the HEAD rather than having to XHR/eval them,
		//	 'cause the browser will respect the load order.
		executesScriptsInOrder : isFirefox
	},


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
	debugging	: 1,		// TODO: pull debugging from cookie
	cacheScripts : true,	// TODO: set cacheScripts according to debugging flag
	safeEval : true,		// TODO: set safeEval according to debugging flag
	
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
	
	
	/** Walk down a 'path' of dotted.properties from a context object
		and set the last thing in the path to the value passed in.

		The last thing cannot be a function, but intermediate things can.

		If can't find thing at path, returns.		
	*/
	set : function(path, value, context) {
		var it = hope.get(path, context, true);
		if (!it) return;
		var key = path.substr(path.lastIndexOf(".")+1);
		it[key] = value;
	},
	
	

	//
	//	dynamic script evaluation
	//
	
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
		If there is a JS error in the code, you will see a console error.
	*/
	execute : function(javascript, context, fromUrl) {
		if (!javascript) return;

		// add text that lets firebug know where the script came from
		// TODO: webkit is supposed to understand this as well, but it doesn't seem to work
		javascript += "\n//@ sourceURL=" + (fromUrl || context || " pass url into hope.execute() for more info");

		if (hope.safeEval) {
			try {
				return eval(javascript);
			} catch (error) {
				return hope.exception(error, context, fromUrl);
			}
		} else {
			hope.appendScript(null, javascript, null, true);
		}
	},

	/** Append a script specified by URL to the document head. 
		Note that this will properly execute the code in both FF and Safari, 
		and will show any compilation errors correctly.
		
		However, the order in which they execute is effectively random in Safari,
		depending on completion time, rather than order in which they are appended to head.
		
		In FF, it seems like the execution order IS the same as the load order, but it's hard to be sure.
	*/
	appendScript : function (url, javascript, onLoaded, remove) {
		var head = document.querySelector("head"),
			script = document.createElement("script")
		;
		script.type = "text/javascript";
		if (url) {
			script.setAttribute("src", url);
			if (onLoaded) script.onload = onLoaded;
			head.appendChild(script);
		} else {
			script.appendChild(document.createTextNode(javascript));
			head.insertBefore(script, head.firstChild);
			if (remove) head.removeChild(script);
		}
	},
	
	
	
	//! Load a bunch of script files IN PARALLEL and, when they're all loaded, 
	//	execute them in order and then call a callback.
	loadScripts : function(urls, onLoaded) {
		if (!urls || !urls.length) return onLoaded();

		var completed = 0,
			scriptCount = urls.length
		;
		
		function completelyDone() {
			try {
				onLoaded();
			} catch (e) {
				hope.exception(e, "hope.LoadScripts(): executing onLoaded");
			}
		}

		// if the browser will execute scripts in the order in which they are appended (eg: FF)
		//	just append each URL as a script tag.  This should be quite a bit faster,
		//	and we don't have to eval() the results, which is a big plus.
		if (hope.browser.executesScriptsInOrder) {
			function loadedOne() {
				if (++completed == scriptCount) completelyDone();
			}
			for (var i = 0; i < scriptCount; i++) {
				hope.appendScript(urls[i], null, loadedOne);
			}
		} else {
			var results = [];
			// function to load a single script.
			//	calls loaded() with the request + index when loaded.
			function loadOne(url, index) {
				var request = new XMLHttpRequest();
				request.open("GET", url, hope.ASYNC);
				request.onload = function() {	loadedOne(request, index)	};
				request.onerror = function(){console.error("Couldn't load "+url)};
				request.send();
			}
			
			// function executed when each script finishes loading.
			function loadedOne(request, index) {
				results[index] = request.responseText;
				if (++completed == scriptCount) allLoaded();
			}
			
			// function called when all scripts have finished loading
			//	evaluates the scripts
			function allLoaded() {
				// hope.execute() does its own error handling
				for (var i = 0, script; i < scriptCount; i++) {
					script = results[i];
					hope.execute(script, "hope.loadScripts()", urls[i]);
				}
				completelyDone();
			}
			
			// start each script in turn
			for (var i = 0; i < scriptCount; i++) {
				loadOne(urls[i], i);
			}
		}
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
	
	
	
	//
	//	working with arrays
	//

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
	
	

	//
	//	working with functions
	//

	
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
	
	
	//
	//	Simple debugging -- log an info, warning or error.
	//

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
	
	//! Show as much useful info as we can about an exception.
	//  Returns the error so you can throw it if you want to.
	exception : function(error, context, url) {
		msg = "Exception" + (context ? " in "+context : "")
				+ (error.line != null ? " at line " + error.line : "") 
				+ (url ? " in " + url : "");
		console.group(msg);
		console.error(error);
		console.groupEnd();
		return error;
	},
	

	/** Hack in a loader for scripts of the 'hope' package.
		The hope package will be initialized as a Package when scripts are all loaded.
	*/
	bootstrapHopePackage : function() {
		console.time("load hope package");
		
		var scripts = document.querySelectorAll("script");
		hope.hopeScript = scripts[scripts.length-1];
		
		var hopePath = hope.hopeScript.getAttribute("src");
		hopePath = hopePath.substr(0, hopePath.indexOf("hope.js"));
		
		var pkgUrl = hopePath + "hope.package",
			request
		;
		
		// callback when the package file has loaded
		function packageLoaded() {
// TODO: check the return value -- if it's JS, just append it to the head
			hope.pkgXML = (new DOMParser()).parseFromString(request.responseText, "text/xml").firstChild;
			hope.pkgXML.setAttribute("src",  pkgUrl);
			var scripts = hope.pkgXML.querySelectorAll("script[group=preload]"), script, i = -1, urls = [];
			while(script = scripts[++i]) {
				urls[i] = hopePath + script.getAttribute("src");
			}
			hope.loadScripts(urls, packageScriptsLoaded);
		}
		
		// Callback when all package scripts have finished loading
		function packageScriptsLoaded() {
// TODO: move this into Package.js
			// 1) create the hope package as a real Package
			hope.pkgXML.setAttribute("src", pkgUrl);
			hope.hopePackage = hope.xml.toJs(hope.pkgXML, "hope");
			
			// mark the script files as loaded, and load the rest of the preload stuff
			hope.hopePackage.markAsLoaded("preload", "Script");
			hope.hopePackage.loadPreloads();
			
			// 2) grab any code inside the hopeScript and execute it
			var script = hope.hopeScript.textContent;
			if (script) hope.execute(script);
			console.timeEnd("load hope package");
		}
		
		request = new XMLHttpRequest();
		request.open("GET",  pkgUrl + "?_"+ (new Date()).getTime(), hope.ASYNC);
		request.onload = packageLoaded;
		request.send();
	}
	
};


	
/*** BEGIN BOOTSTRAP LOADER ***/

hope.bootstrapHopePackage();
	
/*** END BOOTSTRAP LOADER ***/


return hope;

/* End hidden from global scope */ })();

