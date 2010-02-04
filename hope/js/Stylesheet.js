//!
//	Stylesheet, now with interactive processing!
//
//	We have one set of rules that we apply to all stylesheets, which is additive,
//	so you'll generally set your variables first, then output.
//

new hope.File.subclass({
	name : "Stylesheet",
	prototype : {
	
		// set a variable					{{name=value}}
		set : function(name, value) {},

		// output a variable				{{name}}
		get : function(name) {},
		
		// import another stylesheet		{{import:url}}
		importUrl : function(url) {},
	
		// output round corners				{{round:#}} or {{round:# # # #}}
		round : function(size){},

		// css shadows						{{shadow:???}}
		shadow : function(){},

		// transforms						{{transform:translate(
		transform : function(){},

		// animation
		animation : function(){},

		// fade in/out animation
		fade : function(){},

		// move animation
		move : function(){},
	
		// slide animation
		slide : function(){},
		
		
	
	},
	
	statics : {
		variables : {}
		
	}
});
