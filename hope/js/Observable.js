

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
		notify : function(event, data, part) {
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
			this.passEvent(event, data, part);
		},
		
		/** Tell our controller, if we have one, to process the event. 
			If you're in an event handler and you want to pass the event, call this.
		*/
		passEvent : function(event, data, part) {
			if (this.controller && this.controller.notify) {
				this.controller.notify(event, data, part);
			}
		},

		// TODO: this is the same as observe?
		setEvent : function(event) {
console.warn("setEvent",event,this);
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




/** Simple event class */
new hope.Class({
	name : "Event",
	prototype : {
		event : undefined,		// name of the event
		part : undefined,		// part of the target
		target : undefined,		// target for the event
		data : undefined,		// data for the event
		
		language : undefined,	// language for the event
		value : undefined		// script of the event, as text
	}
});
hope.xml.register("on", hope.Event);

