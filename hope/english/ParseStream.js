(function(hope) {// begin hidden from global scope

//	Structure encapsulating a 'stream' of parsing, with current position at "index"
//		.tokens 	= the full list of tokens
//		.index  	= index of the next token to look at
//		.subs  		= substitutions
//		.output		= output of a fully matched phrase
//
//	Creating ParseStreams is cheap, do this whenever you're going into a different parser context
//
var stream = hope.ParseStream = function ParseStream(tokens, index) {
	this.tokens = tokens;
	this.length = tokens.length;
	this.index = index || 0;
}
hope.ParseStream.prototype = {
	isAParseStream : true,

	// advance the stream index forward one position, returns the stream so you can chain
	advance : function() {
		this.index++;
		return this;
	},

	// return the top token in the stream WITHOUT affecting the stream
	peek : function() {
		return this.tokens[this.index];
	},
	
	// return the next token in the stream, advancing past that token
	shift : function() {
		return (this.index === this.length ? undefined : this.tokens[this.index++]);
	},
	
	// return the next line of the input as a new stream, not touching the origianl stream
	//	advancing the stream beyond the line
	nextLine : function() {
		var eolIndex = this.indexOf("EOL");
		if (!eolIndex) eolIndex = this.length;
		var line = new stream(this.tokens.slice(this.index, eolIndex));
		return line;
	},


	// return true if this stream contains the token
	//	returns the index of the token, or undefined if not found
	contains : function(token) {
		return (this.indexOf(token) !== undefined);
	},
	
	
	// return the first index of endToken beyond our current index
	//	returns the index of the token, or undefined if not found
	indexOf : function(token, delta) {
		var index = this.tokens.indexOf(token, this.index + (delta||0));
		return (index == -1 ? undefined : index);
	},
	
	// return a range of the stream, from start to end (NON inclusive)
	//	this does NOT take the index into account
	range : function(start, end) {
		return this.tokens.slice(start, end);
	},
	

	// retrun the tokens between this.index and token, non-inclusive
	// if found:
	//		- advances this.index BEYOND the match index, 
	//		- returns array of tokens the things between the start index and the match index (non-inclusive)
	// if not found, returns false
	extractUntil : function(token, delta) {
		if (delta == null) delta = 0;
		var index = this.indexOf(token, delta);
		if (index !== undefined) {
			// get the middle bit
			var middle = this.tokens.slice(this.index + delta, index);
			// advance the past the matched place
			this.index = index + 1;
			return middle;
		}
	},
	
	// return the the tokens between the current stream start and endTokens (at the start of a line)
	//		DOES NOT return the endTokens
	// 		DOES advance the stream PAST the endTokens
	//
	// if startToken is defined, we'll check for nesting start tokens
	extractUntilBlockEnd : function(endTokens, startToken) {
		var start = this.index, nextLine, nested = 0, results = [];
		while (nextLine = stream.extractUntil("EOL")) {
			if (startToken && nextLine[0] === startToken) {
				nested++;
			}
			
			if (nextLine.join(" ") === endTokens) {
				if (nested) {
					nested--;
				} else {
					return results;
				}
			}
			results = results.concat(nextLine);
			results.push("EOL");
		}
		// if we get here, we couldn't match
		throw new TypeError("Couldn't match "+endTokens);
	},


	// return the output string massaged through our subs (if we have any)
	getOutput : function(output) {
		if (typeof output == "function") {
			output = output(this);
		}
		if (this.subs) output = hope.expand(output, this.subs);
		return output;
	},

	// add a substitution by name
	addSub : function(type, value) {
		if (this.subs == null) this.subs = {};
		if (this.subs[type] != null) {
			if (this.subs[type] instanceof Array) 	this.subs[type].push(value);
			else									this.subs[type] = [this.subs[type], value];
		} else {
			this.subs[type] = value;
		}
		return this;
	},
	
	// clone this stream, optionally with new index
	// DOES NOT	clones the subs as well, if present
	clone : function(index) {
		stream = new hope.Stream(this.tokens, index||this.index);
//		if (this.subs) stream.subs = hope.extend({}, stream.subs);
		return stream;
	},
	
	rest : function() {
		return this.tokens.slice(this.index).join(" ");
	},
	
	toString : function() {
		return this.tokens.join(" ");
	}
}

//DEBUG
window.Stream = stream;

})(hope);	// end hidden from global scope
