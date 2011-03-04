/* Textfield: input control with binding/error/etc semantics.
	Default is to manage an <input type='text'> element, subclasses can have other $input types.
*/

Script.require("{{hope}}Element-attach.js", function(){

hope.extend(HTMLSelectElement.prototype, {
	setOptions : function(map) {
		this.options.length = 0;
		if (!map) return;
		
		for (var key in map) {
			this.options[this.options.length] = new Option(map[key], key);
		}
	}
});


Script.loaded("{{hope}}Select.js");
});
