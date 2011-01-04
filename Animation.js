/*** Element animation using CSS transitions ***/

// TODO: make an api-compatible version that works with timers
// TODO: make an api-compatible version that works with CSS3 Keyframe Animations

// hypercard's effects:
//	- wipe {left | right | up | down}
//	- barn door {open | close}
//	- plain
//	- cut
//	- dissolve
//	- venetian blinds
//	- checkerboard
//	- iris {open | close}
//	- scroll {left | right | up | down}
//	- zoom {open | out | close | in }


Script.require("{{hope}}Element.js", function(){

	// instance methods for Elements
	Element.prototype.extendIf({
		// @animation is the style of animation we run when showing/hiding
		//TODO: clear if setting to "none" and attr doesn't match
		animation : new Attribute({name:"animation", value:"none", inherit:true}),

		// @animationSpeed is the speed with which we run animations by default
		//TODO: clear if setting to "none" and attr doesn't match
		animationSpeed : new Attribute({name:"animationSpeed", value:"normal", inherit:true}),
		
		// if we're currently in the middle of an animation, force it to its end
		stopAnimation : function() {
			if (this._animating) this.fire(Browser.EVENT.animationEnd);
		},
		
		getAnimation : function(animationName, callback, speed) {
			return $Animation.makeAnimation(this, animationName, callback, speed);
		}
	});
	
	//
	// $Animation singleton for creating animation objects
	//
	function $Animation(element, options) {
		if (!element) throw "Must pass an element when create animations";
		this.element = element;
		if (options) for (var key in options) if (options[key]) this[key] = options[key];
	}
	hope.setGlobal("$Animation", $Animation);
	$Animation.prototype = {
		speed : "normal",
		
		speeds : {
			normal 	: ".2s",
			instant : "0",
			fast 	: ".1s",
			medium 	: ".3s",
			slow	: ".4s"
		},
		
		// stubs
		init : function(){},
		cleanup : function(){},
		callback : function(){},
		
		go : function() {
			var element = this.element, 
				animation = this
			;
			if (Browser.cssTransitions && this.speed != "instant") {
				if (element._animating) element._animating.stop();
			
				function onDone() {
					element.un(Browser.EVENT.transitionEnd, _onDone);
					element.attr("animating", null);
					element.transition = "";
					animation.cleanup(element, animation);
					animation.callback.call(element);
					element = element._animating = animation._onDone = _onDone = null;
				}

				var _onDone = animation._onDone = element.once(Browser.EVENT.transitionEnd, onDone);
				element.attr("animating", this.name + "-"+this.speed);

				element._animating = animation;
				animation._startAnimation(element);
			} else {
				animation.init(element);
				animation.cleanup(element);
				animation.callback.call(element);
			}
		},
		
		stop : function() {
			if (this._onDone) this._onDone();
		},
		
		_startAnimation : function() {
			var element = this.element,
				animation = this,
				speed = animation._getSpeed()
			;
			// clear the transition property so we don't start animating when setting start props
			element.transition = "";

			// endProperties are what we're transitioning to
			// NOTE: init will sometimes stick values in animation.endProperties!
			var endProperties = animation.endProperties = {};
			
			// run options.init if specified
			animation.init(element, animation);

			// set up transition property and intial element properties
			var transition = [], 
				properties = animation.properties
			;
			for (var style in properties) {
				var property = properties[style],
					start = property.start, 
					end = property.end,
					timing = property.timing || "linear"
				;
				if (start != null)	element[style] = start;
				if (end != null) 	transition.push(style + " " + speed + " " + timing);
				if (end !== "*")	endProperties[style] = end;
			}

			// set the transition properties on a short delay
			setTimeout(function(){
				element.transition = transition.join(",");
				// now set final element properties
				for (var style in endProperties) {
					element[style] = endProperties[style];
				}
			},0);
		},
		
		_getSpeed : function() {
			speed = this.speed;
			if (typeof speed === "number") {
				speed = (speed < 10 ? speed+"s" : speed+"ms");
			} else if (isNaN(parseInt(speed))) {
				speed = (this.speeds[speed] || this.speeds.normal);
			}
			return speed;
		},
		
	};//end $Animation.prototype
	
	
	//
	//	static methods
	//
	
	hope.extend($Animation, {
		// map of known animation constructors
		constructors : {},
		
		// pairs of animation for show/hide operations
		showHidePairs : {},
		
		getShowHideOperation : function(show, element, callback) {
			var animation = element.animation;
			if (animation === "none") return;
			var pair = this.showHidePairs[animation];
			if (!pair) return;
			var name = (show ? pair.show : pair.hide).toLowerCase();
			return new this.constructors[name](element, {callback:callback, speed:element.animationSpeed});
		},
		
		// create a new animation for a particular element
		makeAnimation : function(element, name, callback, speed) {
			if (!element) return;

			if (!name) name = element.animation;
			if (!speed) speed = element.animationSpeed;

			if (name === "none" || speed == "instant") return;
			
			var constructor = $Animation.constructors[name.toLowerCase()];
			if (!constructor) return;
			
			return new constructor(element, 
						{callback:callback, speed: speed}
					);
		},
		
		// Create a new animation subclass, registered under @animation.name
		//	Also gives the element a method to call the animation directly.
		Subclass : function(options) {
			var name = options.name;
			if (!name) throw "Must pass a name when creating an $Animation subclass";

			var constructor = function $AnAnimation(element, options) {
				if (!element) throw "Must pass an element when create animations";
				this.element = element;
				if (options) for (var key in options) if (options[key]) this[key] = options[key];
			}
			constructor.prototype = hope.setProto(options, $Animation.prototype);

			$Animation.constructors[name.toLowerCase()] = constructor;
			
			Element.prototype[name] = function(callback, speed) {
				new constructor(this, {callback:callback, speed:speed||this.animationSpeed}).go();
			}
			return constructor;
		}
	});
	

	new $Animation.Subclass({
		name : "fadeIn",
		properties : { 
			opacity : { 
				start : 0, 
				end : 1 
			} 
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			// NOTE: we have to get offsetHeight here cause the callback to fire ???
			var height = element.offsetHeight;
		}
	});
	
	new $Animation.Subclass({
		name : "fadeOut",
		properties : { 
			opacity : { 
				start : 1, 
				end : 0
			} 
		},
		cleanup : function(element, animation) {
			element.attr("visible", "no");
			element.opacity = 1;
		}
	});
	
	$Animation.showHidePairs.fade = {"show" : "fadeIn", "hide" : "fadeOut"};
	
	new $Animation.Subclass({
		name : "wipeDown",
		properties : { 
			height : { 
				start : 0, 
				end : "*"	 		// NOTE: will be set during init()
			} 
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			if (animation) {
				// get our height before we were animated
				animation._startHeight = element.offsetHeight;
				// reset height to auto, to figure out how big we should be
				if (!animation._startHeight) element.style.height = "auto";
				var endHeight = element.offsetHeight;
				animation.endProperties.height = endHeight;
			}
		},
		cleanup : function(element, animation) {
			if (animation) element.height = animation._startHeight;
		}
	});
	
	new $Animation.Subclass({
		name : "wipeUp",
		properties : { 
			height : { 
				start : null, 
				end : 0
			} 
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			if (animation) {
				// get our height before we were animated
				animation._startHeight = element.offsetHeight;
				element.height = element.offsetHeight;
			}
		},
		cleanup : function(element, animation) {
			element.attr("visible", "no");
			if (animation) {
				element.height = animation._startHeight;
			}
		}
	});

	$Animation.showHidePairs.wipeDown = {"show" : "wipeDown", "hide" : "wipeUp"};
	
	new $Animation.Subclass({
		name : "wipeRight",
		properties : {
			width : {
				start : 0,
				end : null			// NOTE: will be set during init()
			}
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			if (animation) {
				animation._startWidth = element.style.width;
				// reset width to auto, to figure out how big we should be
				if (!animation._startWidth) element.style.width = "auto";
				var endWidth = element.offsetWidth;
				animation.properties.width.end = endWidth;
			}
		},
		cleanup : function(element, animation) {
			if (animation) element.width = animation._startWidth;
		}
	});
	
	new $Animation.Subclass({
		name : "wipeLeft",
		properties : {
			width : {
				start : null,
				end : 0
			}
		},
		init : function(element, animation) {
			animation._startWidth = element.style.width;
			// reset width to auto, to figure out how big we should be
			if (!animation._startWidth) element.style.width = "auto";
			var endWidth = element.offsetWidth;
			animation.properties.width.end = endWidth;
		},
		
		cleanup : function(element, animation) {
			element.attr("visible","no");
			if (animation) element.width = animation._startWidth;
		}
	});

	$Animation.showHidePairs.side = {"show" : "wipeRight", "hide" : "wipeLeft"};



	new $Animation.Subclass({
		name : "slideDown",
		properties : { 
			top : {
				end : 0
			}
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			if (animation) {
				var height = element.offsetHeight;
				element.top = -height;
				animation.endProperties.top = 0;
			}
		},
		cleanup : function(element, animation) {}
	});
	
	new $Animation.Subclass({
		name : "slideUp",
		properties : { 
			top : { 
				start : 0, 
				end : "*"
			} 
		},
		init : function(element, animation) {
			element.removeAttribute("visible");
			if (animation) {
				var height = element.offsetHeight;
				animation.endProperties.top = -height;
			}
		},
		cleanup : function(element, animation) {
			element.attr("visible", "no");
		}
	});

	$Animation.showHidePairs.slideDown = {"show" : "slideDown", "hide" : "slideUp"};

	
Script.loaded("{{hope}}Animation.js");
});// end Script.require()
