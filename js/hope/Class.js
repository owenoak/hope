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
	TODO:	- resurrect class.identifierName 
				- pull it from properties before assigning guid
				- still do class + legalize(it)
				- make sure it's unique
			- instead of always creating the same constructor, 
				make a clone of our superclass's constructor so we always dupe it?

			- construction and mixin should *maybe* use proto.set?
				- pass in "CONSTRUCTING" flag so we don't use set_unknown?
				- proto.set is not handing set_ or get_ routines
					

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
	@param [options.plural]					Plural of the type.  Will be type+"s" if not defined.
	@param [options.constructor]			Constructor function -- one will be created if not defind.
											NOTE: your constructor MUST call this.initialze()!
	@param [options.autoRegister]			If true, we will collect instances.  Default is false.
	@param [options.isA|isAn]				Name or pointer to super class.  (case insensitive)
	@param [options.mixin[s]]				Mixins to apply.  ("mixin" and "mixins" both work)
	@param [options.prototype]				Simple object of properties and methods to install on the class prototype.
											NOTE: these will run through set!
	@param [options.classDefaults]			Simple object of properties and methods to install on the class itself.
	@param [options.setConstructor]			Name of constructor to use to create sets of instances
											(up to instance methods to use this).
	@param [options.equals]					function(this, that) -- returns true if both items are semantically equal.
	@param [options.initialize]				Method to call to set up the class (after everything else is done).
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
	if (Super == null) Super = hope.Class;
	else if (typeof Super == "string") {
		Super = Super.toLowerCase();
		if (typeof hope[Super] != "function") {
			throw TypeError("Super '"+Super+"' not found");	
		}
		Super = hope[Super];
	}

	// if they gave us a constructor, use that
	if (options.hasOwnProperty("constructor")) {
		constructor = options.constructor;
	}
	// make a constructor function
	else {
		constructor = function ClassConstructor(properties) {
			// if hope.SKIP is passed, we're creating a prototype for a subclass -- bail immediately.
			if (arguments[0] == hope.SKIP) return;
	
			// generate an identifier for the thing which is guaranteed to be unique within the page
			this.identifier = constructor.type + constructor.instanceCount++;
			if (autoRegister) constructor.register(this);
			
			// extend the instance with all arguments passed in
			if (properties) {
				// don't fire notifications while constructing
				this.suspendNotifications();
				// after this, properties will be the unique properties actually set on this object
				properties = this.set(properties);
				this.resumeNotifications();
			}
	
			// call the initialize routine with the property deltas
			this.initialize(properties);
		}
	}

	//
	// set up the constructor
	//
	
	// add all properties/methods from the Super
	hope.extend(constructor, Super);

	// set up the subclass -> Super relationship
	Super.SubClasses.push(constructor);
	constructor.Super = Super;


	// give the constructor a list to hold its subclasses
	constructor.SubClasses = [];

	// for knowing when we're dealing with classes
	constructor.type = type;
	constructor.instanceCount = 0;
	constructor.plural = plural;


	//
	// set up the collection of instances
	//
	
	// the actual collection is the same for both paths
	constructor.Instances = {};
	constructor.InstanceCount = 0;

	// register the collection as hope[<plural>]
	hope[plural] = constructor.Instances;
	constructor.Instances.toString = function(){return "hope."+plural };

	// set up list of properties (things we save)
	constructor.addProperties(options.properties);
	// set up auto-bindings
	constructor.addBindings(options.bindings);

	// return true if two instances (or an instance and a set of properties) are equal
	if (options.equals) constructor.equals = options.equals;

	// constructor for sets of items of the class.
	if (options.setConstructor) constructor.setConstructor = options.setConstructor;

	//
	// set up the constructor's prototype
	//

	// create the new instance of the superclass's prototype, skipping the init routine
	// this will automatically pick up all Super defaults
	prototype = constructor.prototype = new Super(hope.SKIP);
	prototype.constructor = constructor;
	prototype.classType = type;
	//
	//	apply mixins
	//

	// if the prototype specifies any mixins, do that now BEFORE assigning other properties
	var mixins = options.mixins || options.mixin;
	if (mixins) hope.Mixin.mixinListTo(mixins, constructor);


	//
	//	add any defaults passed in to class and prototype
	//

	// add defaults passed in to the class
	if (options.classDefaults) hope.extend(constructor, options.classDefaults);

	// add prototype defaults passed in to the prototype
	if (options.prototype) {
		// NOTE: this goes through "set" so we'll use any custom setters
		prototype.set(options.prototype);
//		hope.extend(hope.IGNORE, prototype, options.prototype);
	}

	//
	//	registration
	//	
	
	// register the constructor in the list of Things
	hope.registerThing(type, constructor);

	// call the initialize routine if defined
	if (options.initialize) options.initialize.apply(constructor);

	return constructor;
});	// end hope.registerThing("Class")


