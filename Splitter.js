/* <splitter> - split a region into two horizontally or vertically-stacked boxes 
					and allow for resizing using the magic of css flex
*/

Script.require("{{hope}}Panel.js", function(){


new hope.Panel.Subclass("hope.Splitter", {
	tag : "splitter",
	properties : {
		
		// direction is 'vertical' (default) or 'horizontal'
		direction : new Attribute({name:"direction", update:true, inherit:true, value:"vertical"}),
		
		onReady : function() {
//			console.warn("vsplit ready");
		}
	}
});



Script.loaded("{{hope}}Splitter.js");
});
