

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

		// eventMap is map of event name -> bubbles
		eventMap : {
			create : false,
			destroy : false,
			changed : false
		},

		// extend our eventMap with events in the map passed in
		setEvents : function(map) {
			this.eventMap = hope.protoClone(this.eventMap || {});
			for (var key in map) {
				this.eventMap[key.toLowerCase()] = map[key];
			}
		},

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
			
			event:		eg: "done", "mouseup", "loaded"
			observation is an object with:
				callback	method to execute, or name of method on target to execute
				[target]	who to send the notification to (default is this object)
				[part]		if set, we will only send the notification if 
								the observation.part == part  in the notify call
				
			Call signature of callback is:
				callback.apply(target, [data, observed, part]);
		
		*/
		observe : function(event, observation, when) {
			event = event.toLowerCase();
			// handle observation passed as a function
			if (typeof observation == "function") {
				observation = {callback:observation};
			}
			if (when === hope.ONCE) observation.once = true;
			// make our observations object a clone of our prototype's
			var observations = (this.hasOwnProperty("observations") 
									? this.observations 
									: this.observations = hope.protoClone(this.constructor.prototype.observations || {})
							   );
			var newList = (when == hope.BEFORE 
							? [observation].concat(observations[event] || [])
							: (observations[event] || []).concat(observation)
						  );
			// make a unique new array each time, so we pick up prototype observations
			observations[event] = newList;
			return this;
		},
		
		observeOnce : function(event, observation) {
			return this.observe(event, observation, hope.ONCE);
		},
		
		/** Ignore certain events for the target.
			If target is null, ignores all events under that name registered directly on this object.
		*/
		ignore : function(event, target) {
			event = event.toLowerCase();

			var observations = (this.observations ? this.observations[event] : null);
			if (!observations) return this;

			if (target == null) {
				this.observations[event] = this.constructor.prototype.observations[event];
			} else {
				var newList = [], index = 0, observation;
				while (observation = observations[index++]) {
					if (observation.target !== target) newList.push(observation);
				}
				if (newList.length) {
					this.observations[event] = newList;
				} else {
					delete this.observations[event];
				}
			}
			return this;
		},

		/** Notify observers that something has happened. 

			event = "done", "mouseup", etc --- case IN sensitive
			Note that you can pass up to 3 data parameters to notify,
			which will be passed to the notification.
		*/
		notify : function(event, data, part) {
			event = event.toLowerCase();
			var observations = (this.observations ? this.observations[event] : null);
			if (!observations) {
				// figure out if we should bubble the event (default is NO)
				var bubble = (this.controller && this.eventMap[event] == true);
				if (bubble) this.passEvent(event, data, part);
				return this;
			}
			
			// fire the observers for the event
			var i = 0, observation;
			while (observation = observations[i++]) {
				// skip observations that do not specify the correct part
				if (observation.part != part) continue;
// TODO: remove the event if once is true				
				var target = observation.target || this;
				var callback = observation.callback;
				if (typeof callback == "string") callback = target[callback];
				if (typeof callback == "function") {
					callback.call(target, data, this, part);
				} else {
					hope.warn(this,"notify(",event,"): couldn't find callback for observation :", observation);
				}
			}
			return this;
		},
		
		/** Tell our controller, if we have one, to process the event. 
			If you're in an event handler and you want to pass the event, call this.
		*/
		passEvent : function(event, data, part) {
			if (this.controller && this.controller.notify) {
				this.controller.notify(event, data, part);
			}
			return this;
		}
	}
});

// make all classes and class instances observable
hope.Observable.mixinTo(hope.Class);


// Simple observation constructor for XML parsing
hope.Observation = function Observation(name, props) {
	this.event = name;
	if (props) {
		for (var key in props) this[key] = props[key];
	}
}
hope.Observation.prototype = {
	isAnObservation : true
}