//
// Methods and properties common to all Classes (the constructors, NOT the prototypes).
//
hope.extend(hope.IGNORE, hope.Class, {
	type : "Class",
	
	// note that we're both a Class and a Thing
	isAClass : true,

	/** List of properies we'll save for this class. */
	properties : [],

	/** List of static bindings. */
	bindings : [],

	/** List of Classes without a SuperClass. */
	SubClasses : [],

	
	/** Find a registered instance, specified by id or as an object.
		If an object, we use the constructor.equals() to compare -
			note that this will iterate through all registered instances
			so it could be quite slow.
	*/
	find : function(instance) {
		if (!instance) return undefined;
		if (instance && instance.constructor == this) return instance;
		
		if (typeof instance == "string") return this.Instances[instance];
		if (instance.identifier) return this.Instances[identifier];
		
		// if we have no 'equals' function, that's all we can do
		if (!this.equals) return undefined;
		
		var instances = this.Instances;
		for (var key in instances) {
			if (this.equals(instances[key], instance)) return instances[key];
		}
	},

	/** Register an instance in our list of Instances. */
	register : function(instance) {
		if (!instance) return;
		var id = instance.identifier,
			number = parseInt(id.substring(this.type.length))
		;
		this.Instances[id] = instance;
		this.Instances[number] = instance;
		return id;
	},
	
	/** UN-register an instance, called automatically when the instance is destroyed. */
	unregister : function(instance) {
		var id = instance.identifier,
			number = parseInt(id.substring(this.type.length))
		;
		delete this.Instances[id];
		this.Instances[number] = null;
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
	}
});


// list of "setXxx" strings for getting property accessors quickly
var SETTERS = {};
function getSetter(key) {	
	var setter = "set"+key.charAt(0).toUpperCase()+key.substr(1);
	return (SETTERS[key] = setter);
}




// Methods and properties common to all class instances.
hope.Class.prototype = {

	//
	//	create/destroy/update semantics
	//


	/** Do any initialization particular to your subclass. 
		Default implementation:
			- adds any properties passed in to the instance,
			- registers us with our constructor
			- and notifys 'onCreate'
	*/
	initialize : function(properties) {},

	/** Destroy this instance. 
		Default is to call "onDestroy" on observers.
	*/
	destroy : function() {
		// tell our observers that we're going away
		this.notify("onDestroy", this);
	
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
		var _extend = hope._extend;
		
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
				this.set_unknown(key, value);
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
			if (this.notify) this.notify("changed."+key, value);
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
		} else if (this.identifier) {
			return this.constructor.Instances + "." + this.identifier;
		} else {
			return "[a "+this.constructor+"]";
		}
	}
	
} // end hope.Class.prototype




//
//
//	Mixins
//
//


function Mixin(options) {
	var name = options.name;
	// make sure they provided a name and it is not already defined
	if (!name) throw new nameError("Must provide a mixin.name")
	if (hope.Things[name.toLowerCase()]) throw new TypeError("Thing named '"+name+"' already exists");

	// add all of the options to us
	hope.extend(hope.IGNORE, this, options);

	// how's that for a tongue twister!
	var mixins = this.mixins || this.mixin;
	if (mixins) hope.Mixin.mixinListToMixin(mixins, this);
	
	// register it as something we can find globally
	hope.registerThing(name, this);
}
hope.registerThing("Mixin", Mixin);

hope.Mixin.mixinListTo = function(mixins, constructor) {
	if (typeof mixins == "string") mixins = mixins.split(hope.Patterns.splitOnCommas);
	var mixin;
	while (mixin = mixins.shift()) {
		mixin = hope.getThing(mixin, "mixin "+mixin+" not found");
		mixin.mixinTo(constructor);
	}
}

hope.Mixin.mixinListToMixin = function(mixins, originalMixin) {
	if (typeof mixins == "string") mixins = mixins.split(hope.Patterns.splitOnCommas);
	var mixin;
	while (mixin = mixins.shift()) {
		mixin = hope.getThing(mixin, "mixin "+mixin+" not found");
		mixin.mixinToMixin(originalMixin);
	}
}


/** Convert a simple object or two into a named mixin. */
hope.Mixin.fromObject = function(name, protoProperties, classDefaults) {
	var mixin = new hope.Mixin({
			name		: name, 
			prototype	: protoProperties,
			classDefaults : classDefaults
		});
}

