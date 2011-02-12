/* Icons -- really just placeholders for images */

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("hope.Icon", {
	tag : "icon",
	properties : {
		icon : Attribute({name:"icon", update:true})
	}

});


Script.loaded("{{hope}}Icon.js");
});
