/*! Hope application framework, v 0.1					See: http://hopejs.com
 *	MIT license.										See: http://hopejs.com/license
 *	Copyright (c) 2006-2009, Matthew Owen Williams.
 */

var hope = {

	//
	//	constants
	//
	
	/** Flag indicating that a default operation should be skipped. */
	SKIP 		: "__SKIP__",

	/** Flag indicating that we should clear something (eg: a cache). */
	CLEAR 		: "__CLEAR__",

	/** Flag indicating that we should stop processing. */
	STOP 		: "__STOP__",

	/** Flag indicating that an iteration has completed. */
	DONE 		: "__DONE__",
	
	/** Flag for extend() to indicate merge (where subsequent properties do NOT overwrite). */
	OVERWRITE 	: true,
	MERGE 		: false,
	IGNORE		: "__IGNORE__",			// means ignore getters/setters
	CONSTRUCTING: "__CONSTRUCTING__",	// means ignore getters/setters

	/** Debugging flags */
	OFF			: 0,
	ERROR		: 1,
	WARN		: 2,
	INFO		: 3,
	
	/** Special notification to clear completely (eg: clear a cache). */
	
	/** start of with debug at 'error' level */
	debugging	: 1,

	/** Simple shallow merge for one or more property object.
		Modifies the first object and returns it.
		
		Sets up getters  ("get_property") and setters ("set_property") automatically.
		
		Pass hope.MERGE as first argument to NOT have later properties overwrite those of earlier properties.
		Pass hope.IGNORE as first argument to ignore getters and setters, 
			treating them like normal properties.
	*/
	extend : function() {
		var i = 0, overwrite = true, typeOfFirstArg = typeof arguments[0];

		if (typeOfFirstArg !== "object" && typeOfFirstArg !== "function") {
			overwrite = arguments[0];
			i = 1;
		}
		var destination = arguments[i++], _extend = hope._extend, source;
		if (destination == null) return null;
		
		if (overwrite === hope.IGNORE) {
			for (var length = arguments.length; i < length; i++) {
				if (! (source = arguments[i]) ) continue;
				for (var key in source)	destination[key] = source[key];
			}
		} else {
			for (var length = arguments.length; i < length; i++) {
				if (! (source = arguments[i]) ) continue;
				for (var key in source)	_extend(destination, key, source[key], overwrite);
			}
		}
		return destination;
	},
	
	/** Private function to add a property and/or hooking up getters and setters. 
		Returns value iff value was actually written,
		meaning it is different than the old value, not a getter/setter,
		or overwrite is false and destination already had that property.
	*/
	_extend : function(destination, key, value, overwrite) {
		// hook up getters and setters
		var beginning = key.substr(0,4);
		// getter
		if (beginning == "get_" && typeof value === "function") {
			destination.__defineGetter__(key.substr(4), value);
		}
		// setter
		else if (beginning == "set_" && typeof value === "function") {
			if (key == "set_unknown") {
				destination[key] = value;
			} else {
				destination.__defineSetter__(key.substr(4), value);
			}
		}
		// normal property
		else if (destination[key] !== value && (overwrite || destination[key] === undefined)) {
			destination[key] = value;
			return value;
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
	getThing : function(thing, notFoundMessage) {
		if (typeof thing == "string") {
			// look the class up by lower case
			//	so we don't have to worry about case sensitivity
			thing = hope.Things[thing.toLowerCase()];
		}
		// if it is in fact a thing, we're good to go
		if (thing && thing.isAThing) return thing;

		if (notFoundMessage) throw new TypeError(notFoundMessage);
	},
		
	
	/** Register a Thing so you can get it back with hope.get(). */
	registerThing : function(name, thing) {
		// register the thing in the list of Things
		// and simply as hope.<name>
		hope.Things[name.toLowerCase()] = thing;
		hope[name] = thing;
		thing.isAThing = true;
		return this;
	},
	
	
	/** List of well-known regexp patterns.  
		Define in hope.pattern once rather than inline in your methods for speed and re-use.
	 */
	Patterns : { 
		// characters that are not legal in an identifier
		illegalIdentifierCharacters : /[^\w$_]/g,
		runOfSpaces : /\s+/g,
		
		splitOnCommas : /\s*,\s*/,
		splitOnLines : /[\n\r]/
	},


	
	/** Convert an array of function arguments (or anything else with a length property)
		to a proper Array.
		
		@param	args		Set of array arguments.
		@param	[startAt=0]	Index to start copying arguments.
		@param	[prefix]	Array of values to add at START of array (before args)
		@param	[suffix]	Array of values to add at the END of the array.
	 */
	args : function args(args, startAt, prefix, suffix) {
		var results = [];
		if (prefix && prefix.length)	results.push.apply(results, prefix);

		if (args && args.length) {
			if (startAt) args = Array.slice(args, startAt);
			results.push.apply(results, args);
		}
		
		if (suffix && suffix.length) 	results.push.apply(results, suffix);
		return results;
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
		if (hope.isListLike(it)) return Array.prototype.slice.call(it, 0);
		return [it];
	},
	
	
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
				var combinedArgs = hope.args(arguments, 0, boundArgs);
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
			var args = Array.prototype.slice.call(arguments, 1);
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
	/
	protoClone : function protoClone(target, properties) {
		function cloner(){};
		cloner.prototype = target;
		var cloned = new cloner();

		// if they passed any arguments, extend the clone with the arguments
		if (arguments.length > 1) {
			target = cloned;
			hope.extend.apply(hope, arguments);
		}
		return cloned;
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
	}

};


/**
	Simple packaging semantics:
	
	- named paths
	- extension -> loader semantics
	- loadScript, loadXML, etc which use named paths
	- load(file) determines
	- don't worry about absolute path nonsense stuff
	- don't worry about dependencies for now
	
*/

/** Map of pathName -> path for named paths. */
hope.Paths = {};

/** 
hope.
