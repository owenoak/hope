// I think with this we could do supercalls with the syntax:
//
//		this.asSomeClass("update")(arguments);
//
//	instead of our current syntax:
//
//		this.asSomeClass.update.apply(this, arguments);
//
//	However, it is not very efficient...
//

function makeSuperCaller(Class) {
	var proto = Class.prototype;
	return function(methodName) {
		var me = this, method = proto[methodName];
		return function(args) {
			method.apply(me, args);
		}
	}
}
	
