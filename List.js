/*** List class and Array extensions ***/

Script.require("{{hope}}Object.js,{{hope}}Class.js", function(){

var AP = Array.prototype;
var splice = AP.splice;
var slice = AP.slice;
var shift = AP.shift;
var unshift = AP.unshift;


// TODO:
//		- new Class(id,{"super":List}) needs to use List's make constructor function


AP.isListLike = true;


// Just like an array but:
//	+ subclassable
//	+ observable
//	+ pass an array-like thing to the constructor (rather than a set of arguments)
//
//	NOTE: for List subclasses:
//		- `it instanceof List === false`, but
//		- `it instanceof Array === true`
//   :-(
new Class("List", {

	// Create a List subclass constructor.
	makeSubclassConstructor : function(id, options) {
		// create the constructor in an eval, for debugging
		eval(
			"options.constructor = function "+id.toIdentifier()+"() {\r\n"
				+ "var list = [];\r\n"
				+ "hope.setProto(list, options.constructor.prototype);\r\n"
				+ "if (arguments[0] === '__CREATING_SUPERCLASS__') return list;\r\n"
				+ "return (list.init.apply(list, arguments) || list);\r\n"
			+ "}"
		);
		return options.constructor;
	},
	
	// Create a List subclass prototype.
	makeSubclassPrototype : function(id, options) {
		// Prototype is actually an array instance.
		// This makes all instances actual instance of Array, 
		//	which means their .length is maintained automatically.
		options.prototype = [];
		
		// Manually copy all properties on this.prototype to the array.
		// NOTE: we cannot just assign our proto to super's proto,
		//			as that would break the inheritance from Array.
		hope.extendIf(options.prototype, options["super"].prototype);		
		return options.prototype;
	},

	properties : {
		// on init, add non-null arguments to the list
		init : function(items) {
			var count = arguments.length;
			if (count === 0) return;
			
			if (count === 1 && items && items.length != null) {
				this.addList(items);
			} else {
				for (var i = 0; i < count; i++) {
					var it = arguments[i];
					if (it != null) this[this.length] = arguments[i];
				}
			}
		},
	
		// return JS to reconstruct this List
		toSource : function() {
			var output = [];
			for (var index = 0, last = this.length; index < last; index++) {
				var it = this[index];
				output[index] = (it != null && it.toSource ? it.toSource() : JSON.stringify(it));
			}
			return "new "+this.constructor.toRef()+"("+output.join(",")+")";
		},
	
		// identify as a List
		toString : function() {
			return "[a "+this.constructor.toRef()+"]";
		},
		
		// explicitly add Array.prototype mutator and collection-y methods to List.prototype

		// these standard methods mutate the list
		push : function() {
			var index = -1, last = arguments.length;
			if (last > 0 && arguments[last-1] == null) last--;
			while (++index < last) {
				var it = arguments[index];
				this[this.length] = it;
				this.added(last+index, it, this);
			}
			return this.length;
		},
		pop : function() {
			var it = this[this.length-1];
			this.removeItem(it, this.length-1);
			return it;
		},
		shift : function() {
			var it = shift.apply(this);
			this.removed(it, 0, this);
			return it;
		},
		unshift: function(arg1, arg2, etc) {
			unshift.apply(this, arguments);
			for (var index = 0; index < arguments.length; index++) {
				this.added(index, arguments[index], this);
			}
			return this.length;
		},
		
		reverse : function() {
			var list = this.clone();
			for (var index = 0, last = this.length-1; index <= last; index++) {
				this[index] = list[last-index];
			}
			this.soon("changed");
			return this;
		},
		sort : function() {
			sort.apply(this, arguments);
			this.soon("changed");
		},
		splice : function(startAt, toDelete, newItem, newItem2, etc) {
			var results = new this.constructor(splice.apply(this, arguments));
			var index = -1;
			if (toDelete) {
				while (++index < toDelete) {
					this.removed(results[index], startAt+index, this);
				}
			}
			if (arguments.length > 2) {
				index = 1;
				while(++index < args.length) {
					this.added(args[index], startAt+index-1, this);
				}
			}
			return results;
		},

		// these return a new instance -- TODO: recast so we return an instance of the list class
		slice : function() {
			var list = slice.apply(this, arguments);
			return new this.constructor(list);
		},
		concat : function() {
			var list = concat.apply(this, arguments);
			return new this.constructor(list);
		},
		filter : function() {
			var list = filter.apply(this, arguments);
			return new this.constructor(list);
		}
	}// end properties	
});// end new Class()


var listMethods = {
	//
	// new List methods
	//
	extend : hope.extendThis,
	extendIf : hope.extendThisIf,

	// return a 'clone' of this array -- same type and list of items
	clone : function() {
		var clone = new this.constructor;
		if (this.length) clone.addList(this);
		return clone;
	},

	// Add a list of items to the end of us.
	//	Skips null items.
	addList : function(list) {
		var index = -1, last = list.length;
		while (++index < last) {
			var it = list[index];
			if (it == null) continue;
			this[this.length] = it;
			this.added(it, this.length-1, this);
		}
		return this;
	},

	// add one or more items at the end
	append : function(it) {
		this.addList.call(this, arguments);
		return this;
	},
	
	// add at beginning
	prepend : function(it) {
		this.unshift.apply(this, arguments);
		return this;
	},
	
	// add it only if it's not already in there
	addUnique : function(it) {
		for (var index = 0; index < arguments.length; index++) {
			if (this.indexOf(it) === -1) this.push(it);
		}
		return this;
	},

	// remove single item at index
	removeItem : function(index) {
		this.splice(index, 1);
		return this;
	},

	// remove all occurances of a single item
	remove : function(it) {
		var index;
		while ( (index = this.indexOf(it)) !== -1) {
			this.splice(index, 1);
		}
		return this;
	},

	// remove all items where (anonymous) callback is non-truthy
	where : function(callback) {
		var index = this.length, it;
		while (--index >= 0) {
			if (!callback(this[index])) this.splice(index, 1);
		}
		return this;
	},

	
	// remove all items where (anonymous) function returns truthy value
	removeWhere : function(callback) {
		var index = this.length, it;
		while (--index >= 0) {
			if (callback(this[index])) this.splice(index, 1);
		}
		return this;
	},
	
	// clean up a list by removing null/undefined items
	clean : function() {
		return this.remove(null);
	},
	
	// call a named method for each item in the list which implements it
	call : function(method, args) {
		for (var i = 0, last = this.length; i < last; i++) {
			var it = this[i];
			if (it && typeof it[method] === "function") it[method].apply(it, args);
		}
	},
	

	// apply a function or named @method on each non-null item in list
	//	scope is each item in the list in turn (eg: 'this' is the item)
	//	@scope is scope object for the calls, each item will be used if scope not defined
	//	@args is array of arguments to pass to the function
	//  returns results of each call as a new List
	//	to return a different list type or append to another list, pass @results as a list-like thing
	apply : function(method, scope, args) {
		var results = [];
		var resultIndex = results.length, index = -1, last = this.length, it;
		if (typeof method === "string") {
			var itemMethod;
			while (++index < last) {
				it = this[index];
				if (it == null || typeof (itemMethod = it[method]) !== "function") continue;
				results[resultIndex++] = itemMethod.apply(scope||it, args);
			}
		} else {
			while (++index < last) {
				it = this[index];
				if (it == null) continue;
				results[resultIndex++] = method.apply((scope||it), args);
			}
		}
		return results;
	},
	
	// return true if list contains an item
	contains : function(it) {
		return (this.indexOf(it) !== -1);
	},

	// return the last item in the list
	last : function() {
		return this[this.length-1];
	},
	
	
	// Set/return a property from each non-null item in the list.
	//	if getting, returns Array of results
	//	if setting, returns this
	property : function(prop, newValue) {
		var index = -1, last = this.length, it;
		if (newValue === undefined) {
			var results = [];
			while (++index < last) {
				if ((it = this[index]) != null) results.push(it[prop]);
			}
			return results;
		} else {
			while (++index < last) {
				this[index][prop] = newValue;
			}
			return this;
		}
	},
	
	// sort by a particular property
	sortBy : function(property, direction) { 
		throw SyntaxError("list.sortBy not implemented")
	},


	// given a 2-dimensional list, flatten into a single list
	flatten : function() {
		var results = [];
		for (var i = 0, last = this.length, list; i < last; i++) {
			list = this[i];
			if (! (list instanceof Array)) continue;
			results.push.apply(results, list);
		}
		return results;
	},

	//
	// events you can observe on a list
	//

	// 'added' is here to observe when a single thing is added to the list
	added : function(it, index, list){
		if (this.changed) this.soon("changed");
	},

	// 'removed' is here to observe when a single thing is removed from the list
	removed : function(it, index, list){
		if (this.changed) this.soon("changed");
	},
	
	// 'changed' is here to observe when the list changes
	// NOTE: doesn't say much about how it changed...
	// NOTE: this should only be called once per batch of changes
// NOTE: not defining for efficiency
//		changed : function(){},

}

List.extend(listMethods);

// add methods to Array.prototype as well
Array.toRef = function(){return "Array"};
hope.extendIf(Array.prototype, listMethods);

// make apply methods for each specified instance method
//	overall return value of is the list, for chaining
List.makeAppliers = function(constructor, methods, firstOnly) {
	methods = methods.split(",");
	var proto = constructor.prototype, index = -1, method;
	while (method = methods[++index]) {
		proto[method] = (firstOnly 
			? new Function("if (this[0] != null && typeof this[0]."+method+" === 'function') "
							 +"return this[0]."+method+".apply(this[0], arguments);")
		    : new Function("this.forEach(function(it){\
			    				var fn = it['"+method+"'];\
			    				if (typeof fn === 'function') fn.apply(it,arguments);\
			    			});\
		    				return this")
		);
	}
}

// make accessor methods for named properties
List.makeAccessors = function(constructor, properties, firstOnly) {
	properties = properties.split(",");
	var proto = constructor.prototype, index = -1, prop;
	while (prop = properties[++index]) {
		Object.defineProperty(proto, prop, new Property({
			get : (firstOnly ? new Function("if (this[0] != null) return this[0]['"+prop+"']")
							: new Function("return this.property('"+prop+"');")
				  ),
			set : new Function("value","return this.property('"+prop+"',value);")
		}));
	}
}

Script.loaded("{{hope}}List.js");
});// end Script.require()
