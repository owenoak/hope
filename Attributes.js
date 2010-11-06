/*** Attributes for adding to elements ***/

// 	Attribute methodology:
//		- When elements are initialized, we automatically assign all attribute values which
//			the element is registered to look for to the appropriate property on the element.
//		- Thus we know that if an element is created with an attribute, 
//			its internal state reflects the appropriate value.
//		- When setting an 'attribute' property, we generally do NOT update the attribute.
//			Pass .update=true|"class" to update either the attribute or an html class.
//			We will ALWAYS do this, even if the oldValue matches the newValue. (???)
//		- If the oldValue does not match the newValue, we'll call an .onChange handler if provided.
//		- Use a 'normalizer' to massage a value before setting the internal property.
//			This might, eg, turn a string into a function.
//
//		- We ALWAYS store the value in the object????



Script.require("{{hope}}Property.js", function(){


window.INVALID_VALUE = "__INVALID_VALUE__";

// different types of Attributes you can create which are mirrored by internal properties
//	and/or attributes set on elements


window.Attribute = function Attribute(options) {
	// for very simple attributes, just pass a string
	if (typeof options === "string") options = {name:options};
	
	if (options.type) {
		var initializeOptions = Attribute.initializers[options.type];
		if (initializeOptions) initializeOptions(options);
	}
	
	var	attr = options.name,
		property = options.property || attr,
		inherit = options.inherit,
		_property = "_"+property,
		update = (options.update == true),
		value = options.value,
		onChange = options.onchange || options.onChange,
		normalize = options.normalize || Attribute.normalizers[options.type],
		dirty = options.dirty == true
	;
	if (!options.get) {
		options.get = function getAttr() {
			var cache = (inherit ? this : this.data);
			return cache[_property];
		};
	}
	if (!options.set) {
		options.set = function setAttr(newValue) {
			var cache = (inherit ? this : this.data),
				oldValue = cache[_property]
			;
			// short circuit if no change
			if (newValue == oldValue) return;

			if (Attribute.debug) console.info(this,"setattr",attr,"to",newValue,oldValue);
			if (normalize) newValue = normalize.call(this, newValue, oldValue, options);
			if (newValue === INVALID_VALUE) return;
			cache[_property] = newValue;
			if (update) this.attr(attr, newValue);
			if (onChange) onChange.call(this, newValue, oldValue);
			if (dirty) this.dirty = true;
		}	
	}
	options.descriptor = new Property({ get : options.get, set : options.set });
	if (!options.init) {
		var _attr = attr.toLowerCase();
		options.init = function(proto, key) {
			// hook up the descriptor
			Object.defineProperty(proto, key, options.descriptor);
			// and remember the attr=>key mapping
			proto.attributeMap = _attr+":"+key;
			// if the attribute is inherited and a value was defined, set it on the prototype
			if (value !== undefined) proto[_property] = value;
		};
	}
	return new Property({ init : options.init });
}
hope.setGlobal("Attribute", Attribute);
Attribute.debug = hope.debug("Attribute");

// initializers for different types of attributes
Attribute.initializers = {
	"enum" : function(options) {
		if (typeof options.values === "string") options.values = options.values.splitList();
		if (!options.values) throw "Enum attribute '"+options.name+"' must be initialized with an values array";
	},
	
	"function" : function(options) {
		if (!options.args) options.args = "";
	},
	
	"event" : function(options) {
		options.update = false;
		if (!options.name && options.event) {
			options.name = "on"+options.event.capitalize();
		}
		if (!options.args) options.args = "event";
		if (options.event && !options.onChange) {
			options.onChange = function(newValue, oldValue) {
				this.hookup(options.event, newValue);
			}
		}
	},
	
	"flag" : function(options) {
		// if default is false, true if attribute is not `true`, empty string, "yes" or "true"
		if (options.value === false) {
			options.normalize = function(newValue, oldValue, options) {
				return (newValue === true || newValue === "" || newValue === "yes" || newValue === "true");
			}
		}
		// if default is true, true if attribute is not `false`, "no", "false"		
		else if (options.value === true) {
			options.normalize = function(newValue, oldValue, options) {
				return (newValue !== false && newValue !== "no" && newValue !== "false");
			}
		} 
		// otherwise true if set at all
		else {
			options.normalize = function(newValue, oldValue, options) {
				return (newValue !== null);
			}
		}
	},
	
	"conditional" : function(options) {
		var attr = options.name,
			property = options.property || attr,
			inherit = options.inherit,
			_property = "_"+property,
			condition = options.condition,
			ifTrue = options.ifTrue,
			ifFalse = options.ifFalse,
			onChange = options.onChange
		;
		if (condition) {
			options.get = function() {
				if (this[condition]) {
					var value = this[condition]();
					this[property] = value;
					return value;
				}
				return (inherit ? this : this.data)[_property];
			}
		} else {
			options.get = function() {
				return (inherit ? this : this.data)[_property];
			}		
		}
		
		options.set = function(newValue) {
			// make sure our attribute agrees with the new state
			var attrValue = (typeof newValue === "string" ? newValue 
								: (newValue ? ifTrue : ifFalse));
			this.attr(attr, attrValue);

			var cache = (inherit ? this : this.data), oldValue = cache[_property];
			cache[_property] = newValue;
			if (onChange && oldValue != newValue) onChange.call(this, newValue, oldValue);
		}
		
		if (options.ifTrue) {
			options.normalize = function(newValue){ debugger;return newValue == options.ifTrue};
		} else if (options.ifFalse) {
			options.normalize = function(newValue){ debugger;return newValue != options.ifFalse};
		}
	}
}

// type normalizers for different types of attributes
Attribute.normalizers = {
	"number" : function(newValue, oldValue, options) {
		newValue = parseFloat(newValue);
		if (isNaN(newValue)) return INVALID_VALUE;
		return newValue;
	},
	
	"boolean" : function(newValue, oldValue, options) {
		return !!newValue;
	},
	
	"function" : function(newValue, oldValue, options) {
		if (typeof newValue === "string") {
			if (newValue.indexOf("function") !== -1) {
				eval("newValue = "+newValue);
				return newValue;
			} else {
				var fn = new Function(options.args, newValue);
				return fn;
			}
		}
		if (typeof newValue !== "function") return INVALID_VALUE;
		return newValue;
	},
	
	"condition" : function(newValue, oldValue, options) {
		if (newValue === undefined) return null;
		return Function.makeCondition(options.args||"", newValue);
	},
	
	"enum" : function(newValue, oldValue, options) {
		if (options.values.indexOf(newValue) === -1) return INVALID_VALUE;
		if (options.update) {
			if (oldValue) this.classList.remove(oldValue);
			this.classList.add(newValue);
		}
		return newValue;
	},
	
	"preference" : function(newValue, oldValue, options) {
		if (typeof newValue === "string") {
			var colon = newValue.indexOf(":");
			if (colon > -1) {
				var defaultValue = newValue.substr(colon+1);
				newValue = newValue.substr(0,colon);
				if (hope.preference(newValue) === undefined) hope.preference(newValue, defaultValue);
			}
		}
		return newValue;
	},
	
	// comma-separated list
	"list" : function(newValue, oldValue, options) {
		if (typeof newValue === "string") return newValue.split(",");
		return newValue;
	}
}

Attribute.normalizers.event = Attribute.normalizers["function"];


// single child sub-element
window.Child = function Child(options) {
	if (typeof options === "string") options = {selector:options};
	return new Getter(function() {
		return this.select(options.selector).innerHTML;
	});
}

// single child sub-element's HTML
window.ChildHTML = function ChildHTML(options) {
	if (typeof options === "string") options = {selector:options};
	return new Getter(function() {
		return this.select(options.selector).innerHTML;
	});
}

// set of child sub-elements
window.Children = function Children(options) {
	if (typeof options === "string") options = {selector:options};
	return new Getter(function() {
		return this.selectAll(options.selector);
	});
}


window.ChildWhere = function ChildWhere(options) {
	if (typeof options === "string") options = {selector:options};
	var selectorParts = options.selector.split("{{value}}"),
		prefix = selectorParts[0], suffix = selectorParts[1]
	;
	return function(value) {
		var selector = prefix + value + suffix;
		return this.select(selector);
	}
}

window.ChildrenWhere = function ChildrenWhere(options) {
	if (typeof options === "string") options = {selector:options};
	var selectorParts = options.selector.split("{{value}}"),
		prefix = selectorParts[0], suffix = selectorParts[1]
	;
	return function(value) {
		var selector = prefix + value + suffix;
		return this.selectAll(selector);
	}
}


Script.loaded("{{hope}}Attributes.js");

});// end Script.require

