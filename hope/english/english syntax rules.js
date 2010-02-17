hope.EnglishSyntaxTree.addSyntax({

	"statement": {
		// generic accessors / setters
		"get (expression)" : "var it = {{expression}};",

		// HC HAS:  "into|after|before", you can put into the middle of a container
		"put (expression) into (thing)" : "var {{thing}} = {{expression}};",
		"put (expression) into (property) of (thing)" : "hope.set({{thing}}, '{{property}}', {{expression}});",
		
		"set (thing) to (expression)" : "var {{thing}} = {{expression}};",
		"set (property) of (thing) to (expression)" : "hope.set({{thing}}, '{{property}}', '{{expression}}');",
		
		"delete (thing)" : "delete {{thing}};",
		"delete (property) of (thing)" : "hope.clear({{thing}}, '{{property}}');",

		// delegation ??? scoping?
		"tell (thing) to (statement)" : "with {{thing}} { {{statement}} };",
		"notify (string)" : "this.notify('{{string}}');",
		"notify (string) with (arguments)" : "this.notify('{{string}}', {{arguments}};",


		// instance creation
		"create a [new] (type)" : "var it = hope.create({{type}});",
		"create a [new] (type) with (arguments)" : "var it = hope.create({{type}}, {{arguments}});",
		"create a [new] (type) {called|named} (identifier)" : "var {{identifier}} = hope.create({{type}});",
		"create a [new] (type) {called|named} (identifier) with (arguments)" : "var {{identifier}} = hope.create({{type}}, {{arguments}});",

		"clone (thing)" : "var it = hope.clone({{thing}});",
		"clone (thing) as (identifier)" : "var {{identifier}} = hope.clone({{thing}});",


		// math
		"add (expression) to (expression)" : "{{expression[1]}} += {{expression[0]}};",
		"subtract (expression) from (expression)" : "{{expression[1]}} -= {{expression[0]}};",
		"multiply (expression) by (expression)" : "{{expression[0]}} *= {{expression[1]}};",
		"divide (expression) by (expression)" : "{{expression[0]}} /= {{expression[1]}};",

		"round (expression)" : "{{expression}} = Math.round({{expression}});",
		"round (expression) down" : "{{expression}} = Math.floor({{expression}});",
		"round down (expression)" : "{{expression}} = Math.floor({{expression}});",
		"round (expression) up" : "{{expression}} = Math.ceil({{expression}});",
		"round up (expression)" : "{{expression}} = Math.ceil({{expression}});",
		
		
		// object operations
		"extend (thing) with (expression)" : "hope.extend({{thing}}, {{expression}});",
		"merge (thing) with (expression)" : "hope.merge({{thing}}, {{expression}});",
		"fully merge (thing) with (expression)" : "hope.extend({{thing}}, {{expression}}, hope.DEEP);",
		
		"mix (mixin) {in to|into} (thing)" : "hope.mixin({{mixin}}, {{thing}});",
		
		// list operations
		"add (expression) to list (container)" : "{{container}}.add({{expression}});",
		"add (expression) to list (container) {at|as} (number)" : "{{container}}.add({{expression}}, {{number}});",
		"add (expression) to set (container) as (string)" : "{{container}}.add({{expression}}, {{string}});",	// HMM, only works with Sets

		"add (expression) to list (container) after (expression)" : "{{container}}.addAfter({{expression[0]}}, {{expression[1]}});",
		"add (expression) to list (container) before (expression)" : "{{container}}.addBefore({{expression[0]}}, {{expression[1]}});",


		"append (expression) to list (container)" : "{{container}}.add({{expression}});",
		"prepend (expression) to list (container)" : "{{container}}.add({{expression}}, 0);",

		"remove (expression) from {set|list} (container)" : "{{container}}.remove({{expression}});",
		"remove (identifier) (number) from list (container)" : "{{container}}.removeItem({{number}});",
		"remove (identifier) (string) from set (container)" : "{{container}}.removeItem({{string}});",
		"remove (property) of (container)" : "{{expression}}.removeItem('{{property}}');",		// ordinals ???

		"replace (expression) with (expression) in {set|list} (container)" : "{{container}}.replace({{expression[0]}}, {{expression[1]}});",
		"replace (expression) in {set|list} (container) with (expression)" : "{{container}}.replace({{expression[0]}}, {{expression[1]}});",
		"replace (property) of {set|list} (container) with (expression)" : "{{container}}.replace('{{property}}', {{expression}});",		// ordinals ???


	},// (statement)
	

	"expression" : {
//		"(thing)" : "{{thing}}",
		"me" : "this",

		"my (property)" : "hope.get(this, '{{property}}')",
		"the (container)" : "{{container}}",

		"new (type)" : "hope.create({{type}})",
		"new (type) with (arguments)" : "hope.create({{type}}, {{arguments}})",
	
		"[the] empty string" : "''",

		"true": "true",
		"yes" : "true",
		
		"false" : "false",
		"no"    : "false",
		
		"null" : "null",
		"empty" : "undefined",
		"none"	: "null",		// 0 ?
		
		"(string)" : "'{{string}}'",

		"(number)" : "{{number}}",
		
		// set/list expressions
		"index of (expression) in (container)" : "set.indexOf({{container}},{{expression}})",
		"number of (identifier) in (container)" : "set.lengthOf({{container}})",
		"property names of (expression)" : "set.keysOf({{expression}})",
		"property values of (expression)" : "set.valuesOf({{expression}})",

		"(expression) where (condition)" : "set.where({{expression}}, function(it) {return !! ({{condition}}) })",

		// math
		"(expression) {+|plus} {expression}" : "{{expression[0]}} + {{expression[1]}}",
		"(expression) {-|minus} {expression}" : "{{expression[0]}} - {{expression[1]}}",
		"(expression) {*|times|multiplied by} {expression}" : "{{expression[0]}} * {{expression[1]}}",
		"(expression) {/|divided by} {expression}" : "{{expression[0]}} / {{expression[1]}}",

		"round (expression)" : "Math.round({{expression}})",
		"round (expression) down" : "Math.floor({{expression}})",
		"round down (expression)" : "Math.floor({{expression}})",
		"round (expression) up" : "Math.ceil({{expression}})",
		"round up (expression)" : "Math.ceil({{expression}})",

		// concatenation with & and &&
		"(expression) & (expression)" : "{{expression[0]}} + {{expression[1]}}",
		"(expression) && (expression)" : "{{expression[0]}} + ' ' + {{expression[1]}}",
	
	}, // (expression)


	"condition" : {
		"(expression)" : "{{expression}}",
		"(expression) is (expression)" : "{{expression[0]}} == {{expression[1]}}",
		"(expression) is empty" : "{{expression}} == null",							// TODO: list expression as well!
		"(expression) is defined" : "{{expression}} != null",
		"(expression) is {a|an} (type)" : "{{expression}} instanceof {{type}}",
		"(expression) {is greater than|>} (expression)" : "{{expression[0]}} > {{expression[1]}}",
		"(expression) {is greater than or equal to|>=} (expression)" : "{{expression[0]}} > {{expression[1]}}",
		"(expression) {is less than|<} (expression)" : "{{expression[0]}} < {{expression[1]}}",
		"(expression) {is less than or equal to|<=} (expression)" : "{{expression[0]}} <= {{expression[1]}}",
		
		"(expression) is not (expression)" : "{{expression[0]}} != {{expression[1]}}",
		"(expression) is not empty" : "{{expression}} != null",						// TODO: list expression as well!
		"(expression) is not defined" : "{{expression}} == null",
		"(expression) is not {a|an} (type)" : "! ({{expression}} instanceof {{type}})",
		"(expression) is not greater than (expression)" : "{{expression[0]}} <= {{expression[1]}}",
		"(expression) is not greater than or equal to (expression)" : "{{expression[0]}} < {{expression[1]}}",
		"(expression) is not less than (expression)" : "{{expression[0]}} >= {{expression[1]}}",
		"(expression) is not less than or equal to (expression)" : "{{expression[0]}} > {{expression[1]}}",

		"I am {a|an} (type)" : "this instanceof {{type}}",
		"I am not {a|an} (type)" : "! (this instanceof {{type}})",
		
		// set/list conditions
		"(expression) {contain|contains} (expression)" : "set.contains({{expression[0]}}, {{expression[1]}})",
		"(expression) {does not contain|do not contain} (expression)" : "! set.contains({{expression[0]}}, {{expression[1]}})",
		
		"(expression) {start|starts} with (expression)" : "set.beginsWith({{expression[0]}}, {{expression[1]}})",
		"(expression) {begin|begins} with (expression)" : "set.beginsWith({{expression[0]}}, {{expression[1]}})",
		"(expression) {end|ends} with (expression)" : "set.endsWith({{expression[0]}}, {{expression[1]}})",

		"not (condition)" : "! ({{condition}})",
		"(condition) and (condition)" : "( ({{condition[0]}}) && ({{condition[1]}}) )",
		"(condition) or (condition)" : "( ({{condition[0]}}) || ({{condition[1]}}) )",
	
	}, // (condition)

	
	"repeatCondition" : {
		"forever" : "while (true) {",
		"while (condition)" : "while ({{condition}}) {",
		"until (condition)" : "while (!{{condition}}) {",
		"(number) [times]"  : "for (var index = 1; index <= {{number}}; index++) {",
		"for [each] item in {{expression}}" : "for (...) {",
		"for {each|each property|properties} {of|in} {{expression}}" : "for (...) {",
		// TODO
	},
	
	
	// the end brace comes with the end if
	"elseBlock" : {
		"else (statement)" : "} else { {{statement}} ",
		"else" : "} else {",
		"else if (condition) then (statement)" : "} else if ({{condition}}) {",
		"else if (condition) [then]" : "} else if ({{condition}}) {",
		"(statement)" : "{{statement}}"
	},
	
	// 	me
	//	my foo
	//	foo			(variable)
	"thing" : {
		"me"			  : function(stream) {
								stream.thing = "this";
								return stream.thing;
							},
		// HMM, I THINK THIS IS AN EXPRESSION ???
		"my (identifier)" : function(stream) {
								stream.thing = "this."+stream.subs.identifier;
								return stream.thing;
							},
		"(identifier)" 	  : function(stream) {
								stream.thing = stream.subs.identifier;
								return stream.thing;
							}
	},


	// property rules (includes generic ordinals)
	// just doing "item" right now, genericise to any identifier later
	"property" : {
		"the (identifier) of" 		: "{{identifier}}",		// the blah of...
		"the (string) of"			: "{{string}}",			// the "blah" of...

		"item (number) of" 			: "{{number}}",			// item 1 of...
		"the first item of" 		: "1",					// the first item of...
		"the second item of" 		: "2",
		"the third item of" 		: "3",
		"the fourth item of" 		: "4",
		"the fifth item of" 		: "5",
		"the sixth item of" 		: "6",
		"the seventh item of" 		: "7",
		"the eighth item of" 		: "8",
		"the ninth item of" 		: "9",
		"the tenth item of" 		: "10",

		"the last item of" 			: "-1",
		"the next to last item of" 	: "-1",
		"the second to last item of": "-2",
		
		"a random item of" 		: "_RANDOM_",

		"the (number) st item of" 	: "{{number}}",				// the 1st item of...
		"the (number) nd item of" 	: "{{number}}",
		"the (number) rd item of" 	: "{{number}}",
		"the (number) th item of" 	: "{{number}}",
	},// (property)


	
	"arguments" : {
		"(expression)" : "{{expression}}",
		"(expression) and (arguments)" : "{{expression}}, {{arguments}}"
	},

	"container" : {
		"(thing)" : "{{thing}}",
		"(property) (thing)" : "hope.get({{thing}}, '{{property}}')",
		"my (property)" : "hope.get(this, '{{property}}')",
		"(property) my (property)" : "hope.get(this, '{{property[1]}}.{{property[0]}}')",
	},

	"mixin" : {
		"(string)" : "hope.getThing('{{string}}')",
		"(identifier)" : "hope.getThing('{{identifier}}')",
		"(thing)" : "{{thing}}"
	},

	"type" : {
		"(string)" : "hope.getThing('{{type}}')",
		"(identifier)" : "hope.getThing('{{identifier}}')",
		"(thing)" : "{{thing}}"
	},


	//
	//	constant shorthands
	//

	
	"speed" : {
		"very slowly" : "1000",
		"slowly" : "500",
		"normal" : "250",
		"quickly" : "150",
		"very quickly" : "100",
		"instantly" : "0",

		"[{in|for}] (number) {s|sec|seconds}" : "({{number}}*1000)",

		"[{in|for}] (number) {ms|msec|milliseconds}" : "{{number}}",
	}, // (speed)


	"axis" : {
		"h" : "'h'",
		"v" : "'v'",
		"b" : "'b'",
		"horizontal" : "'h'",
		"vertical" : "'v'",
		"both" : "'b'"
	}, // (axis)

	
	"direction" : {
		"center" : "'c'",
		"middle" : "'c'",
		
		"up" : "'t'",
		"down" : "'b'",
		"left" : "'l'",
		"right" : "'r'",
		"upper left" : "'tl'",
		"upper right" : "'tr'",
		"lower left" : "'ll'",
		"lower right" : "'lr'",

		"u" : "'t'",
		"d" : "'b'",
		"l" : "'l'",
		"r" : "'r'",
		"ul" : "'tl'",
		"ur" : "'tr'",
		"lr" : "'bl'",
		"ll" : "'br'",

		"north" : "'t'",
		"south" : "'b'",
		"east" : "'r'",
		"west" : "'l'",
		
		"north east" : "'tr'",
		"north west" : "'tl'",
		"south east" : "'br'",
		"south west" : "'bl'",

		"northeast" : "'tr'",
		"northwest" : "'tl'",
		"southeast" : "'br'",
		"southwest" : "'bl'",
		
		"n" : "'t'",
		"s" : "'b'",
		"e" : "'r'",
		"w" : "'l'",
		"ne" : "'tr'",
		"nw" : "'tl'",
		"se" : "'br'",
		"sw" : "'bw'"
	} // (direction)

});// hope.parser.addSyntax()
