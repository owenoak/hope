
//
//	quick browser sniffing (yeah, yeah, I know...) stuck on a global "Browser" object
//
(function(){
var ua = navigator.userAgent;
window.Browser = {
	webkit 		: ua.indexOf("WebKit") > -1,
	chrome 		: ua.indexOf("Chrome") > -1,
	gecko 		: ua.indexOf("Firefox") > -1,
	opera		: ua.indexOf("Opera") > -1,
	iphone 		: ua.indexOf("iPhone") > -1,
	ipod 		: ua.indexOf("iPod") > -1,
	ipad 		: ua.indexOf("iPad") > -1,
	android 	: ua.indexOf("android") > -1,
	touchable	: ("ontouchstart" in window),
	threed		: ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix())
};
Browser.ie 		= ua.indexOf("MSIE") > -1 && !Browser.opera;
Browser.safari 	= Browser.webkit && !Browser.chrome;
Browser.ios 	= Browser.iphone || Browser.ipod || Browser.ipad;
Browser.mobile 	= Browser.ios || Browser.android;
Browser.desktop = !Browser.mobile;

Browser.statusbar = Browser.ipad && window.navigator.standalone;

// set all of the above as classes on the <html> element
var browserClasses = []
for (var key in Browser) {
	if (Browser[key]) browserClasses.push(key);
}

// is this browser supported?
Browser.supported = Browser.webkit || Browser.gecko;
if (!Browser.supported) {
	alert("This web browser is not supported.  Please use: \r\n\
	- Mozilla Firefox, \r\n\
	- Apple Safari, or \r\n\
	- Google Chrome.");
	window.location = "http://chrome.google.com"
}


// Figure out the version number, which we have to parse from the middle of the version string!
// MAN, this is hack-a-licious!
var versionPrefix 
	= Browser.gecko ? "Firefox/" 
	: Browser.chrome ? "Chrome/" 
	: Browser.safari ? "Version/" 
	: Browser.IE ? "MSIE/" 
	: "unknown"
;
var version = parseFloat(ua.substr(ua.indexOf(versionPrefix)+versionPrefix.length));
if (isNaN(version)) version = "unknown";
Browser.version = version;

// add major and minor version to the body class
browserClasses.push("v"+version);
if (parseInt(version) !== version) browserClasses.push("v"+parseInt(version));

// capability checking stubs
Browser.cssTransitions = Browser.webkit || (Browser.gecko && Browser.version > 4);
Browser.cssAnimation   = Browser.cssTransitions && !Browser.ios;

// css custom property prefix
Browser.CSS_PREFIX = (Browser.webkit ? "webkit" : "Moz");


// what events do we use for mouse down/move/up for this platform?
Browser.EVENT = {
	down			: (Browser.touchable ? "touchstart" : "mousedown"),
	move			: (Browser.touchable ? "touchmove"	 : "mousemove"),
	up				: (Browser.touchable ? "touchend"	 : "mouseup"),
	resize			: (Browser.ios 		 ? "orientationchange" : "resize"),
	animationEnd	: (Browser.CSS_PREFIX + "AnimationEnd"),
	transitionEnd	: (Browser.CSS_PREFIX + "TransitionEnd")
}

// add helpful class names to the <html> element
var html = document.querySelector("html");
html.className = (html.className ? html.className + " " : "") + browserClasses.join(" ");


})();
