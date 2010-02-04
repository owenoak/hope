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
