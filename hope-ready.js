/* hope.ready -- wait for arbitrary condition(s) to be true before doing something. */

// examples:
//		hope.onReady("a,b,c",console.warn, console.error); 
//		hope.onReady("b,c,d",console.warn, console.error,{once:true}); 
//		hope.onReady("a", console.warn, console.error); 
//		hope.onReady("a", console.warn, console.error,{once:true}); 
//		hope.onReady("b", console.warn, console.error); 
//		
//		hope.setReady("a");
//		hope.setReady("b");
//		hope.setReady("c");
//		hope.readyError("a");


(function(){// begin hidden from global scope

var hope = window.hope;

hope.debug.ready = hope.debug("ready");

var _readyList 		= hope._readyList = {};
var _readyHandlers 	= hope._readyHandlers = {};

// call some function when one or more things is ready
//	@thing is: a simple string, a single string with items separated by commas, an array of strings
//	@method is a function (or a function name if you set @options.scope)
//	@options are optional arguments:
//		@options.scope is scope applied to method
//		@options.args are arguments passed to bound method
//		@options.once is true if we should fire this once and then remove it
//	@returns thing you can use to `hope.un()` later
var _defaultOptions = {};
hope.onReady = function onReady(things, onready, onerror, options) {
	if (typeof things === "string") things = things.split(",");
	if (!options) options = _defaultOptions;

	// bind methods if necessary
	if (onready && (options.scope || options.args)) 
		onready = hope.bind(onready, options.scope, options.args);
	if (onerror && options.scope) 		onerror = hope.bind(onerror, options.scope);

	// check to make sure all things haven't already finished
	//	if they have, just call the handler already
//	if (hope.isReady(things)) return onready();
//	if (hope.isReadyError(things)) return onerror();

	var target = { 	things:things, 
					onready:onready, 
					onerror:onerror 
				};
	if (options.once) target.once = true;
	
	var i = -1, it;
	while (it = things[++i]) {
		(_readyHandlers[it] || (_readyHandlers[it] = [])).push(target);
	}
	return target;
}

// remove hope.onReady call
//	@thing is: a simple string, a single string with items separated by commas, an array of strings
//	@target is thing returned from original `hope.on()` setup
hope.unReady = function onReady(things, target) {
	if (typeof things === "string") things = things.split(",");
	var i = -1, handlers;
	while (handlers = _readyHandlers[++i]) handlers.remove(target);
}


// return if one or more things are ready
//	@thing is: a simple string, a single string with items separated by commas, an array of strings
hope.isReady = function(things) {
	if (typeof things === "string" && things.indexOf(",") > -1) things = things.split(",");
	return _checkReady(things, true);
}

hope.isReadyError = function(things) {
	if (typeof things === "string" && things.indexOf(",") > -1) things = things.split(",");
	return _checkReady(things, "error");
}

function _checkReady(things, value) {
	if (typeof things === "string") {
		return (_readyList[things] === value);
	} else {
		var i = -1, it;
		while (it = things[++i]) if (_readyList[it] !== value) return false;
		return true;
	}
}

// set ready state for a SINGLE thing
//	@isReady is true, null (== true), false or "error"
hope.setReady = function (thing, isReady, data) {
	if (isReady == null) isReady = true;
	_readyList[thing] = isReady;
	_fireReadyHandlers(thing, isReady, data);
}

hope.clearReady = function(thing) {
	_readyList[thing] = false;
}

hope.readyError = function(thing, data) {
	hope.setReady(thing, "error", data);
}

function _fireReadyHandlers(thing, isReady, data) {
	if (!isReady) return;
	
	var targets = _readyHandlers[thing];
	if (!targets || targets.length === 0) return;
	var t = -1, target;
	while (target = targets[++t]) {
		if (hope.debug.ready) console.debug("Ready:", target.things, _checkReady(target.things, true));
		if (isReady === "error") {
			if (target.onerror) target.onerror(thing, data);
		} else {
			if (!target.onready || !_checkReady(target.things, true)) continue;
			target.onready(target.things.join(","), data);
		}
		
		if (target.once) {
			target.things.forEach(
				function(it){ 
					if (_readyHandlers[it]) 
						_readyHandlers[it].remove(target) 
				}
			);
			t--;
		}
	}
}




// add a "DOMContentLoaded" handler to trigger the "document" ready state
// This also fires an document "ready" event.  You can watch for that as well.
document.on("DOMContentLoaded", function() {
	hope.setReady("document", true);
	
	// send a "ready" event to the document
	var ready = document.createEvent("HTMLEvents");
	ready.initEvent("ready", false, false);
	document.dispatchEvent(ready);
});

hope.unload(function() {
	var handlerMap = hope._readyHandlers;
	for (var key in handlerMap) {
		var list = handlerMap[key], i = -1, it;
		while (it = list[++i]) {
			it.onerror = it.onready = undefined;
		}
		handlerMap[key] = null;		// probably not necessary
	}
	// this is probably not necessary
	hope._readyHandlers = hope._readyList = null;
});



// define window.body and window.header when the document has finished loading
hope.onReady("document", function() {
	hope.setGlobal("$body", select("body"));
	hope.setGlobal("$head", select("head"));

	// debug -- how long before document was ready?
	hope.debug.TIME["before document ready"] = (new Date().getTime() - window.HOPE_LOAD_START_TIME);
});



})();// end hidden from global scope
