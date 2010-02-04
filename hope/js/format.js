hope.extend(hope, {	
	/** Formatters */
	format : {
		string : {
			/** Convert a string to a legal identifier.  */
			asIdentifier : function(string, camelCase) {
				if (camelCase) {
					id = hope.format.string.asCamelCase(string);
				} else {
					var id = (""+string).replace(hope.Patterns.illegalIdentifierCharacters, "_");
				}
				// make sure the id does not start with a number
				if (id.match(hope.Patterns.startsWithDigit)) id = "_"+id;
				return id;
			},
			
			
			/** converts "any old string" or "any_old_string" to "AnyOldString" */
			asInitialCaps : function(string, _startIndex) {
				if (_startIndex == null) _startIndex = 0;
				string = ""+string;
				var split = string.split(hope.Patterns.illegalIdentifierCharacters);
				if (_startIndex == 1 && split.length > 1) split[0] = split[0].toLowerCase();
				for (var i = _startIndex, it; it = split[i]; i++) {
					split[i] = it.charAt(0).toUpperCase() + it.substr(1);
				}
				return split.join("");
			},
			
			/** converts "ANY old string" or "any_old_string" to "anyOldString" */
			asCamelCase : function(string) {
				return hope.format.string.asInitialCaps(string, 1);
			}
		}
	}
});
