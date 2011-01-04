/***	Number object extensions.	***/

Script.require("{{hope}}Object.js", function() {

hope.extendIf(Number.prototype, {
	// pad a number with a number of 0s
	pad : function(digits) {
		if (digits == null) digits = 2;
		var str = ""+this;
		while (str.length < digits) {
			str = "0"+str;
		}
		return str;
	},


	// return a random number between 0 and this number, inclusives
	random : function() {
		return Math.round(Math.random() * this);
	},
	
	// return an array with one thing N times
	times : function(value) {
		var list = [], count = this;
		while (count-- > 0) {
			list[list.length] = value;
		}
		return value;
	},
	
	
	// convert a number to at most @digits of precision
	precision : function(digits) {
		if (digits == null) digits = 2;
		var power = Math.pow(10, digits);
		return Math.round(this * power) / power;
	},
	
	// Convert a float between 0 and 1 to a percentage value, with X @digits of precision.
	//	@digits defaults to 0
	toPercent : function(digits) {
		var percent = this * 100;
		if (typeof digits === "number") percent = percent.precision(digits);
		return percent;
	},
	
	
	// bound a number by a min and a maz
	between : function(min, max) {
		if (this < min) return min;
		if (this > max) return max;
		return this+0;
	},
	
	// 
	commaize : function(digits) {
		var str = ""+this,
			prefix = "",
			suffix = "",
			negative = "",
			periodIndex = str.indexOf(".")
		;
		
		if (periodIndex != -1) {
			suffix = str.substring(periodIndex);
			if (typeof digits == "number") { 
				suffix = (digits == 0 ? "" : suffix.substring(0, digits+1));
				while(suffix.length < digits+1) suffix += "0";
			}
	
			str = str.substr(0, periodIndex);
		} else if (typeof digits == "number" && digits != 0) {
			suffix = "." + "0".times(digits);
		}
	
	
		if (str.charAt(0) == "-") {
			negative = "-";
			str = str.substr(1);
		}
		
		var firstSplit = str.length % 3;
		prefix += str.substring(0, firstSplit);
	
		var matches = str.substr(firstSplit).match(/\d\d\d/g) || [];
		if (prefix) matches.splice(0,0,prefix);
		return negative + matches.join(",") + suffix;
	},
	
	// is this number an even or odd integer?
	isEven : function() {
		return (this % 2 === 0);
	},
	
	isOdd : function() {
		return (this % 2 === 1);	
	}
}); 


// return a random integer:
//		if one argument, between 0 and it
//		if two argments, between min and max (non-inclusive)
window.random = function random(min, max) {
	if (arguments.length === 1) {
		max = min;
		min = 0;
	}
	return max - (max - min).random();
}


Script.loaded("{{hope}}Number.js");
});// end Script.require()
