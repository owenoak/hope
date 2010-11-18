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
				var oldValue = this.value;
				if (oldValue === newValue) return;
				
				var binding = this.binding;
				if (binding) {
					hope.set(binding, newValue);
				} else {
					this._value = newValue;
				}
				this.update();
				this.fire("valueChanged", newValue, oldValue, this);
			}
		}),
	
		onShown : function() {
			this.update();
		}
	}
};
hope.setGlobal("Valued", Valued);

Script.loaded("{{hope}}Valued.js");
});// end Script.require
