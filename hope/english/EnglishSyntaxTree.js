(function(hope) {// begin hidden from global scope

// TODO:  - remember which variable types each type depends on by passing them around in _addToBranch
//		  - after addSyntax for a type, check its dependencies and, 
//				if they are number/string/identity only, add it to simpleTypes
			

var parser;

hope.EnglishSyntaxTree = {
	tree : {},

	// add a mess of  { english -> JS } syntax to our parse tree
	addSyntax : function(syntax) {

		// kinda hacky -- pull into our scope only once (this file is loaded before that file)
		parser = hope.EnglishParser;
		
		console.time("addSyntax");
		var tree = this.tree;
		for (var expressionType in syntax) {
			var translations = syntax[expressionType];

			var branch = tree[expressionType] || (tree[expressionType] = { BRANCH : expressionType }),
				englishPhrase, output, tokens
			;
			
			for (englishPhrase in translations) {
				output = translations[englishPhrase];

				tokens = this.tokenize(englishPhrase);
				this._addToBranch(englishPhrase, branch, tokens, output);
			}
		}
		console.timeEnd("addSyntax");
//		console.dir(tree["(direction)"]);
	},
	
	_addToBranch : function(englishPhrase, branch, tokens, output) {
		var token = tokens.shift(), nextBranch;
		if (!token) {
console.warn("empty token in _addToBranch() for:  "+englishPhrase);
			return;
		}
		
		var alternates, alternate, isALiteral = true;
		// {...|...}   : alternate literal strings (each may be multiple tokens)
		// fork into a recursive branch for each alternate
		if (token.charAt(0) == "{") {
			// split the list of alternates
			alternates = token.substr(1, token.length - 2);
			alternates = alternates.split("|");
			while (alternate = alternates.shift()) {
				// make a new token list with the alternates and the remaining tokens
				alternate = this.tokenize(alternate).concat(tokens);
				// and recurse
				this._addToBranch(englishPhrase, branch, alternate, output);
			}
			return;
		}

		// [...]  : an optional expression (literals and/or variables, may be multiple tokens)
		// fork into two branches -- one with the optional expression, one without
		if (token.charAt(0) == "[") {
			// make a new set of tokens with the optional bit
			alternate = this.tokenize(token.substr(1, token.length - 2));
			alternate = alternate.concat(tokens);
			
			// add with the optional expression
			this._addToBranch(englishPhrase, branch, alternate, output);
			
			// and without
			if (tokens.length) {
				this._addToBranch(englishPhrase, branch, tokens, output);
			} else {
				branch.OUTPUT = output;
			}
			return;
		}

		// (...)   : a variable (single token)
		// add to a sub-branch as "$"
		if (token.charAt(0) == "(") {
			// strip off the parens
			token = token.substring(1, token.length-1);
			
			nextBranch = branch.VARIABLES || (branch.VARIABLES = {});
		}
		// a literal string
		else {
			nextBranch = branch.LITERALS || (branch.LITERALS = {});
		}
		
		// move into branch for that token
		nextBranch = nextBranch[token] || (nextBranch[token] = {  BRANCH :  branch.BRANCH });
		// either a variable or a literal string -- treat the same way

		// if we're out of tokens, insert the output there
		if (tokens.length == 0) {
			nextBranch.OUTPUT = output;
		
		// otherwise recurse
		} else {
			this._addToBranch(englishPhrase, nextBranch, tokens, output);
		}
	},// addToBranch


	// special tokenizer for english syntax:
	//	separates into words with "(...)", "[...]" and "{...}" as discreet tokens
	//
	// NOTE: does not handle nested parens (which is OK
	tokenize : function(syntax) {
		// if all spaces, forget it		
		if (hope.Patterns.isAllSpaces.test(syntax)) return "";

		// split on one or more spaces
		syntax = syntax.split(hope.Patterns.runOfSpaces);
		var tokens = [], t = -1, token, endParen, nextToken;
		
		while (token = syntax[++t]) {
			// if the token starts with a parenthesis
			endParen = hope.EnglishTokenizer._endParens[token[0]];
			// if the token does not have a parenthesis inside it
			if (endParen && token.indexOf(endParen) == -1) {
				while (nextToken = syntax[++t]) {
					token += " " + nextToken;
					if (nextToken.indexOf(endParen) != -1) break;
				}
			}

			tokens.push(token);		
		}
		return (tokens.length > 0 ? tokens : "");
	}
}

// DEBUG
window.tree = function(){console.dir(hope.EnglishSyntaxTree.tree)};

})(hope);	// end hidden from global scope
