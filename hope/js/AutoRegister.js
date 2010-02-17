new hope.Mixin({
	name : "AutoRegister",
	onMixin : function(constructor) {
		constructor.prototype.observe(
			"create", 
			function() {
				this.constructor.register(this);
			}
		);
	}

});
