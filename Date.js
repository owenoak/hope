/*** Date extensions ***/

(function() {

hope.extend(Date, {

	// TRANSLATE ME
	//
	//		NOTE: These extract the day/month/etc from the default date.toString()
	//		  		IN U.S. ENGLISH ONLY! This is almost certain to break 
	//				in other languages/locales.
	//
	TIMEZONE_PARSER : /\((\w+)\)/,

	// TRANSLATE ME
	MONTH_NAMES : "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
	MONTH_ABBR : "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
	DOW_NAMES	: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
	DOW_ABBR	: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),

	// TRANSLATE ME
	TODAY 		: "Today",
	YESTERDAY	: "Yesterday",
	TOMORROW	: "Tomorrow",

	MSEC_IN_ONE_DAY : 24 * 60 * 60 * 1000,

	// create a date object from an ISO 8601 string.  Also handles "yesterday" and "today"
	fromString : function(string) {
		string = string.toLowerCase();
		if (string === "today") {
			return Date.today();
		} else if (string === "yesterday") {
			return Date.today().addDays(-1);
		} else {
			var date = Date.parse(string);
			if (!isNaN(date)) return new Date(date);
			// hack for Safari which doesn't have YYYY-MM-DD parsing
			string = string.replace(/-/g,"/");
			date = Date.parse(string);
			if (!isNaN(date)) return new Date(date);
		}
		return NaN;
	},
	
	// return a Date for the first second of today
	today : function() {
		return new Date().set();
	}
});

// make sure the "Date.now" method is implemented
if (!Date.now) Date.now = function() { return (new Date()).getTime() };

hope.extend(Date.prototype, {

	// set the hour/min/sec of the date
	// If you do not pass a value in, sets that value to 0
	//	eg:  date.set()	sets to start of day
	set : function(hour, min, sec) {
		this.setHours(  hour || 0);
		this.setMinutes(min  || 0);
		this.setSeconds(sec  || 0);
		this.setMilliseconds(0);
		return this;
	},
	
	// add the specified # of days (positive or negative) to the date, preserving the time
	// NOTE: this DOES work around daylight savings time
	addDays : function(days) {
		// remember hours and minutes so we can reset them
		//	in case we're crossing a daylight savings boundary
		var startHours = this.getHours(),
			startMinutes = this.getMinutes()
		;
		this.setHours(12);	
		this.setTime(this.getTime() + (days * Date.MSEC_IN_ONE_DAY));
		// reset to stored hours/mins
		this.setHours(startHours);
		this.setMinutes(startMinutes);
		return this;
	},
	
	
	// eg:  "Jan"
	getMonthAbbr : function() {
		return (""+this).match(Date.MONTH_PARSER)[1];
	},

	// eg: "January"
	getMonthName : function() {
		return Date.MONTH_NAMES[this.getMonth()];
	},
	
	// eg: "Sun"
	getDOWAbbr : function() {
		return (""+this).match(Date.DOW_PARSER)[1];
	},

	// eg: "Sunday"
	getDOW : function() {
		return Date.DOW_NAMES[this.getDay()];
	},

	// eg:  "EDT"
	// NOTE: uses the UNSAFE Date.TIMEZONE_PARSER to figure out the timezone for this date
	getTimezone : function() {
throw "date.getTimezone() not implemented";
	},

	
	// print a relative date without time, eg:  "today", "yesterday", "tomorrow", "Oct 21"
	toRelativeDate : function() {
		var today = Date.today(),
			yesterday = Date.today().addDays(-1),
			tomorrow = Date.today().addDays(1)
		;
		if (this >= today && this < tomorrow) return Date.TODAY;
		if (this >= yesterday && this < today) return Date.YESTERDAY;
		if (this >= tomorrow && this < tomorrow.addDays(1)) return Date.TOMORROW;
		
		var date = this.getDOW() + ", " + this.getMonthName() + " " + this.getDate();
		if (this.getFullYear() !== today.getFullYear()) date += " "+this.getFullYear();
		return date;
	}

	
});






Script.loaded("{{hope}}Date.js");
})();// end hiden from global scope

