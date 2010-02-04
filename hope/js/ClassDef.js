//
//	Class/Property/Expression/Command definitions for parsing classes from XML
//

new hope.Class({
	name : "Def",
	prototype : {
	
	}
});

new hope.Def.subclass({
	name : "ThingDef",
	
	prototype : {
		onCreate : function() {
			this.properties = [];
			this.expressions = [];
			this.commands = [];
		},
		
		setProperty : function(it){this.properties.push(it)},
		setExpression : function(it){this.expressions.push(it)},
		setCommand : function(it){this.expressions.push(it)}
			
	}
});
hope.xml.register("thing", hope.ThingDef);


new hope.Def.subclass({
	name : "MixinDef"
});
hope.xml.register("mixin", hope.MixinDef);


new hope.Def.subclass({
	name : "PropertyDef"
});
hope.xml.register("property", hope.PropertyDef);



new hope.Def.subclass({
	name : "ExpressionDef"
});
hope.xml.register("expression", hope.ExpressionDef);



new hope.Def.subclass({
	name : "CommandDef"
});
hope.xml.register("command", hope.CommandDef);


new hope.Def.subclass({
	name : "EventDef"
});
hope.xml.register("event", hope.EventDef);



new hope.Def.subclass({
	name : "TypeDef"
});
hope.xml.register("type", hope.TypeDef);