hope.Mixin.prototype = {
	isAMixin : true,
	
	overwrite : hope.OVERWRITE,
	
	
	/** Mix this mixin into a constructor. */
	mixinTo : function(constructor, overwrite) {
		if (!constructor) return;
		// default to overwrite declared on the mixin
		if (overwrite == null) overwrite = this.overwrite;

		// apply mixin.constructor properties to the constructor
		if (this.classDefaults) hope.extend(overwrite, constructor, this.classDefaults);
		if (this.all)		  hope.extend(overwrite, constructor, this.all);
		
		// apply mixin.prototype properties to the proto
		// if we're not dealing with a constructor, apply prototype methods to the constructor
		var proto = (constructor.prototype || constructor);
		if (this.prototype) {
// NOTE: not doing proto.set so that we don't run afowl of the set_unknown -- is this OK?
//			if (proto.set) 	proto.set(this.prototype);
//			else			
			hope.extend(overwrite, proto, this.prototype);
		}
		if (this.all && proto != constructor) {
// NOTE: not doing proto.set so that we don't run afowl of the set_unknown -- is this OK?
//			if (proto.set) 	proto.set(this.all);
//			else			
			hope.extend(overwrite, proto, this.all);
		}
		
		// apply mixin 'properties' and 'bindings' lists to the constructor
		if (this.properties && constructor.addProperties) constructor.addProperties(this.properties);
		if (this.bindings && constructor.addBindings) constructor.addBindings(this.bindings);
	},
	
	/** Mix this mixin into another mixin.  Slightly different semantics. */
	mixinToMixin : function(mixin) {
		var overwrite = hope.IGNORE;	// ignore getters and setters!

		if (this.classDefaults) {
			if (mixin.classDefaults) 	hope.extend(overwrite, mixin.classDefaults, this.classDefaults);
			else						mixin.classDefaults = this.classDefaults;
		}

		if (this.prototype) {
			if (mixin.prototype) 	hope.extend(overwrite, mixin.prototype, this.prototype);
			else					mixin.prototype = this.prototype;
		}

		if (this.all) {
			if (mixin.all) 			hope.extend(overwrite, mixin.all, this.all);
			else					mixin.all = this.all;
		}

		if (this.properties) {
			mixin.properties = (mixin.properties || []).concat(this.properties);
		}

		if (this.bindings) {
			mixin.bindings = (mixin.bindings || []).concat(this.bindings);
		}
	}
};



// create the cacheable mixin
new hope.Mixin({
	name : "Cacheable",
	all : {
		/** Get/set/clear value in the cache. 
			
			Convention: Name groups related values as "a.b", "a.c", "a.d" etc.
			
			If key is defined but value is not defined, returns cache[key]
			If key and value are both defined, sets that key in the cache
			if key is hope.CLEAR, clears the entire cache and returns `this`
			if key is anthing else and value is hope.CLEAR:
				- if key ends with ".", clears the 'group' in the cache that starts with the key
				- otherwise just clears the value under that key
				- either way, after clearing, returns `this` so you can chain
		*/
		cache : function(key, value) {
			if (key === hope.CLEAR) {
				delete this.__cache; 
				return this;
			}
			var cache = this.__cache;
			if (value != hope.CLEAR) {
				// if no value, return the cache entry
				if (value == null) return (cache ? cache[key] : undefined);
				// otherwise return the value from the cache
				return (cache || (this.__cache = {}))[key] = value;
			}
			// otherwise we'll be clearing
			if (cache) {
				var length = key.length;
				// if key ends with a dot, clear everyti
				if (key.charAt(length-1) == ".") {
					for (var nextKey in cache) {
						if (nextKey.substr(0,length) === key) delete cache[nextKey];
					}
				} else {
					delete cache[key];
				}
			}
			return this;
		}
	}
});


// make Classes and their prototypes cacheable
hope.Cacheable.mixinTo(hope.Class);

// TODO:
//	- if the observed thing has a container, forward the message up the line?
//		- this means we can't short-curcuit the notify() process as quickly (and it's already a loop)
//		- pass manually ala HC?  that could work.
//		- remove the dotted notifications?
//
//	NOTE: observations will fire out of order!  Enqueue immediately!

