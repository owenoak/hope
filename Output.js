/* Output -- label that shows a value. */

Script.require("{{hope}}Element-attach.js", function(){


new Element.Subclass("hope.Output", {
	tag : "output",
	mixins : "Valued",
	properties : {
		onUpdate : function() {
			if (!this.binding) return;
			var value = this.value;
			if (value == null) value = "";
			this.html = value;
		}
	}
});



Script.loaded("{{hope}}Output.js");
});
