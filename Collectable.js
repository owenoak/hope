/*** Collectable mixin ***/

Script.require("{{hope}}Object.js,{{hope}}Observable.js", function() {

window.Collectable = function Collectable(constructor) {
	if (!constructor.isAClass) throw TypeError("Collectable must be mixed in to a Class");

	// set things up so we'll add instances to the collection after creation
	constructor.prototype.on("init", function() {
		var id = this[this.constructor.keyProperty];
		if (id !== undefined) {
			constructor.collection[id] = this;
		}
	});

	// set things up so we'll remove instances on destroy
	constructor.prototype.on("destroy", function() {
		var id = this[this.constructor.keyProperty];
		if (id !== undefined) {
			delete constructor.collection[id];
		}
	});
	
	// ensure the constructor has a collection object
	if (!constructor.collection) constructor.collection = {};
	
	// default to the "id" property
	if (!constructor.keyProperty) constructor.keyProperty = "id";

};

Script.loaded("{{hope}}Collectable");
});//end Script.require
