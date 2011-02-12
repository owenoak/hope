/* Inline editor */

Script.require("{{hope}}Section.js", function(){


new hope.Section.Subclass("hope.Editor", {
	tag : "editor",
	properties : {

		onUpdate : function() {
			var bound = this.getChildren("*[binding]");
			bound.forEach(function(it){
//				console.warn(it, it.binding);
				it.fire("update")
			});
		},
		
		
		// catch onValueChanged from our children
		onValueChanged : function(event, newValue, oldValue, element) {}
	}
});



Script.loaded("{{hope}}Editor.js");
});
