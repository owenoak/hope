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

	Element.prototype.extendIf({
	
		// @animation is the style of animation we run when showing/hiding
		//TODO: clear if setting to "none" and attr doesn't match
		animation : new Attribute({name:"animation", value:"none", inherit:true}),
		
		// run a named animation
		animate : function(name, callback) {
			var animation = this._getAnimationOptions(name);
			if (!animation) {
				console.warn("Animation ",name," not understood for ",this);
				if (callback) callback.apply(this);	
			}
			this._runAnimation(animation, callback, speed);
		},
		
		_getAnimationOptions : function() {
			var name = this.animation;
			if (name === "none") return;
			var speed = "normal";
			if (name.contains(" ")) {
				name = name.split(" ");
				speed = name[1];
				name = name[0];
			}
			var animation = this._animationMap[name];
			if (!animation) return;
			animation.speed = speed;
			return animation;
		},
		
		// @style is "fade" or "wipe" etc
		// @speed is null/"", "fast", "medium", "slow"
		// @init is stuff that needs to be done before the animation runs to set things up
		// @cleanup is stuff that needs to be done after the animation runs to clean things up
		// @callback is a user-supplied callback for after the animation completes OR is cancelled
		_runAnimation : function(options, callback, speed) {
			if (typeof options === "string") options = Element.animationMap[options];
			if (!options) throw "Animation not understood";
			
			if (Browser.cssTransitions) {
				if (this._animating) this.stopAnimation();
			
				function onDone() {
					this.attr("animate", null);
					this.transition = "";
					if (options.cleanup) 	options.cleanup.call(this);
					if (callback) 			callback.call(this);
					this._animating = false;
				}

				this._animating = true;
				this.once(Browser.EVENT.transitionEnd, onDone);
				this.attr("animate", options.name + (options.speed ? "-"+options.speed : ""));
				
				this._startAnimation(options, speed);
			} else {
				if (options.init) 		options.init.call(this, options);
				if (options.cleanup) 	options.cleanup.call(this, options);
				if (callback) 			callback.call(this);
			}
		},
		
		// if we're currently in the middle of an animation, force it to its end
		stopAnimation : function() {
			if (this._animating) this.fire(Browser.EVENT.animationEnd);
		},
		
		_animationSpeeds : {
			normal 	: ".2s",
			fast 	: ".1s",
			medium 	: ".3s",
			slow	: ".4s"
		},
		
		_getAnimationSpeed : function(speed) {
			if (speed == null) speed = "normal";
			if (typeof speed === "number") {
				speed = (speed < 10 ? speed+"s" : speed+"ms");
			} else if (isNaN(parseInt(speed))) {
				speed = (this._animationSpeeds[speed] || this._animationSpeeds.normal);
			}
			return speed;
		},
		
		
		_startAnimation : function(options, speed) {
			var speed = this._getAnimationSpeed(speed || options.speed);
			
			// clear the transition property so we don't start animating when setting start props
			this.transition = "";

			// run options.init if specified
			if (options.init) options.init.call(this, options);

//TODO: if start or end is "*", use original value, with a default?

			// set up transition property and intial element properties
			var transition = [], properties = options.properties;
			for (var key in properties) {
				var property = properties[key],
					start = property.start, 
					end = property.end,
					timing = property.timing || "linear"
				;
				if (start != null)	this[key] = start;
				if (end != null) 	transition.push(key + " " + speed + " " + timing);
			}
			
			// set the transition property -- this animates any properties we set afterwords
			this.transition = transition.join(",");

			// now set final element properties
			for (var key in properties) {
				var end = properties[key].end;
				if (end !== null) this[key] = end;
			}			
		},

		
		_animationMap : {
			fadeIn : {
				name : "fadeIn",
				properties : { 
					opacity : { 
						start : 0, 
						end : 1 
					} 
				},
				init : function(options) {
					this.removeAttribute("visible");
					// NOTE: we have to get offsetHeight here cause the callback to fire ???
					var height = this.offsetHeight;
				}
			},
			
			fadeOut : {
				name : "fadeOut",
				properties : { 
					opacity : { 
						start : 1, 
						end : 0
					} 
				},
				cleanup : function(options) {
					this.attr("visible", "no");
				}
			},
			
			wipeDown : {
				name : "wipeDown",
				properties : { 
					height : { 
						start : 0, 
						end : null	 		// NOTE: will be set during init()
					} 
				},
				init : function(options) {
					this.removeAttribute("visible");
					
					// get our height before we were animated
					this._wipeDownHeight = this.style.height;	//TODO: parseInt ???
					
					// reset height to auto, to figure out how big we should be
					if (!this._preAnimationHeight) this.style.height = "auto";
					var endHeight = this.offsetHeight;
					options.properties.height.end = endHeight;
				},
				cleanup : function(options) {
					this.height = this._wipeDownHeight;
				}
			},
			
			wipeUp : {
				name : "wipeUp",
				properties : { 
					height : { 
						start : null, 
						end : 0
					} 
				},
				init : function(options) {
					this.removeAttribute("visible");
					
					// get our height before we were animated
					this._wipeUpHeight = this.style.height;
					this.height = this.offsetHeight;
				},
				cleanup : function(options) {
					this.attr("visible", "no");
					this.height = this._wipeUpHeight;
				}
			},
			
			wipeRight : {
				name : "wipeRight",
				properties : {
					width : {
						start : 0,
						end : null			// NOTE: will be set during init()
					}
				},
				init : function(options) {
					this.removeAttribute("visible");
					this._wipeRightWidth = this.style.width;
					// reset width to auto, to figure out how big we should be
					if (!this._wipeRightWidth) this.style.width = "auto";
					var endWidth = this.offsetWidth;
					options.properties.width.end = endWidth;
				},
				cleanup : function(options) {
					this.width = this._wipeRightWidth;
				}
			},
			
			wipeLeft : {
				name : "wipeLeft",
				properties : {
					width : {
						start : null,
						end : 0
					}
				},
				init : function(options) {
					this._wipeLeftWidth = this.style.width;
					// reset width to auto, to figure out how big we should be
					if (!this._wipeLeftWidth) this.style.width = "auto";
					var endWidth = this.offsetWidth;
					options.properties.width.end = endWidth;
				},
				
				cleanup : function(options) {
					this.attr("visible","no");
					this.width = this._wipeLeftWidth;
				}
			}
		}
	});

	
Script.loaded("{{hope}}Element-animation.js");
});// end Script.require()
