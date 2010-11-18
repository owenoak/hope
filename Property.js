
Script.require("{{hope}}Object.js", function() {


//
//	Create Descriptors 
//

// use new Property(getter,setter) to create a quick property descriptor for working with
//	Object.defineProperty, etc

function Property(props) {
	if (this === window) return new Property(props);
	if (props) 	hope.setProto(props, Property.prototype);
	else 		props = this;
	if (props.hasOwnProperty("value")) props.writeable = true;
	return props;
}
Property.prototype = {
	configurable 	: true,
	enumerable 		: true
}
hope.setGlobal("Property", Property);


// simple Getter
function Getter(getter) {
	if (this === window) return new Getter(getter);
	this.get = getter;
}
hope.setProto(Getter.prototype, Property.prototype);
hope.setGlobal("Getter", Getter);


// simple Setter
function Setter(setter) {
	if (this === window) return new Setter(setter);
	this.set = setter;
}
hope.setProto(Setter.prototype, Property.prototype);
hope.setGlobal("Setter", Setter);


function InstanceProperty(options) {
	if (this === window) return new InstanceProperty(options);

	if (typeof options === "string") options = {name:options};
	var property = options.name,
		onChange = options.onChange || options.onchange,
		defaultValue = options.value,
		inherit = options.inherit,
		_property = "_"+property
	;
	var descriptor =  new Property({
		get : function() {	
			var value = (inherit ? this : this.data)[_property];
			return (value !== undefined ? value : defaultValue);
		},
		set : function(newValue) {
			var cache = (inherit ? this : this.data);
			var oldValue = cache[_property];
			if (oldValue === newValue) return;
			cache[_property] = newValue;
			if (onChange) onChange.call(this, newValue, oldValue);
		}
	});
	if (defaultValue !== undefined) {
		return new Property({
			init : function(proto, key) {
				Object.defineProperty(proto, key, descriptor);
				proto[key] = defaultValue;
			}
		});
	}
	return descriptor;
}
hope.setGlobal("InstanceProperty", InstanceProperty);


// A key:value map which will inherit from our superclass's property of the same name.
//	Preference to a new map will add properties, not replace the map.
//  Note that the map will be null if it's never been set.
function InstanceMap(options) {
	if (this === window) return new InstanceMap(options);

	if (typeof options === "string") options = {name:options};
	var property = options.name,
		normalize = options.normalize,	
		_property = "_"+property,
		defaultValue = options.value || {}
	;
	// set up to tupelize
	if (!normalize && options.tupelize) {
		normalize = function(value){
			return (value && typeof value === "string"
					? value.trim().tupelize(options.itemDelim, options.valueDelim) 
					: value);
		};
	}
	var descriptor = new Property({
		get : function() {	
			return this[_property];
		},
		set : function(newMap) {
			if (normalize) newMap = normalize.call(this, newMap);
			if (newMap == null || typeof newMap !== "object") return;	//TOTHROW?
			if (!this.hasOwnProperty(_property)) {
				var proto = (this._adapter ? this._adapter : this.constructor).prototype;
				this[_property] = Object.clone(proto[_property]);
			}
			var cache = this[_property];
			for (var key in newMap) {
				cache[key] = newMap[key];
			}
//console.warn(property, this, cache);
		}
	});
	return new Property({
		init : function(proto, key) {
			Object.defineProperty(proto, key, descriptor);
			proto[key] = defaultValue;
		}
	});
	return descriptor;
}
hope.setGlobal("InstanceMap", InstanceMap);


// use a NestedProperty to safely get/set a sub-property of one of our children
//	path is a simple dotted path, relative to this (eg:  someChild.someGrandChild.someProperty)
window.NestedProperty = function NestedProperty(path, options) {
	if (!options) options = {};
	
	path = path.split(".");
	var expressionMatrix = [];
	for (var i = 1; i < path.length; i++) {
		expressionMatrix.push("this."+path.slice(0,i).join("."));
	}
	var expression = expressionMatrix.join(" && ");
	path = path.join(".");

	if (!options.get) {
		options.get = Function("if ("+expression+") return this."+path);
	}
	if (!options.set) {
		options.set = Function("value","if ("+expression+") return (this."+path+" = value)");
	}
	return new Property(options);
}




/* NOT USING THESE... THEY ARE OUT OF DATE AND PROBABLY WON'T WORK
window.InheritedProperty = function InheritedProperty(options) {
	if (typeof options === "string") options = {name:options};
	var property = options.name,
		onChange = options.onChange || options.onchange,
		defaultValue = options.value
	;
	return new Property({
		get : function() {	
			var value = this.inherited[property];
			return (value !== undefined ? value : defaultValue);
		},
		set : function(newValue) {
			var oldValue = this.inherited[property];
			if (oldValue === newValue) return;
			this.inherited[property] = newValue;
			if (onChange) onChange.call(this, newValue, oldValue);
		}
	});
}

// InheritedObject automatically creates a unique object for each instance[key]
//	which inherits from a common prototype[key] object (also automatically created);
window.InheritedObject = function InheritedObject(props) {
	return Property.apply(this, arguments);
}
InheritedObject.prototype = new Property({
	init : function(proto, key){
		proto.before("init", function() {
			this[key] = Object.clone(proto[key]);
		});
		proto[key] = {};
	}
});


// InstanceList automatically creates a unique array for each instance[key].
window.InstanceList = function InstanceList(props) {
	return Property.apply(this, arguments);
}
InstanceList.prototype = new Property({
	init : function(proto, key){
		proto.before("init", function() {
			this[key] = [];
		});
	}
});
*/


// Preference that's maintained (as a string) in localStorage -- has same value for all objects.
//	You'll generally set this on a discrete object, not a prototype.
//	Pass @option.value for default value
//	Pass @option.normalize function to normalize value (eg: coerce to an int, etc)
//  Pass @options.onChange function to be called when value changes.
//
//TODO: should this be a subclass of Property?  Is that more efficient?
function Preference(options) {
	if (this === window) return new Preference(options);

	var settingName = options.name,
		onChange = options.onChange || options.onchange,
		normalizer = options.normalize,
		defaultValue = options.value
	;
	// remember the name, since we can't iterate through localStorage directly
	Preference.names[settingName] = defaultValue;
	return new Property({
		init : function(it, key) {
			Object.defineProperty(it, key, {
				get : function() {
					var value = hope.preference(settingName);
					if (value === undefined) value = defaultValue;
					if (normalizer) value = normalizer.call(this, value);
					return value;
				},
				set : function(newValue) {
					var oldValue = hope.preference(settingName);
					if (normalizer) newValue = normalizer.call(this, newValue);
					hope.preference(settingName, newValue);
					if (onChange && oldValue !== newValue) onChange.call(this, newValue, oldValue);
				}
			});

			// if there's an onChange handler, call it after a short delay 
			//	in case we have an initial value.
			if (onChange) setTimeout(function(){onChange.call(it, it[key])}, 1);
		}
	});
}
hope.setGlobal("Preference", Preference);
// remember the settings, so we can clear them later
Preference.names = {};

// clear all settings we're managing
Preference.clearAll = function() {
	for (var name in Preference.names) {
		delete localStorage[name];
	}
}


//TODO: onchange
function PreferenceFlag(options) {
	var prefId = options.id;

	return new Property({
		get : function() {
			var id = prefId.expand(this);
			return (hope.preference(id) === "true");
		},
		set : function(value) {
			value = !!value;
			var id = prefId.expand(this);
			hope.preference(id, (value ? "true" : null));
		}
	});
}
hope.setGlobal("PreferenceFlag",PreferenceFlag);


//TODO: onchange
function ListPreference(options) {
	var settingName = options.name,
		prefId 		= options.id
	;
	// remember the name, since we can't iterate through localStorage directly
	Preference.names[settingName] = "";
	return new Property({
		get : function() {
			var id = prefId.expand(this);
			var list = hope.preference(id);
			return (list ? list.split(",") : []);
		},
		set : function(value) {
			if (typeof value === "string") {
				if (value.charAt(0) === "+") {
					value = this[settingName].addUnique(value.substr(1));
				} else if (value.charAt(0) === "-") {
					value = this[settingName].remove(value.substr(1));
				}
			}
			if (value instanceof Array) value = value.join(",");
			var id = prefId.expand(this);
			hope.preference(id, value);
		}
	});
}
hope.setGlobal("ListPreference",ListPreference);



Script.loaded("{{hope}}Property.js");
});// end Script.require()
