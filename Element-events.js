/*** Element event management ***/

Script.require("{{hope}}Element.js", function(){

	// debug events
	Event.debug = hope.debug("Events");
	Event.showEvents = hope.debug("showEvents");


	hope.extend(Event.prototype, {
		//
		//	`event.stop()` does both stopPropagation and preventDefault().
		//
		stop : function stop() {
			this.preventDefault();
			this.stopPropagation();
		},
	
		// return the first changedTouches object (for gesture event handling)
		//	on desktops, returns the element itself
		//	maps correctly for desktops
		touch : Getter(function() {
				return (this.changedTouches ? this.changedTouches[0] : this);
			}
		),
		
		// Return the event's x-coordinate in terms of an element's offsetParent.
		elementX : function(target) {
			if (!target) target = event.target;
			return (this.touch.pageX - target.pageLeft);
		},
		
		// Return the event's y-coordinate in terms of an element's offsetParent.
		elementY : function(target) {
			if (!target) target = event.target;
			return (this.touch.pageY - target.pageTop);
		}
	});




	// Static method to prevent event default behavior.
	//	You can pass this to an event handler to turn that event off.
	Event.preventDefault = function(event) {
		event.preventDefault();
	}
	



	// quick and dirty keymap
	//	NOTE: to catch special keys (like escape, backspace, return, etc) trap onkeyDOWN
	//		TODO: are these correct cross-browser?s
	Event.KEYS = {
		"return"	: 13,
		"escape"	: 27,
		"space"		: 32
	};



	//
	//	observation and event handling
	//

	// this single, static method is what's actually stuck on the element as an event handlers
	function _eventHandler(event) {
		// "this" is the element in question
		return _fireEvent(this, event, arguments);
	}
	
	function _fireEvent(element, event, args) {
//console.warn("_fireEvent",element, event, args);
		var eventType = (typeof event === "string" ? event : event.type),
			eventName = "on" + eventType.capitalize()
		;
		
		// get a pointer to the stored methods to execute

		//DEBUG: this was throwing an error occasionally in FF -- looks like a race condition
		//NOTE:  the try...catch is actually pretty slow...
		try {
			var methods = element.data[eventName];
		} catch (e) { 
			console.error(element, event, args); 
		}
		// if we're not actually observing that event, but we DO have a method with the eventName
		//	call that (???)
		if (!methods) {
			if (typeof element[eventName] === "function") {
				return !!(element[eventName].apply(element, args));
			}
			return true;
		}

		var i = -1, method, returnVal = true, removedAny;
		while (method = methods[++i]) {
			if (typeof method === "string") {
				if (!element[method]) continue;
				returnVal = element[method].apply(element, args) & returnVal;			
			} else {
				returnVal = method.apply(element, args) & returnVal;
				// if method is signalled to fire only once, remove it from the list
				if (method.__once__) {
					removedAny = true;
					methods.splice(i--, 1);				
				}
			}
		}
		if (removedAny) _cleanupAfterRemove(element, eventType);
		return !!returnVal;
	}
	
	// cleanup the element after removing an event
	function _cleanupAfterRemove(element, eventType) {
		var data = element.data,
			eventName = "on" + eventType.capitalize()
			methods = data[eventName]
		;
		if (methods && methods.length === 0) {
			// remove the event listener
			element.removeEventListener(eventType, _eventHandler, false);

			// remove the list of events from our data object
			delete data[eventName];

			// remove the event from the list of events
			data.events = (data.events ? data.events.remove(eventType) : null);
			if (Event.showEvents && element.attr) element.attr("_events", data.events.join(","));
		}
	 
	}
	
	function _observe(element, eventType, handler, scope, args, options) {
//console.warn(element, eventType, handler, scope, args, options);
		// if a single object argument, treat as a map of handlers
		if (typeof eventType === "object") {
			var events = eventType;
			if (events.args) args = events.args;
			if (events.scope) scope = events.scope;
			if (events.options) options = events.options;
			var handlers = [];
			for (var type in events) {
				if (type === "scope" || type == "args" || type == "options") continue;
				_observe(element, type, events[type], scope, args, options);
			}
			return handlers;
		} else {
			if (!handler) handler = "on" + eventType.capitalize();

			// IMMEDIATE events are those that should fire immediately for this browser
			//	(eg: transitionEnd events when the browser doesn't support transitions)
			// NOTE: these do NOT go into the event queue, and necessarily only fire once.
			if (eventType === "IMMEDIATE") {
				if (!scope) scope = element;
				if (typeof handler === "string") handler = scope[handler];
				if (handler) handler.apply(scope, args);
				return;
			}

			// short circuit for simple case of installing named method on this object
			if (!scope && !args && !options) {
				_addToEventList(element, eventType, handler);
			}
			// the full monty
			else {
				if (!scope) scope = element;
				if (!options) options = {};
				
				// if options.selector, fire on first event.target parent which matches selector
				// NOTE: this passed arguments:  [event, target]
				if (options.selector) {
					var originalHandler = hope.bind(handler, scope, args);
					handler = function(event) {
						var target = event.target.selectUp(options.selector);
						if (!target) return;
						return originalHandler.apply(scope, [event,target]);
					}
					
				} else {
					// create a single, bound function to observe
					//	preferring a bindByReference
					handler = hope.bind(handler, scope, args);
				}
	
				// if in capture mode, attach directly (don't add to standard event list)
				if (options.capture) {
					if (options.once) {
						var captured = handler;
						handler = function() {
							captured.apply(scope, arguments);
							element.removeEventListener(eventType, handler, true);
						}
					}
					element.addEventListener(eventType, handler, true);
					handler.__captured__ = true;
				} else {
					_addToEventList(element, eventType, handler);
				}
	
				// if firing once, note on handler so we can remove automatically
				if (options.once) handler.__once__ = true;
			}			
			return handler;
		}
	}
	
	function _addToEventList(element, eventType, handler) {
		var data = element.data, eventName = "on"+eventType.capitalize();
		if (!data[eventName]) {
			// actually attach the standard event listener
			element.addEventListener(eventType, _eventHandler, false);

			// update the list of events
			data[eventName] = [];

			if (data.events) {
				data.events.push(eventType);
			} else {
				data.events = [eventType];
				// add to our list of things to do on unload
				element.unloadMap = "events:_unloadEvents";
			}
			
			// and stick the list of events on the element for debugging
			if (Event.showEvents && element.setAttribute) {
				element.setAttribute("_events", data.events.join(","));
			}
		}
		
		// add to the list of events
		data[eventName].push(handler);
	}

	var eventMethods = {
		// events property: getter returns the events we're currently watching
		//					setter sets events with { eventName:handler, eventName:handler} syntax
		events : new Property({
			get : function() {
				return this.data.events;
			},
			
			set :function(events) {
				if (typeof events !== "object") throw "Must set element.events to an object.";
				this.on(events);
			}
		}),
	
	
		// Observe a single event with a single object of all options.
		//	Use this if you're setting an exotic mix of options.
		observe : function(options) {
			return _observe(this, options.eventType, options.handler, options.scope, options.args, options);
		},
	
		// are we observing some event at all?
		observing : function(eventType) {
			return (this.data["on"+eventType.capitalze()] != null);
		},
	
		// Attach a single event handler, or a map of event handlers.
		on : function on(eventType, handler, scope, args, options) {
			return _observe(this, eventType, handler, scope, args, options)
		},
		
		// observe an event exactly once, then unregister
		once : function once(eventType, handler, scope, args, options) {
			if (!options) options = {};
			options.once = true;
			return _observe(this, eventType, handler, scope, args, options)
		},

		// Remove an event handler or a list of event handlers, returned from element.on()
		// NOTE: returns null so you can assign this to a variable to clear it.
		un : function un(eventType, boundHandler) {
			// try a standard remove (necessary if we've bound the event in capture phase)
			if (boundHandler && boundHandler.__captured__) {
				this.removeEventListener(eventType, boundHandler, true);
			} else {
				// now remove from our event list mechanism
				var handlers = this.data["on"+eventType.capitalize()];
				if (handlers) {
					Observable._removeObservations(handlers, boundHandler);
					if (!handlers.length) _cleanupAfterRemove(this, eventType);
				}
			}
			return null;
		},
		
		// Observe an event with the target as the first child which matches the selector
		onChild : function(selector, eventType, handler, scope, args, options) {
			if (!options) options = {};
			options.selector = selector;
			return _observe(this, eventType, handler, scope, args, options)
		},
		
		// Capture an event before it goes to childrn by catching it in the "capture" phase.
		capture : function(eventType, handler, scope, args, options) {
			if (!options) options = {};
			options.capture = true;
			return _observe(this, eventType, handler, scope, args, options)
		},
		
		// Fire an event immediately.
		//	@event is an event object or the string name of an event to fire
		//	all arguments are passed to the observing methods
		fire : function fire(event) {
			return _fireEvent(this, event, $args());
		},
		
		// Tell all of our descendants to fire some event.
//TODO: stop semantics???
		fireDown : function(event) {
			if (this.childElementCount !== 0) {
				this.elements.forEach(function(it) {
					it.fire(event);
					it.fireDown(event);
				});
			}
			return this;
		},
		
		// Tell our parents to fire some event.
//TODO: stop semantics???
		bubble : function(event) {
			var args = $args(1);
			this.fire(event, args);
			if (this.parentNode) this.parentNode.bubble.apply(this.parentNode, arguments);
		},

		// Fire an event 'soon'.
		//	@event is an event object or the string name of an event to fire
		//	@args are arguments to pass to the observers
		soon : function soon(delay, event) {
			if (typeof delay === "number") {
				return Observable.soon(delay, this, "fire", $args(1));
			} else {
				return Observable.soon(0, this, "fire", $args(0));
			}
			return this;
		},
		
		// Hook up single event handler in a way that can be easily `.unhook()`ed later.
		// Note: you can only hookup one handler for a each event in this manner,
		//		subsequent hookups remove the previous one.
		hookup : function(event, handler, scope) {
			if (typeof event === "string") {
				var eventKey = event + (scope ? scope.dataId : "");
				var hooked = (this.data.hooked || (this.data.hooked = {}));
				if (hooked[eventKey]) this.un(event, hooked[eventKey]);
				hooked[eventKey] = this.on(event, handler, scope);
			} else if (event) {
				if (arguments.length == 2) scope = handler;
				for (var key in event) {
					this.hookup(key, event[key], scope);
				}
			}
			return this;
		},
		unhook : function(event, scope) {
			var id = (scope ? scope.dataId : "");
			if (typeof event === "string") {
				var eventKey = event + (scope ? scope.dataId : "");
				var hooked = this.data.hooked;
				if (hooked && hooked[eventKey]) {
					this.un(event, hooked[eventKey]);
					delete hooked[eventKey];
				}
			} else if (event) {
				for (var key in event) {
					this.unhook(key, scope);
				}
			}
			return this;
		},
		
		
		_unloadEvents : function(events, data) {
//console.warn(events);
			var e = 0, eventType, eventName, list;
			while (eventType = events[++e]) {
				var list = data[ (eventName = "on"+ eventType.capitalize() ) ];
				// this will effectively null out all of the items in the list, I believe
				if (list) list.length = 0;
				delete data[eventName];
			}
		}
	};
	
	// add observation methods to Element.prototype
	hope.extend(Element.prototype, eventMethods);

	// add observation methods to window
	window.data = {};
	hope.extend(window, eventMethods);

	// add observation methods to document
	document.data = {};
	hope.extend(document, eventMethods);



	// add a window "onresize" event which tells all elements with a @wantsResize attribute
	//	that the window has been resized
//TODO: put this on a timer so we don't go too crazy???
	function _windowResized(event) {
		var resizers = selectAll("[wantsresize]");
		if (resizers.length && resizers.forEach) {
			resizers.forEach(function(element) {
				element.fire("windowResized", event);
			});
		}
	}
	window.on(Browser.EVENT.resize, _windowResized);	
	// and fire the _windowResized event when the document is ready
	hope.onReady("document", _windowResized);


	// add a "wantsResize" attribute to all elements
	Element.prototype.extend({
		// @wantsResize:  set this on elements which want to be notified when the window resizes
		wantsResize : new Attribute({
			name : "wantsResize",
			type : "boolean",
			value : false,
			inherit : true,
			update : true,
			onChange : function(newValue) {
				if (newValue != null) 	this.hookup("windowResized", "onWindowResized");
				else					this.unhook("windowResized");
			}
		}),
		
		// stub onWindowResized event
		onWindowResized : function(event) {}
	});


	//
	//	If we're on an IOS device, turn off the default touchMove handler
	//
	//	NOTE: DANGEROUS
	//
	if (Browser.ios) {
		document.on('touchmove', Event.preventDefault);
	}



Script.loaded("{{hope}}Element-events.js");
});// end Script.require()
