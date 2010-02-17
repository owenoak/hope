/*
TODO:
	- some rational/quick observer pattern ala sproutcore, hook up to Class instances (and class?)
	- class.get("path.to.thing")
	- check for/replace super calls in set() ?	would work if we never bind... can we make that safe?

	- how to do bound properties, bound expressions?
	- data thing?  co-opt the jQuery one?

*/

/*! Hope application framework, v 0.1					See: http://hopejs.com
 *	MIT license.										See: http://hopejs.com/license
 *	Copyright (c) 2006-2009, Matthew Owen Williams.
 */


/*
	TODO:	
			- instead of always creating the same constructor, 
				make a clone of our superclass's constructor so we always dupe it?
					- eg: subclassing list won't use same constructor
					

 */

(function(hope) {	/* Begin hidden from global scope */


/**	Create a hope.Class constructor which you can use to create new classes.

	Classes:
		- are subclassable
		- can be referenced globally as   `SomeClass.toString()`
		- ...
		
	Class instances:
		- can be referenced globally as   `someInstance.toString()` if collected
		- ...
		
	To get a pointer to a Class class by name (or reference) do: 	hope.Class("type")

	@sideEffect		The new class will be made available as `hope[<options.type]`.
	@sideEffect		If `options.collect` is true, collection of objects 
					will be available as `hope[<options.collection>]`.
	
	@param options.name						Name for the class.
	@param [options.constructor]			Constructor function -- one will be created if not defind.
											NOTE: your constructor MUST call this.onCreate()!
	@param [options.plural]					Plural of the type.  Will be type+"s" if not defined.
	@param [options.isA|isAn]				Name or pointer to super class.  (case insensitive)
	@param [options.mixin[s]]				Mixins to apply.  ("mixin" and "mixins" both work)
	@param [options.statics]				Simple object of properties and methods to mixin to the class itself.
	@param [options.prototype]				Simple object of properties and methods to mixin to the prototype.
	@param [options.setConstructor]			Name of constructor to use to create a set of instances.
											(Note: it is up to instance methods to use this).
	@param [options.primaryKey]				If supplied, name of a property on each instance that is unique
											for all instances that can ever be created (like a database primary key).
											Note -- it is up to you to ensure this uniqueness!
	@param [options.equals]					function(this, that) -- returns true if both items are semantically equal.
	@param [options.onCreate]				Method to call to set up the class (after everything else is done).
	@param [options.properties]				Array of names of instance properties to save (in addition to those of superclass).
	@param [options.bindings]				Array of instance bindings (in addition to those of superclass).
*/
hope.registerThing("Class", function Class(options){
	// return instantly if constructing a prototype
	if (options == hope.SKIP || options == null) return this;

	// get the various options and defaults for them
	var type	 			= options.name, 
		plural				= options.plural || type+"s",
								// either case or declension works
		Super 				= options.isA || options.isAn || options.isa || options.isan,
		autoRegister		= ( (options.autoRegister == true) || (options.autoregister == true))
	;
	var prototype, constructor;
	
	// make sure they provided a class name and it is not already defined
	if (!type) throw new TypeError("Must provide a class.name")
	if (hope.Things[type.toLowerCase()]) throw new TypeError("Class '"+type+"' already exists");


	// convert SuperClass to a class if they passed a string
	if (Super == null) 					Super = hope.Class;
	else if (typeof Super == "string") 	Super = hope.getThing(Super);	// will throw if not found

	// if they gave us a constructor, use that
	if (options.hasOwnProperty("constructor")) {
		constructor = options.constructor;
	}
	// make a constructor function
	else {
		constructor = function ClassConstructor(properties) {
			// if hope.SKIP is passed, we're creating a prototype for a subclass -- bail immediately.
			if (arguments[0] == hope.SKIP) return;
	
			// extend the instance with properties passed in
			// after this, properties will be the unique properties actually set on this object
			if (properties) properties = this.set(properties);

			// notify that we've been created
			this.notify("create");
		}
	}

	//
	// set up the constructor
	//
	
	// add all properties/methods from the Super
	hope.extend(constructor, Super);

	// set up the subclass -> Super relationship
	Super.SubClasses.push(constructor);
	constructor.superclass = Super;

	// give the constructor a list to hold its subclasses
	constructor.SubClasses = [];
	constructor.subclass = function(options) {
		options.isA = constructor;
		return new hope.Class(options);
	}

	// for knowing when we're dealing with classes
	constructor.type = constructor.classType = type;
	constructor.plural = plural;


	//
	// set up the collection of instances
	//
	constructor.Instances = {};
	constructor.InstanceCount = 0;

	// register the collection as hope[<plural>]
	hope[plural] = constructor.Instances;
	constructor.Instances.toString = function(){return "hope."+plural };

	// set up list of properties (things we save)
	constructor.addProperties(options.properties);
	// set up auto-bindings
	constructor.addBindings(options.bindings);

	// Primary key for instances (MUST be unique for all instances)
	if (options.primaryKey) {
		constructor.primaryKey = options.primaryKey;

		// define equals as two objects matching by primary key
		constructor.equals = function(a,b){
			if (a != null && b != null) {
				return (a[options.primaryKey] === b[options.primaryKey]);
			}
			return false;
		}
	}

	// return true if two instances (or an instance and a set of properties) are equal
	if (options.equals) constructor.equals = options.equals;

	// Constructor for sets of items of the class.
	if (options.setConstructor) constructor.setConstructor = options.setConstructor;

	//
	// set up the constructor's prototype
	//

	// create the new instance of the superclass's prototype, skipping the init routine
	// this will automatically pick up all Super defaults
	prototype = constructor.prototype = new Super(hope.SKIP);
	prototype.constructor = prototype.Class = constructor;
	prototype.classType = type;
	//
	//	apply mixins
	//

	// if the prototype specifies any mixins, do that now BEFORE assigning other properties
	var mixins = options.mixins || options.mixin;
	if (mixins) hope.Mixin.mixinTo(constructor, mixins);


	//
	//	add any defaults passed in to class and prototype
	//

	// add defaults passed in to the class
	if (options.statics) hope.mixin(constructor, options.statics);

	// add prototype defaults passed in to the prototype
	if (options.prototype) {
		// NOTE: we can't use set() because that does not handle getters/setters
		hope.mixin(prototype, options.prototype);
	}

	//
	//	registration
	//	
	
	// register the constructor in the list of Things
	hope.registerThing(type, constructor);

	// call the onCreateClass routine if defined
	if (options.onCreate) options.onCreate.apply(constructor);

	return constructor;
});	// end hope.registerThing("Class")


//
// Methods and properties common to all Classes (the constructors, NOT the prototypes).
//
hope.extend(hope.Class, {
	type : "Class",
	
	// note that we're both a Class and a Thing
	isAClass : true,

	/** List of properies we'll save for this class. */
	properties : [],

	/** List of static bindings. */
	bindings : [],

	/** List of Classes without a SuperClass. */
	SubClasses : [],
	
	/** Constructor for list of instances. */
	setConstructor : Array,

	subclass : function(options) {
		options.isA = hope.Class;
		return new hope.Class(options);
	},

	/** Identity function for instances of this class.
		Override if you have different equality semantics.
	 */
	equals : function(a,b) {
		return (a === b);
	},
		
	/** Return a unique identifier for an instance.  Side effect: sets instance.__id__ to the identifier.
		If your class defines a 'primaryKey', we'll use that 
			(and it's up to you to make sure that is really unique within all instances!)
		If no primary key, we use a sequence.
	*/
	getIdFor : function(instance) {
		if (instance.__id__) return instance.__id__;
		if (this.primaryKey && instance[this.primaryKey] != null) {
			return (instance.__id__ = ""+instance[this.primaryKey]);
		}
		if (!this.instanceSequence) this.instanceSequence = 0;
		return (instance.__id__ = this.type+this.instanceSequence++);
	},
	
	/** Register an instance in our list of Instances, via instance.__id__.
		Will figure out the id using getIdFor() if not already set.
		Doesn't do any checking to make sure the instance is unique!
	*/
	register : function(instance) {
		if (instance.__id__ == null) this.getIdFor(instance);
		this.Instances[instance.__id__] = instance;
	},
	
	/** UN-register an instance, called automatically when the instance is destroyed. */
	unregister : function(instance) {
		if (instance.__id__) delete this.Instances[instance.__id__];
	},

	/** Find a REGISTERED instance, specified by id or by reference. 
		Use this if, eg, you're updating an object from the server
		and want to see if such an instance already exists.
	*/
	find : function(instance) {
		if (!instance) return undefined;
		if (instance && instance.constructor == this) return instance;
		if (typeof instance == "string") return this.Instances[instance];
		
		var id = this.getIdFor(instance);
		return this.Instances[id];
	},

	/** Find all REGISTERED instances where condtion is true. 
		Returns an instance of this.setConstructor.
		If this.setConstructor.indexBy == "string", adds instances by __id__.
		Else adds as numbers.
	*/
	selectAll : function(condition, _returnFirst) {
		var instances = this.Instances, 
			key, 
			results = new this.setConstructor()
		;
		for (key in instances) {
			var instance = instances[key];
			if (!condition(instance, key)) continue;
			if (_returnFirst) return instance;
			var key = (results.indexBy == "string" ? instance.__id__ : results.length);
			if (results.addItem) 	results.addItem(key, instance);
			else 					results.push(instance);
		}
		return (_returnFirst ? null : results);
	},
	
	/** Find FIRST REGISTERED instance where condition is true. */
	select : function(condition) {
		return this.selectAll(condition);
	},
	
	/** Add to the list of properties that we save for this instance type. */
	addProperties : function(properties) {
		if (!properties) return;
		if (typeof properties === "string") properties = properties.split(hope.Patterns.splitOnCommas);
		this.properties = this.properties.concat(properties);
	},
	
	/** Add to the list of automatic bindings for this instance type. */
	addBindings : function(bindings) {
		if (!bindings) return;
		if (typeof bindings === "string") bindings = bindings.split(hope.Patterns.splitOnCommas);
		this.bindings = this.bindings.concat(bindings);
	},
	
	/** Return a string identifying this Class.
		Note that the resulting string represents a globally accessible pointer to the class, so:
			`eval(hope.SomeClass.toString())` ==> a pointer to the class..
	*/
	toString : function() {
		return "hope."+this.type;
	},


	//
	//	Prototype:  methods and properties common to all instances
	//
	prototype : {
		/** Destroy this instance. 
			Don't put custom logic here, implement "onDestroy" instead.
		*/
		destroy : function() {
			// call the custom 'onDestroy' routine
			//		(hmm, seems like this could be a binding?)
			this.onDestroy();
			
			// tell our observers that we're going away
			this.notify("destroy", this);
		
			// turn off all observations
			this.ignore();
	
			// tell our constructor that we're gone
			this.constructor.unregister(this);
			
			return this;
		},
	
	
		/** Extend this object with a single key/value pair or a set of properties.
			Deals with getters and setters as necessary.
			
			@returns	If called as 	set("x",y)		returns y iff y is different than our current value
						If called as 	set({...})		returns an object with the differences
		 */
		set : function(key, value) {
			if (arguments.length == 1) {
				var deltas = {}, deltasFound = false;
				var properties = arguments[0];
				for (var key in properties) {
					var newValue = this.set(key, properties[key]);
					if (newValue) {
						deltas[key] = newValue;
						deltasFound = true;
					}
				}
				return (deltasFound ? deltas : null);
			} else {
				// get the name of the setter to call
				var setter = SETTERS[key] || getSetter(key);
				if (typeof this[setter] != "function") {
					return this.set_unknown(key, value);
				} else {
					return this[setter](value);
				}
			}
		},
	
	
		/** Set a property for which we don't have a setter. 
			Default is to just set on our main object.
			Override if you need to do something else.
		*/
		set_unknown : function(key, value) {
			var oldValue = this[key];
			if (oldValue != value) {
				this[key] = value;
				if (this.notify) this.notify("changed", value, key);
				return value;
			}
		},
	
	
		/** Return a string identifying this instance. 
		
			Note that if the resulting string represents a globally accessible pointer to the instance, sso:
				`eval(someInstance.toString())` ==> a pointer to the instance
			if the instance has been previously registered.
		*/
		toString : function() {
			if (this == hope.Class.prototype) {
				return "hope.Class.prototype";
			} else if (this == this.constructor.prototype) {
				return this.constructor + ".prototype";
			} else if (this.__id__) {
				return "["+this.constructor+" "+this.__id__+"]";
			} else {
				return "[a "+this.constructor+"]";
			}
		}
		
	} // end hope.Class.prototype
});// end extend(hope.Class)


// list of "setXxx" strings for getting property accessors quickly
var SETTERS = {};
function getSetter(key) {	
	var setter = "set"+key.charAt(0).toUpperCase()+key.substr(1);
	return (SETTERS[key] = setter);
}



/* End hidden from global scope */ })(hope);
