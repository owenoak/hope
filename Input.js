/* iOS style checkbox switch. */

Script.require("{{hope}}Element-attach.js", function(){


new $Element.Subclass("$CheckSwitch", {
	tag : "checkswitch",
	properties : {
		listeners : "click",
		template : "<div part='checkswitch:$slider'>\
						<div class='on'></div>\
						<div class='off'></div>\
					</div>",
		value : Property({
			get : function() {
				return this._value;
			},
			set : function(value) {
				var me = this;
				this._value = !!value;
				if (Browser.cssTransitions) {
					this.className = "";
					function onDone() {
						me.className = (value ? "on" : "off");
					}
					this.once(Browser.EVENT.transitionEnd, onDone);
					this.$slider.left = (value ? 0 : -55);
				} else {
					this.className = (value ? "on" : "off");			
				}
			}
		}),
		_value : true,
		onClick : function() {
			this.value = !this.value;
		}
	}
});



Script.loaded("{{hope}}CheckSwitch.js");
});
