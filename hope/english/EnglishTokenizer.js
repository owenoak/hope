(function(hope) {// begin hidden from global scope


// 	TODO: to correlate the english and output JS,
//			create a shadow array where each item is 
//			the character position of where we found the token in the output stream

//	TODO: skip comments in the text stream
//
var tokenizer = hope.EnglishTokenizer = {
	// tokenize english text into an array of tokens stream
	tokenize : function(text, skipEndEOL) {
		var tokens = [], token = "", c = -1, char, end, expression;
		while (char = text[++c]) {
			switch (char) {

				// space or tab:  add current token to the stream
				case " ":
				case "\t":
					// if current token is not empty, push it into the stream
					if (token != "") {
						tokens[tokens.length] = token;
						token = "";
					}
					break;		
				
				// return:  add current token and "EOL" to the stream
				case "\n":
				case "\r":
					// if current token is not empty, push it into the stream
					if (token != "") {
						tokens[tokens.length] = token;
						token = "";
					}
					// if last token is not "EOL", push "EOL" into the stream
					if (tokens[tokens.length-1] != "EOL") {
						tokens[tokens.length] = "EOL";
					}
					break;
				
				// various types of parenthesis:  match to end paren, including nesting
				//									yields a nested array
				case "(":
				case "{":
				case "[":
					if (token != "") console.warn("Error:  starting tokenizeMatching when token is '"+token+"'");
					end = tokenizer.matchParen(text, c);
					expression = tokenizer.tokenize(text.substring(c + 1, end), true);
					tokens[tokens.length] = expression;
					
					token = "";
					c = end;
					break;

				// quotes: eat until the next matching quote
				case '"':
				case "'":
					if (token != "") console.warn("Error:  starting quote match when token is '"+token+"'");
					end = tokenizer.matchQuote(text, c);
					tokens[tokens.length] = text.substring(c, end + 1);
					token = "";
					c = end;
					break;

				// numbers: eat until end of number
				case "-":
				case ".":
				case "0":
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9":
					// if not at the start of a number, just add to current token and keep going
					if (token != "") {
						token += char;
						continue;
					} else {
						end = tokenizer.matchNumber(text, c);
						expression = parseFloat(text.substring(c, end + 1));
						if (isNaN(expression)) {
							token += text.substring(c, end + 1);
						} else {
							tokens[tokens.length] = expression;
							token = "";
							c = end;
						}
					}
					break;

				// anything else: a literal character, add to the end of the current token
				default:
					token += char;

			}
		}
		if (token != "") tokens[tokens.length] = token;
		if (skipEndEOL != true && tokens[tokens.length-1] != "EOL") tokens[tokens.length] = "EOL";
		
		return tokens;
	},

	
	// given some text and a character position for a parenthesis,
	//	return the character position for the matching end paren, 
	//  including nesting.
	matchParen : function(text, index) {
		var startParen = text[index], 
			endParen = tokenizer._endParens[startParen],
			nestedCount = 0,
			char
		;
		while (char = text[++index]) {
			if (char === startParen) {
				nestedCount++;
			} else if (char === endParen) {
				if (nestedCount > 0) {
					nestedCount--;
				} else {
					return index;
				}
			}
		}
		// if we get here, we got to the end of the text stream without finding a match
		console.warn("parser.matchParen(): couldn't find end paren "+endParen);
	},
	_endParens : { "(" : ")", "{" : "}", "[" : "]" },


	// given some text and a character position for a quote
	//	return the character position for the matching end quote
	matchQuote : function(text, index) {
		var quote = text[index], char;
		while (char = text[++index]) {
			if (char === quote) return index;
			// if we have a literal backslash, skip the next character
			if (char === "\\") ++index;
		}
		// if we get here, we got to the end of the text stream without finding a match
		console.warn("parser.matchQuote(): couldn't find end quote "+quotes);
	},

	// given some text and a character position at the start of a number
	//	return the character position for the end of the number
	matchNumber : function(text, index) {
		var char;
		while (char = text[++index]) {
			if (tokenizer._numberChars.indexOf(char) == -1) return index - 1;
			// TODO: check for multiple periods in the string?
		}
		return index - 1;
	},
	_numberChars : "0123456789."
}


})(hope);	// end hidden from global scope
