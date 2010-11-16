/* Base-line functionality for the {{hope}} system. */

(function(window){// begin hidden from global scope


var hope = (window.hope || (window.hope = {}));



//
//	simple cookie getter/setter/clearer all in one
//

//  Get cookie under @name.
//	Pass @value to set cookie value.  
//		- Pass `@value == ""` or `@value == null` to clear the cookie.
//		- Javascript objects will be converted to/from JSON (this will break with complex objects).
//		- All other values will be converted to string and `escaped()`/`unescaped()` automatically.
//	Pass @expires as Date to set expires for cookie.
//
//	NOTE: ALWAYS sets on root path of the current domain ("/").
var _COOKIE_PATTERNS = {};
function _getRawCookie(name) {
	if (!document.cookie) return;
	var pattern = _COOKIE_PATTERNS[name] || (_COOKIE_PATTERNS[name] = new RegExp(name+"=([^;]*)"));
	var match = document.cookie.match(pattern);
	return (match ? match[1] : undefined);
}
hope.cookie = function(name, value, expires) {
	var currentValue = _getRawCookie(name);

	// getting
	if (arguments.length === 1) {
		if (typeof currentValue === "string") {
			var value = unescape(currentValue);
			if (value.indexOf("{") === 0 && value.indexOf("}") === value.length-1) value = JSON.parse(value);
			return value;
		}
	} 
	// setting/clearing
	else {
		if (value == null) 					value = "";
		else if (typeof value == "object") 	value = JSON.stringify(value);
		else if (typeof value !== "string")	value = ""+value

		// don't change if already the same as what's set now
		if (value === currentValue && !expires) return;
		
		// if clearing, set expires to long time ago
		if (value == "") expires = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		// otherwise convert date to expires string
		else if (expires instanceof Date) expires = "; expires="+expires.toGMTString();

		document.cookie = name + "=" + escape(value) + (expires||"") + "; path=/";
		return hope.cookie(name);
	}
}



//
//	debugging subsystems
//	


// use this to get/set debug flag(s) for different sub systems
hope.debug = function(what, onOrOff) {
	if (hope.debug.TARGETS[what] === undefined) hope.debug.TARGETS[what] = onOrOff||false;

	// if onOrOff not specified, just return the cookie value
	if (arguments.length === 1) return hope.cookie("debug."+what);
	
	// else set the cookie value and return it
	return hope.cookie("debug."+what, onOrOff||null);
}
hope.debug.TARGETS = {};
hope.debug.TIME = {};


hope.debug.unload = hope.debug("unload");

// stub in [Element.prototype|document|window].on(event, handler)
//	this will get replaced in Element-events.js with something smarter
document.on = window.on = function(event, handler, capture) {
	this.addEventListener(event, handler, (capture === true));
}


// Call hope.unload(method) to do something when the page is unloaded.
// NOTE: the unload handlers will be called in reverse order, 
//		 which is generally more predictable.  (eg: instances unloaded before their classes).
hope.unload = function(handler){hope._unloaders.push(handler)};
hope._unloaders = [];

hope.onUnload = function() {
	var t0 = new Date().getTime(), debug = hope.debug.unload;
	if (debug) console.group("starting unloading process");
	var handlers = hope._unloaders, i = handlers.length, handler;
	while (handler = handlers[--i]) {
		try {
			handler();
		} catch (e) {
			console.error(e);
		}
		handlers[i] = null;
	}
	var t1 = new Date().getTime();
	if (debug) {
		console.warn("finished unloading process in "+(t1-t0)+" msec");
		console.groupEnd();
	}
}

window.on("unload", hope.onUnload);







// utility functions brought into scope for speed
var _slice = Array.prototype.slice;
var _concat = Array.prototype.concat;

// Convert arguments from the calling function to a proper Array.
//	@index is array index to start at, defaults to 0.
//
//	Call as:
//		function someFunc(that,has,variable,arguments,etc) {
//			var args = $args();			// array starting at argument # 0
//			var someArgs = $args(2);	// array starting at argument # 2
//		}
window.$args = hope.$args = function $args(index) {
	return _slice.call($args.caller.arguments, index||0);
}



// Manually set the @prototype of an EXISTING @object to some other object.
// @returns @object.
//
// NOTE: won't work in IE!
hope.setProto = function(object, prototype) {
	object.__proto__ = prototype;
	return object;
}

// Apply a single property descriptor or normal @value to some @object.
//
// 	This has a special check for subclases of our Property class, if it finds one:
//		- If the Property has an `.init()` method, we call that to do the hookup.
//		- If not, we uses Object.defineProperty() to hookup.
//	Otherwise we just assign the property value.
//
// TODO: this will NOT pick up getters/setters which have already been applied to an object
//			which means it's NOT good for situations where we're adapting to native objects
//			(such as for List or Tag) by assigning prototype.  ???
//
// TODO: make functions non-enumerable if we can?
hope.extendProperty = function define(object, key, value) {
	if (value instanceof Property) {
		delete object[key];
//DEBUG: this is potentially very slow...
try {
		if (value.init) 	value.init(object, key);
		else 				Object.defineProperty(object, key, value);
} catch (e) {
	debugger;
}
	} else {
		// If a function, make sure it has a `.name` or set it's `._name`
		//	This is so we can do `object.as(Class...)` and get the function name right.
		if (typeof value === "function" && !value.name && !value._name) value._name = key;
		object[key] = value;
	}
}

// Add all enumerable properties of @src to @object.
//	Uses `hope.extendProperty()` to do the actual hookup.
hope.extend = function extend(object, src) {
	if (object && src) for (var key in src) {
		hope.extendProperty(object, key, src[key]);
	}
	return object;
}

// Add all enumerable properties of @src to @object,
//	skipping properties which are already defined on @object.
//	Uses `hope.extendProperty()` to do the actual hookup.
hope.extendIf = function extendIf(object, src) {
	if (object && src) for (var key in src) {
		if (object.hasOwnProperty(key) || object[key] !== undefined) continue;
		hope.extendProperty(object, key, src[key]);
	}
	return object;
}

// Add all properties present in @keys of @src to @object,
//	skipping properties which are already defined on @object.
//	Uses `Object.defineProperty()` to do the actual hookup.
//	This should, in theory, correctly hook up getters and setters defined on src.
//
//	If @keys is not defined, uses all 'own' properties of @src.
hope.extendKeys = function extendKeys(object, src, keys) {
	if (!object || !src) return object;
	// default to all unique properties of src
	if (!keys) keys = Object.keys(src);
	var key, i = -1;
	while (key = keys[++i]) {
		if (object.hasOwnProperty(key) || object[key] !== undefined) continue;
		var descriptor = Object.getOwnPropertyDescriptor(src,key);
		Object.defineProperty(object, key, descriptor);
	}
	return object;
}


// Variant of `hope.extend()` to be assigned to prototypes, 
//	to add ability to extend an instance via `this.extend()`.
//	Same hookup semantics as `hope.extend()`.
hope.extendThis = function(src) {
	if (this && src) for (var key in src) {
		hope.extendProperty(this, key, src[key]);
	}
	return this;
}

// Variant of `hope.extendIf()` to be assigned to prototypes, 
//	to add ability to extend an instance via `this.extendIf()`.
//	Same hookup semantics as `hope.extendIf()`.
hope.extendThisIf = function(src) {
	for (var key in src) {
		if (this.hasOwnProperty(key) || this[key] !== undefined) continue;
		hope.extendProperty(this, key, src[key]);
	}
	return this;
}



//
//	getter/setter hookup
//

// Define a getter on an object.
// If object already has a getter for the property, it will be replaced safely.
// If object already has a setter for the property, it will be preserved.
// If dontOverride is true and object already has a getter, old getter will be preserved.
//
// If you want to add both getter and setter, use `Object.defineProperty()`.
hope.defineGetter = function(object, property, getter, dontOverride) {
	var descriptor = Object.getOwnPropertyDescriptor(object, property), value;
	if (descriptor) {
		if (descriptor.get && dontOverride) return;
		delete descriptor.value;
		delete object[property];
	} else {
		descriptor = new Getter(getter);
	}
	Object.defineProperty(object, property, descriptor);
}


// Define a setter on an object.
// If object already has a setter for the property, it will be replaced safely.
// If object already has a getter for the property, it will be preserved.
// If dontOverride is true and object already has a setter, old setter will be preserved
//
// If you want to add both getter and setter, use `Object.defineProperty()`.
hope.defineSetter = function(object, property, setter, dontOverride) {
	var descriptor = Object.getOwnPropertyDescriptor(object, property), value;
	if (descriptor) {
		if (descriptor.set && dontOverride) return;
		delete descriptor.value;
		delete object[property];
	} else {
		descriptor = new Setter(setter);
	}
	Object.defineProperty(object, property, descriptor);
}


// Return getter defined for object[property], if one is defined.
// NOTE: this does NOT look up the prototype chain!
hope.lookupGetter = function(object, property) {
	var descriptor = Object.getOwnPropertyDescriptor(object, property);
	return (descriptor ? descriptor.get : undefined);
}

// Return setter defined for object[property], if one is defined.
// NOTE: this does NOT look up the prototype chain!
hope.lookupSetter = function(object, property) {
	var descriptor = Object.getOwnPropertyDescriptor(object, property);
	return (descriptor ? descriptor.set : undefined);
}






//
//	getting/setting object values by dotted.paths
//
var _DOTTED_PATH_PATTERN = /^[\w\d_$.]+$/;
hope.get = function get(scope, path) {
	if (arguments.length === 1) {
		path = scope;
		scope = window;
	}
	if (typeof path !== "string") return path;

	if (_DOTTED_PATH_PATTERN.test(path)) {
	 	// if it's a simple property name, just dereference
		if (path.indexOf(".") === -1) {
			return scope[path];
		} else {
			path = path.split(".");
			var key, i = -1;
			while (key = path[++i]) {
				if ((scope = scope[key]) == null) return;
			}
			return scope;
		}
	}
	// otherwise try a scoped eval -- this lets us do complex functions, etc
	else {
		// NOTE: this try() is INCREDIBLY expensive in FF, not bad at all in WebKit
		// NOTE: this uses with(), which is janky.
		try {
			var ____VALUE___;
			eval("with(scope){____VALUE___ = "+path+"}");
			return ____VALUE___;

		} catch (e) {
			return undefined;
		}
	}
};


// Set some arbitrary path inside scope to value
// Adds empty objects along the way as necessary
hope.set = function set(scope, path, value) {
	if (arguments.length === 2) {
		value = path;
		path = scope;
		scope = window;
	}
	if (!scope) return;
	if (!_DOTTED_PATH_PATTERN.test(path)) 
		throw TypeError("Can only set simple paths: '"+path+"'");
	
	// add to our hope.GLOBAL_LIST if assigning to window
	//	this will make sure the reference is cleaned up later
	if (scope === window) {
		var index = hope.GLOBAL_LIST.indexOf(path);
		if (value == null && index !== -1) 		hope.GLOBAL_LIST.splice(index,1);
		else if (value != null && index == -1) 	hope.GLOBAL_LIST.push(path);
	}
	
	path = path.split(".");
	// short circuit for single property
	if (path.length === 1) return scope[path[0]] = value;
	
	// otherwise iterate down property chain
	var i = -1, last = path.length-1, key;
	while (key = path[++i]) {
		if (i === last) return (scope[key] = value);
		if (scope[key] == null) scope[key] = {};
		scope = scope[key];
	}
}


//
//	create/clear a global reference to something
//		do this so the references will be cleaned up when the window is unloaded
//		called automatically when you create a global reference with hope.set
//

// list of NAMES of globals
hope.GLOBAL_LIST = [];
hope.setGlobal = function(name, it) {	return hope.set(window, name, it)		}
hope.clearGlobal = function(name) 	{	return hope.set(window, name, null)		}

// tell all the global things about the unload event
// install this when the document is ready, so it happens late in the unload cycle
hope.unload(function() {
	var debug = hope.debug.unload;
	if (debug) console.group("unloading globals IN REVERSE ORDER");
	var globals = hope.GLOBAL_LIST, i = globals.length, name, global;
	while (name = globals[--i]) {
		var it = hope.get(window, name);
		if (!it) continue;
		if (it.onUnload && !it._unloaded) it.onUnload();
		//LEAK: re-add this
		hope.set(window, name, null);
	}
//LEAK: re-add this
	hope.GLOBAL_LIST = null;		// not really necessary
	if (debug) console.groupEnd();
});


//
//	binding functions by reference
//
// bind by reference (preferably) or by direct binding
//	NOTE: if object is not passed, binds to 'this' when called for extra dynamic-ness
hope.bind = function(method, scope, boundArgs) {
	if (boundArgs && boundArgs.length === 0) boundArgs = null;
	if (typeof method === "function") {
		return function bound() {
			var boundScope = scope || this,
				args = (boundArgs != null ? _concat.apply(boundArgs, arguments) : arguments)
			;
			return method.apply(boundScope, args);
		}
	} else {
		return function bound() {
			var boundScope = scope || this,
				handler = boundScope[method],
				args = (boundArgs != null ? _concat.apply(boundArgs, arguments) : arguments)
			;
			if (typeof handler !== "function") return;
			return handler.apply(boundScope, args);
		}
	}
}

// Return a function which binds a method defined on @scope by @name.
//	You can pass an arbitrary number of arguments.
hope.bindByReference = function(scope, name, arg1, arg2, etc) {
	var boundArgs = (arguments.length > 2 ? _slice.apply(arguments, 2) : null);
	return function bound() {
		var boundScope = scope || this,
			handler = boundScope[method],
			args = (boundArgs != null ? _concat.apply(boundArgs, arguments) : arguments)
		;
		if (typeof handler !== "function") return;
		return method.apply(boundScope, args);
	}
}




// raw preference access via localStorage manipulation
//	use this rather than setting directly to manage not stupidly inserting "null"
//	Maintains a cache of values so we don't hit localStorage so much
//	since that seems expensive.
hope.preference = function preference(key, value) {
	if (arguments.length === 1 || value === undefined) {
		if (!_prefsCache.hasOwnProperty(key)) {
			var value = localStorage[key];
			if (hope.preference.debug) console.info("getting ",key,"from cache",value);
			if (value == null) value = undefined;
			_prefsCache[key] = value
		}
		return _prefsCache[key];
	}
	if (value === _prefsCache[key]) return value;
//TODO: onChange?	
	_prefsCache[key] = value;
	// NOTE: Safari in iOS 3.2 will throw an error if you try to set a value in localStorage
	//	which is already set.  So always delete, then re-set if not null/empty.
	if (hope.preference.debug) console.info("setting preference ",key,"in cache to",value);
	delete localStorage[key];
	if (value != null && value != "") localStorage[key] = value;
	return value;
}
var _prefsCache = {};
hope.preference.debug = hope.debug("preference");

// store a number as a preference (retrieved as a number)
hope.preference.number = function(key, value) {
	value = hope.preference(key,value);
	if (value && typeof value == "string") return parseFloat(value);
	return value;
}

// store a number as a preference (retrieved as a number)
hope.preference.boolean = function(key, value) {
	value = hope.preference(key,value);
	if (value && typeof value == "string") return (value == "true");
	return value;
}

// Get a map of all preferences in localStorage.
//	NOTE: changing something in the map does NOT change the localStorage value
hope.preferenceMap = function preferences() {
	var i = 0, last = localStorage.length, key, map = {};
	for (var i = 0; i < last; i++) {
		key = localStorage.key(i);
		map[key] = localStorage[key];
	}
	return map;
}



})(window);// end hidden from global scope
