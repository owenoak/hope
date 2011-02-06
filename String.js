/*** String extensions ***/

Script.require("{{hope}}Object.js", function() {

String.toRef = function(){ return "String" };

var _TRIM_PATTERN	= /^\s+|\s+$/g;
var _WHITESPACE_PATTERN = /^\s*$/;
var _IDENTIFIER_PATTERN = /[^\w$_]/g;
var _CAMEL_CASE_PATTERN = /[-_](.)/g;
var _UPPER_LETTER_PATTERN = /[A-Z]/g;
var _SPLIT_LIST_PATTERN = /\s*,\s*/;
var _DEFAULT_TUPLE_ITEM_DELIM = /\s*[,;]\s*/;
var _DEFAULT_TUPLE_VALUE_DELIM = /\s*[:=]\s*/;


var _upperFirstMatch = function(match, s1) { return s1.toUpperCase() }
var _underscorePlusLower = function(match) { return "-"+match.toLowerCase() }


hope.extendIf(String.prototype, {
	trim : function() {
		return this.replace(_TRIM_PATTERN, '');
	},
	
	contains : function(string) {
		return this.indexOf(string) !== -1;
	},
	
	startsWith : function(string) {
		return (this.substr(0,string.length)) == string;
	},
	
	endsWith : function(string) {
		return (this.substr(this.length - string.length)) == string;
	},

	isWhitespace : function() {
		return this !== "" && _WHITESPACE_PATTERN.test(this);
	},
	
	capitalize : function() {
		return this.charAt(0).toUpperCase() + this.substr(1);
	},

	// convert camel-case or camel_case to camelCase
	toCamelCase : function() {
		return this.replace(_CAMEL_CASE_PATTERN, _upperFirstMatch);
	},

	// convert camelCase to camel-case
	toDashCase : function() {
		return this.replace(_UPPER_LETTER_PATTERN, _underscorePlusLower);
	},

	// Convert this string to a legal identifier
	//	by converting all non-legal characters to "_"
	toIdentifier : function() {
		return this.replace(_IDENTIFIER_PATTERN, "_")
	},

	makeQuoteSafe : function() {
		return this.replace("'","\\'").replace("\n","\\n");
	},

	makeDoubleQuoteSafe : function() {
		return this.split('"').join('\\"').split("\n").join("\\n");
	},

	makeHTMLSafe : function() {
		return this.split('<').join('&lt;').split(">").join("&gt;");
	},

	// return the number of times substring occurs in this string
	count : function(substring) {
		var index = -1, count = 0;
		while ((index = 1 + this.indexOf(substring, index)) > 0) count++;
		return count;
	},
	
	splitList : function() {
		return this.split(_SPLIT_LIST_PATTERN);
	},
	
	
	// append HTML parameters to a url
	appendParameters : function(params) {
		if (typeof params !== "string") params = String.encodeUrlParameters(params);
		if (!params) return this;
		return this + (this.indexOf("?") > -1 ? "&" : "?") + params;
	},
	
	
	// do something for each tuple in a tupelized string (something with two sets of delimiters)
	//	eg:   "key=value&name=blorg" or "background:red;color:blue;"
	forEachTuple : function(itemDelimiter, valueDelimiter, callback, scope, arg3, arg4, arg5) {
		var items = this.split(itemDelimiter);
		for (var i = 0, last = items.length, item; i < last; i++) {
			if ((item = items[i]) === "") continue;
			item = item.split(valueDelimiter);
			items[i] = callback.call(scope, item[0], item[1], arg3, arg4, arg5);
		}
		return items;
	},
	
	// Split a string of tuples into an object of key:value pairs.
	//	@returns null if empty string.
	tupelize : function(itemDelimiter, valueDelimiter) {
		if (!this) return null;
		var items = this.split(itemDelimiter || _DEFAULT_TUPLE_ITEM_DELIM);
		var tuples = {};
		for (var i = 0, last = items.length, item; i < last; i++) {
			if ((item = items[i]) === "") continue;
			item = item.split(valueDelimiter || _DEFAULT_TUPLE_VALUE_DELIM);
			tuples[item[0]] = item[1];
		}
		return tuples;
	},
	
	// repeat this string N times
	times : function(count) {
		var output = [];
		while (count-- > 0) {
			output[output.length] = this;
		}
		return output.join("");
	},
	
	
	// given a string of one or more words
	//	return a set of regular expressions which will match that text at the START of a word
	getWordMatchers : function() {
		var list = [];
		this.split(" ").forEach(function(word) {
			if (word) list.push(new RegExp("\\b"+word, "i"));
		});
		return list;
	},
	
	// return true if this string matches ALL expressions passed in
	matchesExpressions : function(expressions) {
		for (var i = 0; i < expressions.length; i++) {
			if (!expressions[i].test(this)) return false;
		}
		return true;
	},
	
	
	// expand tags (eg: `<foo ... />` ) to binary tags (eg `<foo ...></foo>` )
	expandUnaryTags : function() {
		return this.replace(/<([^! \/]+)([^>]*?) ?\/>/g, "<$1$2></$1>");
	}
});


// given an object, encode into URL parameters
String.encodeUrlParameters = function(params) {
	// format the params
	var output = [];
	for (var key in params) {
		output.push(escape(key)+"="+escape(params[key]));
	}
	return output.join("&");
};



//
//	template matching
//
//	template match sequence is "foo{{match_string}}bar"
//
var _TEMPLATE_PATTERN = /\{\{([^}]*)\}\}/;
hope.extend(String.prototype, {

	// expand some HTML given a scope object
	expand : function(scope) {
		if (!scope) scope = {};
		var matches = this.split(_TEMPLATE_PATTERN);
		// yields:  ["string", "<match_string>", "string", "<match_string>", "string"]
		for (var i = 1, last = matches.length, match; i < last; i+=2) {
			var match = matches[i];
			match = hope.get(scope, match);
			matches[i] = (match == null ? "" : match);
		}
		return matches.join("");
	},
	
	// Expand us as HTML and return an ElementList of elements.
	inflate : function(scope, selector) {
		var html = (scope ? this.expand(scope) : this);
		return Element.inflate(html, selector);
	},
	
	inflateFirst : function(scope) {
		return this.inflate(scope)[0];
	}
});



Script.loaded("{{hope}}String.js");
});// end Script.require()

