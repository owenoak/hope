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
	@param [options.autoRegister]			If true, we will collect instances.  Default is false.
	@param [options.registry]				Object which holds instances.  
											If registry is not defined but is set on Super, we will use that.
											If not defined at all, one will be created.
	@param [options.primaryKey]				If supplied, name of a property on each instance that is unique
											for all instances that can ever be created (like a database primary key).
											Note -- it is up to you to ensure this uniqueness!
	@param [options.equals]					function(this, that) -- returns true if both items are semantically equal.
	@param [options.caches]					If true, we create a unique cache for each object when created.
											This cache will be based on its prototype's cache.
											(If you use a custom constructor, you have to do this on your own).
	@param [options.cache]					Prototype cache for the class.  Will be merged with super proto.
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
	var caches = (options.caches !== undefined ? options.caches : Super.caches),
		cache, 
		cacheCloner
	;
	if (caches) {
		cachePrototype = options.cache || {};
		cacheCloner = function(props){};
		if (Super.caches) cachePrototype = hope.protoClone(Super.prototype.cache, cachePrototype);
		cacheCloner.prototype = cachePrototype;
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
	
			// clone the prototype's cache if we're caching
			if (cacheCloner) this.cache = new cacheCloner();
			
			// extend the instance with properties passed in
			// after this, properties will be the unique properties actually set on this object
			if (properties) properties = this.set(properties);

			// auto-register the instance
			// NOTE: this could present problems if any set() methods are dependent on instance.identity...
			if (autoRegister) constructor.register(this);
	
			// call the onCreate routine with the property deltas
			this.onCreate(properties);
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

	// remember if we cache
	constructor.caches = caches;


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
	
	// the actual collection is the same for both paths
	var registry = options.registry || Super.Registry;
	if (registry) {
		constructor.Instances = constructor.Registry = registry;
	} else {
		constructor.Instances = {};
	}
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
	prototype.constructor = constructor;
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

	
		/** Identity function for instances of this class.
			Override if you have different equality semantics.
		 */
		equals : function(a,b) {
			return (a === b);
		},
		
	
		//
		//	create/destroy/update semantics
		//
	
		/** Do any initialization particular to your subclass. 
			Default implementation:
				- adds any properties passed in to the instance,
				- registers us with our constructor
				- and notifys 'onCreate'
		*/
		onCreate : function(properties) {},
	
		/** Do any custom destruction stuff particular to your subclass. */
		onDestroy : function(properties) {},
	
	
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
				return "["+this.__id__+"]";
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



//
//
//	Mixins
//
//
/**
	Mixin constructor.
	
	@param options.name						Name for the class.
	@param [options.statics]				Properties to mixin to the constructor.
	@param [options.prototype]				Properties to mixin to the prototype.
	@param [options.all]					Properties to mixin to the both prototype and constructor.
	@param [options.properties]				Array of names of instance properties to save (in addition to those of superclass).
	@param [options.bindings]				Array of instance bindings (in addition to those of superclass).
	@param [options.mixinTo]				Custom function to mix this mixin into an object.
	@param [options.onMixin]				Function to run AFTER being mixinTo()d an object.
*/
function Mixin(options) {
	var name = options.name;
	// make sure they provided a name and it is not already defined
	if (!name) throw new nameError("Must provide a mixin.name")
	if (hope.Things[name.toLowerCase()]) throw new TypeError("Thing named '"+name+"' already exists");

	// add all of the options to us
	hope.extend(this, options);
	
	// if we have an 'all' property, merge it with 'prototype' and 'statics'
	if (this.all) {
		if (!this.prototype) this.prototype = {};
		if (!this.statics) this.statics = {};
		hope.merge(this.prototype, this.all);
		hope.merge(this.statics, this.all);
		delete this.all;
	}

	// how's that for a tongue twister!
	var mixins = this.mixins || this.mixin;
	if (mixins) hope.Mixin.mixinTo(this, mixins);
	
	// register it as something we can find globally
	hope.registerThing(name, this);
}
hope.registerThing("Mixin", Mixin);


hope.extend(hope.Mixin, {

	/** Mix one-or more mixins into something.
		Mixins is:
			- a Mixin or an array of Mixins
			- string name of a mixin, or a list of names separated by commas
	*/
	mixinTo : function(it, mixins) {
		if (mixins.isAMixin) mixins = [mixins];
		else if (typeof mixins == "string") mixins = mixins.split(hope.Patterns.splitOnCommas);
		var mixin, i = 0;
		while (mixin = mixins[i++]) {
			mixin = hope.getThing(mixin);
			mixin.mixinTo(it);
		}
	},
	
	
	/** Convert a simple object or two into a named mixin. */
	fromObject : function(name, prototype, statics, all) {
		var mixin = new hope.Mixin({
				name		: name, 
				prototype	: prototype,
				statics 	: statics,
				all 		: all
			});
	},
	
	prototype : {
		isAMixin : true,
		
		/** Default behavior is to overwrite properties on the destination.
			Set to hope.MERGE to NOT overwrite.
		*/
		overwrite : hope.OVERWRITE,
		
		/** Mix this mixin into something (either a constructor or a Mixin). */
		mixinTo : function(it, overwrite) {
			if (!it) return;
			
			// mixing in to another mixin is different than mixing in to a class
			if (it.isAMixin) {
				if (this.statics) 		it.statics = hope.extend(it.statics||{}, this.statics);
				if (this.prototype) 	it.prototype = hope.extend(it.prototype||{}, this.prototype);
				if (this.properties) 	it.properties = (it.properties || []).concat(this.properties);
				if (this.bindings) 		it.bindings = (it.bindings || []).concat(this.bindings);
			
			}
			// constructor or simple object
			else {
				// default to overwrite declared on the mixin
				if (overwrite == null) overwrite = this.overwrite;
				if (this.statics) hope.mixin(overwrite, it, this.statics);
				if (this.prototype && it.prototype) hope.mixin(overwrite, it.prototype, this.prototype);
			}

			// apply mixin 'properties' and 'bindings' lists to it
			if (this.properties && it.addProperties) it.addProperties(this.properties);
			if (this.bindings && it.addBindings) it.addBindings(this.bindings);
			
			// call onMixin handler if defined
			if (this.onMixin) this.onMixin(it);
			
			// TODO: notify?
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
		}
		
	}
});



/** TimedQueue -- TODO: NAME? DOC?
	Push things into its queue (via queue.add) and they will be executed after a little while.
*/
new hope.Class({
	name : "TimedQueue",
	prototype : {
	
		/** Queue of things to execute. */
		queue : null,

		/** Add one or more things to the queue. */
		add : function() {
			this.queue.push.apply(this.queue, arguments);
		},

		/** Method to execute (anonymously) when the interval completes. */
		execute : undefined,

		/** Amount of time in SECONDS between queue events. */
		delay : .1,
		
		/** If paused is true, we will not restart the process timer AFTER the next cycle finishes. 
			Manage paused with hope.Observable.stop() and hope.Observable.start()
		*/
		paused : false,
	
		/** Stop and start the queue.
			Note that we keep the queue running, but it has no effect if it is paused. 
		*/
		stop : function()  {  this.paused = true;	},
		start : function() {  this.paused = false;	},
	
		/** Start the queue when we create the object. */
		onCreate : function() {
			if (!this.execute) throw "TimedQueue MUST provide an execute() handler.";

			this.queue = [];
			
			// interval function, calls queue.execute() if not paused
			var queue = this;
			function execute() {
				if (!queue.paused) queue.execute();
			}
			this._interval = setInterval(execute, this.delay * 1000);
		}
	}
});


//	- if the observed thing has a container, forward the message up the line?
//		- this means we can't short-curcuit the notify() process as quickly (and it's already a loop)
//		- pass manually ala HC?  that could work.
//		- remove the dotted notifications?
//

/**  Create an Observable mixin.
	 Note that this uses the __cache convention from Cacheable directly for speed.
	 Also note that you can just mixin Observable and you get Cacheable for free.

*/
new hope.Mixin ({
	name :"Observable",
	all : {

		/** We only do notifying if this is true.
			Defaults to false for efficiency -- set to true in your class constructor
			or instance to turn notifying on.
			Note that we still process observe/ignore, so you can set notifying to false
			to temporarily turn notification off.
		*/
		notifying : false,

		/** Observe an event on this object. 
		
			Note that whenever the list of observers changes,
			we create an entirely new array.  This way we can keep track of the list
			of observers that occured whenever each notify() event is called,
			even though we don't actually notify immediately.
			
			Note that you don't need to bind the callback and target together!
			
			observation is an object with:
				event		eg: "onDone", "onMouseUp"
				callback	method to execute		
				[target]	who to send the notification to (default is global)
				[part]		if set, we will only send the notification if 
								the notify.part == part  (???)
				
			Call signature of callback is:
				callback.apply(target, [data, part, observed]);
		
		*/
		observe : function(observation) {
			var observations = this.observations || (this.observations = {});
			// make a unique new array each time 
			observations[event] = (observations[event] || []).concat(observation);
		},
		
		/** Ignore events under a certain name for this target.
			If target is null, ignores all events under that name.
		*/
		ignore : function(event, target) {
			var observations = (this.observations ? this.observations[event] : null);
			if (observations) return;

			var newList = [];
			if (target != null) {
				var index = 0, observation;
				while (observation = observations[index++]) {
					if (observation.target != target) newList.push(observation);
				}
			}
			if (newList.length) {
				this.observations[event] = newList;
			} else {
				delete this.observations[event];
			}
		},

		/** Notify observers that something has happened. 

			If this object has a method with the same name as the event, 
			that will ALWAYS be called.
			
			If this object has notifying == true,
				- we will execute any notifications on this object for that event
				- if we don't have any notifications for the event and we have a controller
					we will call notify() recursively on our controller

			event = "onDone", "onMouseUp", etc --- case sensitive
			Note that you can pass up to 3 data parameters to notify,
			which will be passed to the notification.
		*/
		notify : function(event, data, part, target) {
			if (!target) target = this;
			var args = hope.args(1);
			
			// if we have a method with the event name, call that now
			if (typeof this[event] == "function") this[event].apply(this, args);
			
			// if notifying is off, bail.
			if (this.notifying) {
				// Get the list of observations as it stands right now.
				//	We're guaranteed that whenever the observations change, we'll get a different list.
				var observations = (this.observations ? this.observations[event] : null);
				if (observations) {
					hope.ObservationQueue.enqueue(observations, args);
					return;
				}
			}
			
			// if we did not intercept the notification, pass it to our controller
			this.passEvent(event, data, part, target);
		},
		
		/** Tell our controller, if we have one, to process the event. 
			If you're in an event handler and you want to pass the event, call this.
		*/
		passEvent : function(event, data, part, target) {
			if (this.controller && this.controller.notify) {
				this.controller.notify(event, data, part, target);
			}
		}
	}
});

/** Set up the Observable's MasterQueue, which will actually proces events. */
hope.ObservationQueue = new hope.TimedQueue({
	delay : .1,
	stopAfter : 20,
	execute : function() {
		var queue = this.queue, 
			queueIndex = 0, 
			observations,
			observationsIndex,
			args,
			completed = 0,
			stopAfter = this.stopAfter,
			result
		;
		try {
			while (observations = queue[queueIndex++]) {
				args = queue[queueIndex++];
				observationsIndex = 0;
				while (observation = observations[observationsIndex++]) {
					// if the observation specifies a part, and the args's part is not the same, skip it
					if (observation.part != null && observation.part != args[1]) continue;

					// actually make the callback			
					result = observation.callback.apply(observation.target, args);

					// if we get a STOP signal, skip the rest
					if (result == hope.STOP) break;
				}
				if (++completed > this.stopAfter) break;
			}
		} catch (error) {
			// if we get an error, just stop for now
			// Note that any observations in the observations list after the error will get dropped!
			hope.error("Error executing Observable queue:",error," observation:", observation);
		}
		// chop off anything we've already processed
		this.queue = queue.slice(queueIndex);
	}
});



// make all classes and class instances observable
hope.Observable.mixinTo(hope.Class);



/* End hidden from global scope */ })(hope);
