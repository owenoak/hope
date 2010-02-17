new hope.Mixin({
	name : "Caches",
	onMixin : function(constructor) {
		var protoCache = (constructor.superclass ? constructor.superclass.prototype.cache : null);
		protoCache = constructor.prototype.cache = hope.protoClone(protoCache || {});
		constructor.prototype.observe(
			"create", 
			function() {
				this.cache = hope.protoClone(protoCache);
			},
			hope.BEFORE
		);
	}

});
