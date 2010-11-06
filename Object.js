/*** Object extensions ***/

Script.require("{{hope}}Function.js", function() {

var Object = window.Object;

Object.toRef = function(){ return "Object" }




//
//	ES5 Object property descriptor shims
//


// Getter/setter hookup via simulated Object.defineProperty.

// faked _defineProperty -- handles getters/setters only
function _defineProperty(object, property, descriptor) {
	if (descriptor.set) object.__defineSetter__(property, descriptor.set);
	if (descriptor.get) object.__defineGetter__(property, descriptor.get);
	if (descriptor.hasOwnProperty("value")) object[property] = descriptor.value; 
	return object;
}


// regular Safari doesn't allow you to use Object.defineProperty on an Element, ugh
if (Browser.safari && Object.defineProperty) {
	var originalDefineProperty = Object.defineProperty;
	Object.defineProperty = function(object, property, descriptor) {
		if (object instanceof Element || object instanceof Document) {
			_defineProperty(object, property, descriptor);
		} else {
			originalDefineProperty(object, property, descriptor);
		}
		return object;
	}
} else if (!Object.defineProperty) {
	Object.defineProperty = _defineProperty;
}

// Define a bunch of 'properties' at once */
if (!Object.defineProperties) {
	Object.defineProperties = function(object, properties) {
		if (object && properties) {
			for (var key in properties) {
				Object.defineProperty(object, properties[key]);
			}
		}
		return object;
	}

}

// Getter/setter/etc examination via simulated Object.getOwnPropertyDescriptor.
if (!Object.getOwnPropertyDescriptor) {
	Object.getOwnPropertyDescriptor = function(object, property) {
		if (!object.hasOwnProperty(property)) return undefined;
		
		var desc = {enumerable:true, configurable:true},
			getter = object.__lookupGetter__(property),
			setter = object.__lookupSetter__(property)
		;
		if (setter) desc.set = setter;
		if (getter) desc.get = getter;
		if (!setter && !getter) {
			desc.value = object[property];
			desc.writable = true;
		}
		return desc;
	}
}

// Return list of "own" property names for an object, via simulated Object.keys().
if (!Object.keys) {
	Object.keys = function(it) {
		var keys = [];  
		for(var name in it) {  
			if (it.hasOwnProperty(name)) keys.push(name);  
		}
		return keys;  	
	}
}

// create a simple, prototype-based clone of some object
if (!Object.clone) {
	Object.clone = function(it, properties) {
		function Cloned(){}
		Cloned.prototype = it;
		var cloned = new Cloned();
		if (properties) Object.defineProperties(cloned, properties);
		return cloned;
	}
}


Script.loaded("{{hope}}Object.js");
});// end Script.require()
