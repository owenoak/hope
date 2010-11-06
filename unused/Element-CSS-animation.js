/*************
 *************
 
   MEH: this doesn't work on the pad in iOS 3.2
 
 *************
 *************/
 

/*** Element animation ***/

Script.require("{{hope}}Element.js", function(){


//TODO:  animation stack?

	Element.prototype.extendIf({

		animate : function(animation, start, end) {
			// in browsers which support CSS animation, 
			//	we count on there being a @keyframe animation set up already
			if (Browser.cssAnimation) {
				// if we were in the middle of another animation, just skip to the end
				if (this._animating) this.stopAnimation();
				
				function onDone() {
					this.attr("animate",null);
					if (end) end.apply(this);
					this._animating = false;
				}
				if (start) start.apply(this);
				this._animating = true;
				this.once(Browser.EVENT.animationEnd, onDone);
//NOTE: when we do a HIDE animation (specifically) and interrupt with a new SHOW animation,
//			the show animation won't actually fire.  But not vise versa.  Wierd.
				this.attr("animate", animation);
			} 
			// otherwise just run the start and end handlers immediately
			else {
				if (start) start.apply(this);
				if (end) end.apply(this);
			}
		},
		
		// if we're currently in the middle of an animation, force it to its end
		stopAnimation : function() {
			if (this._animating) this.fire(Browser.EVENT.animationEnd);
		},
		
//TODO: recast these as an Animation singleton?
//TODO: these could all be statics... ?
		_runShowAnimation : function(name, speed, callback) {
			if (typeof speed === "string") name+="-"+speed;
			else if (typeof speed === "function") callback = speed;
			function start() {
				this.visible=true;
			}
			this.animate(name, start, callback);		
		},

		_runHideAnimation : function(name, speed, callback) {
			if (typeof speed === "string") name+="-"+speed;
			else if (typeof speed === "function") callback = speed;
			function end() {
				this.visible = false;
				if (callback) callback();
			}
			this.animate(name, null, end);
		},

		_animationMap : {
			"fade"		: {show:"fadeIn", hide:"fadeOut"},
			"fade-fast"	: {show:"fadeIn-fast", hide:"fadeOut-fast"},
			"fade-slow"	: {show:"fadeIn-slow", hide:"fadeOut-slow"},
			"fade-deadly": {show:"fadeIn-deadly", hide:"fadeOut-deadly"}
		},
		
		_getVisibleAnimation : function(showing) {
			var map = this._animationMap[this.animation];
			return (map ? map[showing ? "show" : "hide"] : null);
		},


		fadeIn : function(speed, callback) {
			this._runShowAnimation("fadeIn", speed, callback);
		},

		fadeOut : function(speed, callback) {
			this._runHideAnimation("fadeOut", speed, callback);
		},


		slideDown : function(speed, callback) {
			this._runShowAnimation("slideDown", speed, callback);
		},

		slideUp : function(speed, callback) {
			this._runHideAnimation("slideDown", speed, callback);
		},
		
	});

Script.loaded("{{hope}}Element-animation.js");
});// end Script.require()
