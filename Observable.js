/*** Observation paradigm and constructor.

	You can make any class or instance observable by saying:
		Observable.mixinTo(YourClass);
	  or
		Observable.mixinTo(someInstance);
	
	If you're creating a singleton and you want it to be observable, do:
		var yourSingleton = new Observable({...});

***/

Script.require("{{hope}}Object.js", function() {

// see above for usage
function Observable(props) {
	this.extend(props)
};
hope.setGlobal("Observable", Observable);

Observable.mixinTo = function(it, toClass) {
	// if mixing in to a class, mix into the prototype
	if (toClass != true && it.hasOwnProperty("prototype")) it = it.prototype;
	hope.extendIf(it, Observable.prototype);
}

// Observe a function change on some particular object.
//	Returns a boundHandler which can be used to remove an observation (w/ Observable.removeObservation)
//
//	NOTE: it is safer to pass a handler by reference (string) rather than pointer to a function!
//  TODO: will this scheme cause memory leaks?  stop observing all?
Observable.observe = function(when, object, property, handler, scope, args) {
	if (!object) return;	//TOWARN ?

	var original = object[property], 
		isOwnProperty = object.hasOwnProperty(property),
		handlers
	;
	// if there's not already an event queue function defined DIRECTLY ON OBJECT, create one
	if (!isOwnProperty || !original || !original.__handlers__) {
		handlers = [];
		// remember the original method and stick it in the list of handlers
		if (original) {	//TOWARN if no a function?
			handlers.originalMethod = original;
			handlers[0] = original;
		}
		
		var queue = object[property] = function executeHandlers() {
			var handlers = queue.__handlers__;
			var i = -1, observation, returnVal;
			while (observation = handlers[++i]) {
				if (observation === handlers.originalMethod) {
					returnVal = observation.apply(this, arguments);
				} else {
					observation.apply(this, arguments);
					if (observation.__once__) handlers.splice(i--, 1);
				}
			}
			return returnVal;
		};// end observationQueue
		queue.__handlers__ = handlers;
	} else {
		handlers = object[property].__handlers__;
	}
	if (!when) when = "after";
	
	// create a single, bound function to observe
	//	preferring a bindByReference
	var boundHandler = hope.bind(handler, scope, args);

	// note if we're only supposed to observe once
	if (when.contains("once")) boundHandler.__once__ = true;
	
	var added = false;
	// if we're to add before the original method
	if (when.contains("before")) {
		// find the position of the original and add right before that
		var i = -1, observation;
		while (observation = handlers[++i]) {
			if (observation.__isOriginalMethod__) {
				handlers.splice(i, 0, boundHandler);
				added = true;
				break;
			}
		}
	}
	
	// otherwise just add to the end
	if (!added)	handlers.push(boundHandler);
	
	// return an index which can be used to remove the binding
	return boundHandler;
}

// private method to remove one or more bound handlers from a list
Observable._removeObservations = function(handlers, boundHandler) {
	if (!handlers) return;
	if (boundHandler instanceof Array) {
		boundHandler.forEach(function(it){Observable.unwatch(object, property, it)});
	} else {
		handlers.remove(boundHandler); 
	}
}

// Remove a binding.  You must pass the handler which was returned by Observable.on;
Observable.removeObservation = function(object, property, boundHandler) {
	var handlers = (object[property] ? object[property].__handlers__ : null);
	if (handlers) Observable._removeObservations(handlers, boundHandler);
}


// Bind a function to be executed when some property on an object changes.
// Note: setting a property to its current value will NOT fire the onChange.
//	The change handler will be called as: (newValue, oldValue, property, scope)
Observable.watch = function(object, property, handler, scope, args) {
	if (!object) return;	//TOWARN ?
	var descriptor = Object.getOwnPropertyDescriptor(object, property), handlers;
	if (!descriptor || !descriptor.set || !descriptor.set.__observers__) {
		// set up a value property and default getter/setters
		// NOTE: this is not super well defined if you have a setter and no getter or vise versa
		var value, getter, setter;
		if (descriptor) {
			if (descriptor.hasOwnProperty("value")) {
				value = descriptor.value;
			} else {
				getter = descriptor.get;
				setter = descriptor.set;
			}

			// get rid of the old getter/setters 'cause we're gonna replace them
			delete object[property];
		}
		
		if (!getter) getter = function() { return (value !== undefined ? value : proto[property]) };
		if (!setter) setter = function(v) {value = v};
		
		// create a new setter which will call the observers AFTER the set
		var newSetter = function onChangeSetter(newValue) {
			var before = this[property];
			setter.apply(this, [newValue]);
			var after = this[property];
			if (after !== before) {
				var i = -1, observation, handlers = newSetter.__handlers__;
				while (observation = handlers[++i]) {
					observation(after, before, property, this);
				}
			}
		}
		handlers = newSetter.__handlers__ = [];
		// and hook it up
		Object.defineProperty(object, property, new Property({get:getter, set:newSetter}));
	} else {
		handlers = descriptor.set.__handlers__;
	}
	
	if (args.length === 0) args = undefined;
	
	// create a single, bound function to observe
	//	preferring a bindByReference
	handler = hope.bind(handler, scope, args);
	handlers.push(handler);

	// return an index which can be used to remove the binding
	return handler;
}

// Stop watching some property on an object.
Observable.unwatch = function(object, property, boundHandler) {
	var descriptor = Object.getOwnPropertyDescriptor(object, property);
	var handlers = (descriptor && descriptor.set ? descriptor.set.__handlers__ : null);
	if (handlers) Observable._removeObservations(handlers, boundHandler);
}


// Call some method after a delay.
Observable.soon = function(delay, object, method, args) {
	if (!object || typeof object[method] !== "function") return;	//TOWARN
	var timerProp = "__delayed_"+method+"__";
	if (object[timerProp]) clearTimeout(object[timerProp]);
	function doit() {
		delete object[timerProp];
		object[method].apply(object, args);
	}
	object[timerProp] = setTimeout(doit, delay);
	return object;
}



Observable.prototype = {
	// add ability to extend and extendIf to all observables
	extend : hope.extendThis,
	extendIf : hope.extendThisIf,

	// Call a method as some other class.
	//	If calling a function with the same name as the calling function,
	//	you can generally omit the function name.  However, you can specify
	//	it if you want to be explicit or you want to call a different method.
	as : function as(someClass, args) {
		var constructor = (typeof someClass === "string" ? hope.get(someClass) : someClass);
		if (!constructor) throw TypeError(this+".as("+someClass+"): class not found");
		var method;
		if (typeof arguments[1] === "string") {
			method = arguments[1];
			args = arguments[2];
		} else {
			var method = as.caller.name || as.caller._name;
		}
		method = constructor.prototype[method];
		if (typeof method === "function") {
			return method.apply(this, args);
		} else {
			console.warn(this,"as",someClass,"method not found");
		}
	},

	// observe some method of this object
	//	(same semantics as Observable.observe)
	on : function(property, handler, scope, args) {
		return Observable.observe("after", this, property, handler, scope, args);
	},

	// observe some method of this object
	//	(same semantics as Observable.observe)
	before : function(property, handler, scope, args) {
		return Observable.observe("before", this, property, handler, scope, args);
	},

	// observe some method of this object
	//	(same semantics as Observable.observe)
	once : function(property, handler, scope, args) {
		return Observable.observe("once", this, property, handler, scope, args);
	},

	// stop observe some method of this object
	//	(same semantics as Observable.removeObservation)
	un : function(property, boundHandler) {
		return Observable.removeObservation(this, property, boundHandler);
	},


	// observe changes to some property of this object
	//	(same semantics as Observable.onChange)
	watch : function(property, handler, scope, args) {
		return Observable.watch(this, property, handler, scope, args);
	},

	// stop observing changes to some method of this object
	//	(same semantics as Observable.unChange)
	unwatch : function(property, boundHandler) {
		return Observable.unwatch(this, property, boundHandler);
	},

	// Call some named @method on this object 'soon' (eg on a timeout, after @delay).
	// You can completely omit the @delay parameter (defaults to 0).
	//	NOTE: Multiple calls to soon which come in before the actual firing will reset the timer.
	//		  In this case, the arguments passed to the LAST invocation of soon() will win.
	soon : function(delay, method, args) {	
		if (typeof delay === "number") {
			Observable.soon(delay, this, method, $args(2));
		} else {
			Observable.soon(0, this, delay, $args(1));
		}
	}
}

Script.loaded("{{hope}}Observable.js");
});// end Script.require()
