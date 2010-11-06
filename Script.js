/***	Script singleton, for loading scripts dynamically.	***/

(function(window) {	// begin hidden from global scope

// return the "src" of the last script in the document
// this is generally the script that is executing right now
function $lastScript() {
	var scripts = document.getElementsByTagName("script");
	return scripts[scripts.length-1].src;
}


// load a single script by creating a SCRIPT element for it
function $loadOne(url) {
	var script = document.createElement("script");
	script.setAttribute("src", XHR.addCacheParam(url, XHR.cache));
	Script.domParent.appendChild(script);
	if (Script.debug) console.error("Adding script for ",url);
}

var Script = {
	debug : hope.debug("Script"),

	// parent where we will insert new script elements
	domParent : document.querySelector("head"),
	
	// map of scripts which have already been successfully loaded
	loadedUrls : {},

	// map of scripts which are currently loading
	loadingUrls : {},
	
	// Append a javascript @code block as a SCRIPT tag in the DOM immediately.
	//	@callback is a function to call immediately after script executes
	//	@errback  is a function to call if the script fails (eg: syntax error)
	//				@errback will be called with the exception object.
	execute : function(code, callback, errback, note) {
		// create a informational callback if one wasn't defined
		if (!errback) errback = function(e){
			console.error("Error executing script:", e, "\n", code)
		};
		// and stick it in the global scope so we can call it on error
		var errId = "SCRIPT_ERROR_" + SCRIPT_ERROR_ID++;
		window[errId] = errback;
		// wrap the code in a try/catch to call the errback
		code = "try { "+ code +"} catch (e) { window."+errId+"(e) }";

		// create the script element and attach it to the dom
		var script = document.createElement("script");
		if (note) script.setAttribute("note", note);
		script.appendChild(document.createTextNode(code));

		// append the script node to the document head
		//	NOTE: this will execute it immediately and synchronously in FF 3.5+ and Chrome
		Script.domParent.appendChild(script);
		
		// clear the callback
		delete window[errId]
		
		if (callback) callback();
	},
	
	// Asynchronously load one or more script files, and call the callback when completed.
	load : function(urls, callback) {
		// convert to an array, splitting on commas (which are not legal in URLs)
		if (typeof urls === "string") urls = urls.split(/\s*,\s*/);

		var unloaded = [];
		if (urls) {
			// figure out which scripts have not been loaded yet
			var i = -1, url;
			while (url = urls[++i]) {
				// expand any named paths in the url
				url = XHR.expand(url);
				if (!Script.loadedUrls[url]) unloaded.push(url);
			}
		}

		if (Script.debug) {
			var script = XHR.collapse($lastScript()||"");
			console.info("loading",script,
							"\n     requiring ",urls,
							"\n     unloaded  ",unloaded
							+ (unloaded.length ? "\n     executing callback now" : "")
						);
			
			var loadMsg = function(didItWork){
				console.info("load callback "+didItWork+" for ",urls)
			};
		}

		var callbackFired = false;

		// if nothing to load, we're done
		if (unloaded.length === 0) {
			callbackFired = true;
			if (callback) callback();
			return true;
		}

		function loadCallback() {
			// bail if any of our requires are not loaded
			var i = -1, url;
			while (url = unloaded[++i]) {
				if (!Script.loadedUrls[url]) {
					if (Script.debug) loadMsg("not finished");
					return;
				}
			}
			if (Script.debug) loadMsg("finished");
			// if we get here, we're all loaded, so execute the callback
			if (!callbackFired && callback) callback();
			callbackFired = true;
		}
		
		// load any that are not currently loading
		var i = -1, url;
		while (url = unloaded[++i]) {
			if (!Script.loadingUrls[url]) {
				$loadOne(url);
				Script.loadingUrls[url] = [];
			}
			if (Script.debug) console.info("pushing callback for ",script," onto list for ",url);
			if (callback) Script.loadingUrls[url].push(loadCallback);
		}
		return false;
	},
	
	// Require a bunch of scripts (NOT executed in order) and then do some callback.
	// NOTE: this is syntatactic sugar for Script.load()
	require : function (urls, callback) {
		Script.load(urls, callback);
	},
	
	// Call this when a URL has been loaded.
	//	
	//
	//	If any other scripts have require()d this script, this will execute them.
	//
	// If you load your file via Script.load or via static load before window.onload fires, 
	//	this will be called automatically. (?)
	loaded : function(url) {
		if (Script.debug) console.warn("loaded ",url);
		url = XHR.expand(url);
		Script.loadedUrls[url] = true;
		var callbacks = Script.loadingUrls[url];
		if (callbacks) {
			var i = -1, callback;
			while (callback = callbacks[++i]) {
				callback();
			}
		}
		delete Script.loadingUrls[url];
	},
	
	
	toRef : function() {	return "Script" }
};	// end Script
hope.setGlobal("Script", Script);


// hacky that this is here, but it's a bootstrap thing
Script.loaded("{{hope}}Script.js");

})(window);// end hidden from global scope