/**  Create an Observable mixin.
	 Note that this uses the __cache convention from Cacheable directly for speed.
	 Also note that you can just mixin Observable and you get Cacheable for free.
*/
new hope.Mixin ({
	name :"Observable",
	mixins : "Cacheable",
	all : {

		/** Observe an event on this object. 
		
			Note that whenever the list of observers changes,
			we create an entirely new array.  This way we can keep track of the list
			of observers that occured whenever each notify() event is called,
			even though we don't actually notify immediately.
			
			Note that you don't need to bind the callback and target together!
			
			Call signature of callback is:
				callback.apply(target, [data1, data2, data3, observed, this]);
		
		*/
		observe : function(event, callback, target) {
			var cache = (this.__cache || (this.__cache = {})),
				observers = (cache.observers || (cache.observers = {}))
			;
			observers[event] = (observers[event] || []).concat([{callback:callback, target:target}]);
		},
		
		/** Ignore events under a certain name for this target.
			If target is null, ignores all events under that name.
		*/
		ignore : function(event, target) {
			if (!this.__cache 
				|| !this.__cache.observers 
				|| !this.__cache.observers[event]) return;

			if (target == null) {
				this.__cache.observers[event] = [];
			}
			var observersForEvent = this.__cache.observers[event],
				newList = [], 
				index = 0, 
				observation;
			while (observation = observersForEvent[index++]) {
				if (observation[1] != target) newList.push(observation);
			}
			this.__cache.observers[event] = newList;
		},

		/** Notify observers that something has happened. 
			Note that you can pass up to 3 data parameters to the notification,
			which will be passed to the 
		*/
		notify : function(event, data1, data2, data3) {
			var cache = this.__cache;
			// if nobody's looking, forget it!
			if (!cache || cache.suspend || !cache.observers) return;

			
			var observers, args;
			
			// events are segmented, eg:
			//		changed.list
			// and someone may just be observing "changed", 
			//	so we need to enqueue events for each segment of the event
			while (true) {
				// Remember the exact list of observers as it stands RIGHT NOW.
				//	We're guaranteed that whenever the observers change,
				//	we'll get a different list.
				observers = cache.observers[event];
				if (observers) {
					// queue == things that are waiting to be dispatched
					// if we don't have a queue
					if (!cache.queue) {
						// make one
						cache.queue = [];
						// and stick us in the masterQueue, so we'll get called later
						hope.Observable.enqueue(this);
					}
					// arguments exactly as they are passed into the notification callback
					args = [data1, data2, data3, this, event];
					// note that we pass two items for each notification
					cache.queue[cache.queue.length] = [data1, data2, data3, this, event];
					cache.queue[cache.queue.length] = observers;
				}
			
				var dot = event.lastIndexOf(".");
				if (dot == -1) break;
				event = event.substr(0, dot);
			}
		},
		
		/** Temporarily skip all notifications (eg: because we're constructing). 
			Note: this maintains a counter, so calls must be balanced.

			TODO: we could put ourselves in the masterQueue to make sure that we get turned back on?
		*/
		suspendNotifications : function() {
			var cache = (this.__cache || (this.__cache = {}));
			if (cache.suspended) 	cache.suspended++;
			else					cache.suspended = 1;
		},	

		/** Resume suspended notifications, handling any queued items immediately. */
		resumeNotifications : function() {
			var cache = (this.__cache || (this.__cache = {}));
			if (cache.suspended) 	cache.suspended--;
		}
	}
});


// static methods to make an obvservable queue
hope.extend(hope.Observable, {
	/** Queue of objects awaiting actual notification. 
		Added to by enqueue, removed by notify.
	*/
	MasterQueue : [],
	
	
	/** Amount of time in milliseconds between queue events. */
	processInterval : 100,	

	/** If paused is true, we will not restart the process timer AFTER the next cycle finishes. */
	paused : false,


	/** Add an object with pending notifications to the queue, to be called "soon". */
	enqueue : function(target) {
		this.Queue.push(target);
	},
	
	/** Time to process! Note: this function is called anonymously. */
	processMasterQueue : function() {
		var my = hope.Observable, 
			masterQueue = my.MasterQueue, 
			masterIndex = 0, 
			observed, 
			observedQueue
		;
		try {
			// TODO: convert to a for-loop for speed?
			while (observed = masterQueue[masterIndex++]) {
				var queue = (observed.__cache ? observed.__cache.queue : null);
				if (!queue) continue;
				// clear the observed queue immediately so it will create another new one later
				delete observed.__cache.queue;
				my.processObservationQueue(queue);
			}
		} catch (error) {
			// if we get an error, just stop for now
			// Note that any notifications in the queue after the error will get dropped!
			hope.error("Error executing Observable queue:",error);
		}
		// chop of anything we've already processed
		my.MasterQueue = masterQueue.slice(masterIndex);
		
		// and restart the queue if we're not paused
		if (my.paused != true) setTimeout(my.processMasterQueue, my.processInterval);
	},
	
	/** Process a single queue from an observed object. */
	processObservationQueue : function (queue) {
		// The queue is composed of tuples:
		//		[args, observers, args, observers, ...]
		// where
		//		args == arguments exactly as they should be passed to the callback
		//		observers = [ {callback,target}, {callback,target}, ...]
		
		var notification, queueIndex = 0,
			observers, observersIndex, observation
		;
		while (args = queue[queueIndex++]) {
			observers = queue[queueIndex++];
			observersIndex = 0;
			while (observation = notification.observers[observersIndex++]) {
				observation.callback.apply(observation.target, args);
			}
		}
	}

});
// kick the notification cycle off.
hope.Observable.processMasterQueue();


// make all classes and class instances observable
hope.Observable.mixinTo(hope.Class);



/* End hidden from global scope */ })(hope);
