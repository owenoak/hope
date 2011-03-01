/* Textfield: input control with binding/error/etc semantics.
	Default is to manage an <input type='text'> element, subclasses can have other $input types.
*/

Script.require("{{hope}}Textfield.js", function(){


//TODO: is this
new hope.Textfield.Subclass("hope.Combobox", {
	tag : "combobox",
	properties : {
		// template for rendering our actual input control
//TODO: what about some non-standard input, like a slider we create ourselves, etc???
		template : "<input part='$input' type='text' appearance='translucent'>"
				 + "<action part='$button' icon='small-light-down'/>",

		// update input + message field on update
		onUpdate : function() {
			if (!this.isReady) return;
//console.info("onUpdate() for ",this, this.value);
			this.updateInputValue();		
			this.updateMessage();
		},

		// actually change the value of our input field to match our bound value
		updateInputValue : function() {
			var value = this.value;
			if (value == null) value = "";
			if (this.multiline && this.interpretReturns) value = value.replace(/<br>/g, "\n");
			this.$input.value = value;
		},
		
		// return the value actually stored in the input right now
		getInputValue : function() {
			var value = this.$input.value;
			if (this.multiline && this.interpretReturns) value = value.replace(/[\r\n]/g, "<br>");
			return value;
		},
		
		// Attach our parts, setting up all events as necessary.
		// Called automatically by .onReady()
		initializeInput : function() {
			if (!this.isReady) return;
			
			this.$input.on({
				scope : this,
				keypress : "onInputKeyPressEvent",
				change : "onInputChangeEvent",
				focus : "onInputFocusEvent",
				blur : "onInputBlurEvent"
			});
		}
	}
});



Script.loaded("{{hope}}Combobox.js");
});
