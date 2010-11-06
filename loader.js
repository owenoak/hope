/* 	Load the hope scripts in debug fashion.
	In a production environment, this file would be replaced with a single script file
	which concatenates all of the files listed below.
*/

(function(window){//begin hidden from global scope

window.HOPE_LOAD_START_TIME = new Date().getTime();

// scripts we always load
var scripts = [
		"_debug.js",		//DEBUG
		"Browser.js",
		"hope.js",
		"hope-ready.js",
		"XHR.js",
		"Script.js",
		"Function.js",
		"Object.js",
		"Property.js",
		"Number.js",
		"String.js",
		"Date.js",
		"Observable.js",
		"Class.js",
		"List.js",
		"Attributes.js",
		"Element.js",
		"Element-attach.js",
		"Element-load.js",
		"Element-events.js",
		"Element-style.js",
		"Animation.js",
//		"Element-animation.js",
		"ElementList.js",
		"Dataset.js",
		"Action.js",
		"Menu.js",
		"IScroller.js",
//		"Scroller.js",
		"Section.js",
		"Panel.js",
		"Stack.js",
		"Tab.js",
		"Overlay.js",
		"Resizable.js"
	]
;

// Figure out the url of this script and set the `HOPE_PATH` global to its base path.
//	This is so we can make other urls relative to `{{hope}}`.
var script = document.getElementsByTagName("script");
window.HOPE_PATH = script[script.length-1].src;
HOPE_PATH = HOPE_PATH.substr(0, HOPE_PATH.indexOf('loader.js'));


// Write a <script> tag for each of our preload scripts.
//	This will execute them in order.
var i = -1, script;
while (script = scripts[++i]) {
	document.write("<script src='" + HOPE_PATH + script + "'><"+"/script>");
}

})(window);// end hidden from global scope
