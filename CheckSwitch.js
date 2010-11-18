/* iOS style checkbox switch. */

Script.require("{{hope}}Element.js", function(){


new $Element.Subclass("$CheckSwitch", {
	tag : "checkswitch",
	mixins : "Valued",
	properties : {
		listeners : "click",
		template : "<span><div part='checkswitch:$display'></div></span>",

		// update the display value -- this runs an animation if the browser supports it		
		update : function() {
			var value = this.value;
			this.$display.className = "";
			this.$display.left = (value ? 0 : -55);
			// HACK: if we're not actually showing, just fire _updateDisplayClass immediately
			//			or it won't actually fire
			if (this.width > 0) {
				this.once(Browser.EVENT.transitionEnd, this._updateDisplayClass, this);
			} else {
				this._updateDisplayClass();
			}
		},

		// this fires after the animation
		_updateDisplayClass : function() {
			this.$display.className = (!!this.value ? "on" : "off");
			this.$display.left = "";
		},

		onClick : function() {
			this.value = !this.value;
		}
	}
});

Script.loaded("{{hope}}CheckSwitch.js");
});
