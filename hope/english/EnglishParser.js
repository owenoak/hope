(function(hope) {// begin hidden from global scope

var syntaxTree = hope.EnglishSyntaxTree.tree;
var Stream = hope.ParseStream;
var tokenize = hope.EnglishTokenizer.tokenize;

var NOMATCH = "__NOMATCH__";

var parser = hope.EnglishParser = {

	// translate a block of english
	// 	(can be called statically)
	translate : function(english) {
		var tokens = tokenize(english),
			masterStream = new Stream(tokens)
		;
//		try {
			var results = parser.parse_block(masterStream);
//		} catch (e) {
//			debugger;
//			console.error(e);
//		}
		return results;
	},

	// simple matchers that consume a strictly limited set of tokens
	simpleTypes : {
		"number" : "parse_number",
		"string" : "parse_string",
		"identifier" : "parse_identifier",
		"property" : "parse_property"
	},

	// tokens that start blocks
	blockStarters : {
		"if" : "parse_if",
		"repeat" : "parse_repeat",
		"try" : "parse_try"
	},



	// parse any expression type
	//	calls the expression's custom parser if defined
	//
	parseType : function(type, stream) {
		var specialParser = "parse_"+type
		if (this[specialParser]) return this[specialParser](stream);
		return this.walkSyntaxBranch(type, stream);
	},


	//
	// parse any branch of the EnglishSyntaxTree generically
	//
	walkSyntaxBranch : function(branchName, stream) {
		var branch = syntaxTree[branchName];
		var output = this.parseBranch(branch, stream);
		if (output && stream.subs) output = hope.expand(output, stream.subs);
		return output;
	},


	//
	// For all of the parsers below (parse_XXX):
	//
	//	Attempt to parse the head of the stream
	//	If we get a match
	//		- advance the stream past the end of the match
	//		- return the output (transforming with any subs as necessary)
	//
	//	If we don't get a match, return undefined
	//
	//  Certain parsers throw errors, as detailed below 
	//

	// Parse a block of statements (uses parseStatement recursively).
	// Throws a TypeError if we can't match a statement.
	parse_block : function(stream, expressionType) {
		var block = [], output;
		while (output = this.parse_statement(stream, expressionType)) {
			block.push(output);
			if (stream.index == stream.length) break;
		}
		if (stream.index < stream.length) throw SyntaxError("Can't match statement", stream);
		return block.join("\n");
	},

	// Parse a single statement starting at the stream index (including control blocks).
	// Control blocks may throw an error if not well formed.
	parse_statement : function(stream, expressionType) {
		// if we're dealing with a block, parse that specially
		var blockParser = this.blockStarters[stream.tokens[stream.index]];
		if (blockParser) return this[blockParser](stream);

		var lineStream = stream.nextLine();
		if (!lineStream) return;
		
console.info("parsing statement '"+lineStream+"'");

		// walk down the statement tree, trying to match the line
		var output = this.walkSyntaxBranch(expressionType || "statement", lineStream);

		// if we got something, push the main stream beyond the end of the line
		if (output != null) stream.index += lineStream.length + 1;
		
		// and return the output
		return output;
	},


	// Parse a number.
	parse_number : function(stream){ 
		var token = stream.tokens[stream.index];
		if (typeof token === "number") {
			stream.index++;
			return token;
		}
	},

	// Parse a literal string ("foo" or 'foo').
	parse_string : function(stream) {
		var token = stream.tokens[stream.index];
		if (typeof token === "string" && (token[0] == "'" || token[0] == '"')) {
			stream.index++;
			return token;
		}
	},

	// Parse an identifier (foo, _foo, $foo_bar, etc).
	parse_identifier : function(stream) {
		var token = stream.tokens[stream.index];
		// test agains the "legalIdentifier" regular expression
		if (typeof token == "string" && hope.Patterns.legalIdenfifier.test(token)) {
			stream.index++;
			return token;
		}
	},

	// Parse a property definition ("item 1 of the blah of...").
	//	Returns "blah.1" for the example above.
	parse_property : function(stream) {
		var propertyStream = stream.clone(), property = "", index = stream.index;
		// parseBranch is safe because none of the properties recurse
		while (propertyStream = parser.parseBranch(syntaxTree["property"], propertyStream)) {
			index = propertyStream.index;
			// add properties backwards
			property = (property ? propertyStream.output + "." + property : propertyStream.output);
		}
		if (property) {
			// DON'T consume the last "of"
			stream.index = index;
			return property;
		}
	},
	
	
	// Parse an expression
	// (currently only here so we can break)
	parse_expression : function(stream) {
console.info("parsing expression '"+stream.rest()+"'");
		return this.walkSyntaxBranch("expression", stream);
	},

	// Parse a condition
	// (currently only here so we can break)
	parse_condition : function(stream) {
		return this.walkSyntaxBranch("condition", stream);
	},
	
	
	// Parse an if block.
	// Will throw a TypeError if it can't fully match the block.
	parse_if : function(stream) {
		var condition = stream.extractUntil("then", 1);
		if (!condition) throw SyntaxError("Can't match if block", stream);
console.info("if block condition: "+condition);
		condition = this.parseType("condition", new Stream(condition));
		if (!condition) throw SyntaxError("Couldn't understand condition of if block", stream);
		// if multi-line:  pull body until "end if"
		if (stream.tokens[stream.index] === "EOL") {
			var body = stream.extractUntilBlockEnd("end if", "if");	// throws if no match
		} 
		// single line:  pull body until EOL
		else {
			var body = stream.extractUntil("EOL");
		}
		// parse the body
		body = this.parse_block(new Stream(body), "elseBlock");	// throws if no match
		return "if ("+condition+") {\n" + body + "\n}";
	},
	

	// Parse a repeat block.
	// Will throw a TypeError if it can't fully match the block.
	parse_repeat : function(stream) {
		var condition = stream.extractUntil("do", 1);
		if (!condition) throw SyntaxError("Couldn't match repeat block", stream);
		condition = this.parseType("repeatCondition", new Stream(condition));
		if (!condition) throw SyntaxError("Couldn't understand condition of repeat block", stream);

		// if multi-line:  pull body until "end if"
		if (stream.tokens[stream.index] === "EOL") {
			var body = stream.extractUntilBlockEnd("end repeat", "if");	// throws if no match
		} 
		// single line:  pull body until EOL
		else {
			var body = stream.extractUntil("EOL");
		}
		// parse the body
		body = this.parse_block(new Stream(body));	// throws if no match
		return condition + "\n" + body + "\n}";
	},


	// Parse a try...catch block
	// Will throw a TypeError if it can't fully match the block.
	parse_try : function(stream) {
		stream.advance();
		if (stream.tokens[stream.index] == "EOL") throw SyntaxError("Couldn't match try block", stream);

		// TODO: specific error catching?
		var body = stream.extractUntilBlockEnd("on error", "try");	// throws if no match
		body = this.parse_block(new Stream(body));					// throws if no match

		var catcher = stream.extractUntilBlockEnd("end try", "try");
		catcher = this.parse_block(new Stream(body));
		
		return "try {\n" + body + "\n} catch (error) {\n" + catcher + "\n}";
	},



	// Parse the next branch in tree, recursing if we can
	//	
	//	if we get a match:
	//		- updates the stream
	//		- returns the output as a expanded string
	//	if no match
	//		- leaves the stream alone
	//		- returns undefined
	//
	// TODO: not handling the array case (which could apply to literals as well as vars)
	parseBranch : function(tree, stream) {
		var token = stream.tokens[stream.index];
		if (!token) return;
		var atEndOfStream = (stream.index + 1 === stream.length), nextBranch, result;
		
		// try for a literal match
		if (typeof token === "string" && tree.LITERALS) {
			nextBranch = tree.LITERALS[token];
			if (nextBranch) {
console.info("matched literal "+token);
				// consume the matched token
				stream.index++;
				// and try to keep going
				return this.lookAhead(nextBranch, stream);
			}
		}
		
		// we didn't match a literal, try to match a variable type
		// NOTE: we should probably check to see if there's more than one match here...
		for (var type in tree.VARIABLES) {
			nextBranch = tree.VARIABLES[type];

			// if we've got a simple type, see if it matches without cloning the stream
			var parser = this.simpleTypes[type];
			if (parser) {
				result = this[parser](stream);	// this will advance the stream if it works
				// if it didn't match, go on to the next variable type
				if (result === undefined) continue;

console.info("matched simple type "+result);
				// it matched! 	Add the result as a substitution.
				stream.addSub(type, result);
				// and keep going
				return this.lookAhead(nextBranch, stream);
			
			}
			// we've got a complex variable type
			else {
				// if we're at the end of the stream
				if (atEndOfStream) {
					// if it is a terminal branch
					if (nextBranch.OUTPUT) {
console.info("EOS:  parsing "+type+" :" + stream.tokens.slice(stream.index));
						result = this.parseType(type, stream);
						if (result) {
console.info("EOS:  matched "+type+" : output = '"+result+"'");
							stream.addSub(type, result);
							return stream.getOutput(nextBranch.OUTPUT);
						}
					}
					// if we get here, there's no way to match, so try the next type
					continue;
				}

				// we're not at the end of the stream
				
				// complex things (hopefully???) ALWAYS  have literals after them
				if (nextBranch.VARIABLES) {
					console.warn("parsing '"+stream+"', got to "+type+" and next is a variable.  BOO!");
				}
				var endIndex, varStream;
				if (nextBranch.LITERALS) {
					// skip ahead and try to match the next literal after it
					endIndex = stream.index;
					while (token = stream.tokens[++endIndex]) {
						if (nextBranch.LITERALS[token]) break;
					}
				} else {
					endIndex = stream.length;
				}
				// the bit for this variable is the stuff between stream.index+1 and endIndex
				varStream = new Stream(stream.range(stream.index, endIndex));
				
				// try to parse it according to the type
console.info("SKIP:  parsing "+type+" :" + varStream);

				result = this.parseType(type, varStream);
				// if no match, try the next variable type
				if (result === undefined) continue;
console.info("SKIP:  matched "+type+" : output = '"+result+"'");
				// we got a match, add the sub and look ahead
				stream.addSub(type, result);
				stream.index = varStream.index;
				return this.lookAhead(nextBranch, stream);
			}
		}
		// if we get here we didn't find a match
		return undefined;
	},

	lookAhead : function(branch, stream) {
		var atEndOfStream = (stream.index === stream.length), 
			atEndOfBranch = (branch.LITERALS === undefined) && (branch.VARIABLES === undefined),
			OUTPUT
		;
		// if we COULD stop here, figure out what the output would be at this point
		if (branch.OUTPUT) OUTPUT = stream.getOutput(branch.OUTPUT);
		
console.info(atEndOfStream, atEndOfBranch, branch);
		// if there's more to process, try to keep going
		if (!atEndOfStream && !atEndOfBranch) {
			var lookAhead = this.parseBranch(branch, stream);
			// and return the results if positive
			if (lookAhead != null) {
console.info("lookAhead() returning nested '"+lookAhead+"'");
				return lookAhead;
			}
		}
		
		// if looking ahead didn't find anything, return the OUTPUT
if (OUTPUT) console.info("lookAhead() returning OUTPUT: "+OUTPUT);
		return OUTPUT;
	}
}


// DEBUG
window.parser = hope.EnglishParser;

window.parse = function(type, english) {
	var tokens = tokenize(english);
	return parser.parseType(type, new Stream(tokens));
}

})(hope);	// end hidden from global scope
