/*** Control class: a widget class that has a "value" or a "binding" ***/
Script.require("{{hope}}Element-attach.js", function(){

var Valued = {
	mixinTo : function(it) {
		if (it.isAClass) it = it.prototype;
		hope.extendIf(it, Valued.properties);
		it.attributeMap = "value:value";
		it.listeners = "shown";
		return it;
	},
	properties : {
		binding : Attribute("binding"),
		value : Property({
			get : function() {
				var binding = this.binding;
				if (binding) return hope.get(binding);
				return this._value;
			},
			
			set : function(newValue) {
				if (this._updateValue(newValue) == false) return;
				this.soon("update");
			}
		}),
		
		// update our bound value without updating the display
		//	returns true if value was actually changed, false if no change
		_updateValue : function(newValue) {
			var oldValue = this.value;
			if (oldValue === newValue) return false;
			
			var binding = this.binding;
			if (binding) {
				hope.set(binding, newValue);
			} else {
				this._value = newValue;
			}
			this.bubble("valueChanged", newValue, oldValue, this);
			return true;
		},
	
		onShown : function() {
			this.soon("update");
		}
	}
};
hope.setGlobal("Valued", Valued);

Script.loaded("{{hope}}Valued.js");
});// end Script.require
