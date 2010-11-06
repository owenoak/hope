/* Datasets */

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("$Dataset", {
	tag : "dataset",
	properties : {
		visible : false
	}
});


Script.loaded("{{hope}}Dataset.js");
});
