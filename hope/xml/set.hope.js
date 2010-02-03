// line 3: 	<ordinal name='set ordinal' with='item'/>
hope.ordinals.create("set ordinal", "set", "item");

// line 2:  <thing type='set'>
new Thing({
	type : "set",
	
	prototype : {

		isEmpty : function(){},
		amEmpty : alias("isEmpty"),

		isNotEmpty : function(){},
		amNotEmpty : alias("isNotEmpty"),

		contains : function(thing) {},
		contain : alias("contains"),

		doesNotContain : function(thing) {},
		doNotContain : alias("doesNotContain"),

		startsWith : function(thing){},
		beginsWith : alias("startsWith"),
		startWith : alias("startsWith"),
		beginWith : alias("startsWith"),

	
	}
});
