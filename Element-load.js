/*** Element object extensions ***/

Script.require("{{hope}}Element.js", function(){

Element.prototype.extend({
	//	Load HTML and replace our innerHTML with it.
	//	Note that this automatically calls Element.initializeElements() on all children.
	//	if @callback is provided, that will be called with:
	//		(element, html, XHRequest) AFTER the html has been set.
	//		and should return (possibly massaged) html to insert.
	loadHTML : function loadHTML(url, callback, errback, scope) {
		if (!url) url = this.url;

		// use XHR.expand(url) to dereference any {{namedPaths}} in the URL
		url = XHR.expand(url);
		this.url = url;

		if (!scope) scope = this;
		var onLoaded = function(html, request) {
			this._loadedHTML(html);
			if (callback) callback.call(scope, html, request, this);
			if (this.global) hope.setReady(this.global, true, this);
			this.fire("loaded", html, request);
			this.fire("ready");
		};
		var onError = function(status, request) {
			delete this._loading;
			this._loaded = false;
			if (this.global) hope.readyError(this.global, status);
			if (errback) errback.call(scope, this, status, request);
			this.fire("loadError", status, request);
		}

		if (this.global) hope.clearReady(this.global);

		XHR.get(url, onLoaded, onError, this, false);

		this._loaded = false;
		this._loading = true;
		return this;
	},

	// Callback when html has actually been loaded.
	//	We inject it as our .html and set our ._loaded flag;
	_loadedHTML : function(html) {
		this.html = html;
		delete this._loading;
		this._loaded = true;
	},

	// url to load from
	url : new Attribute({name:"url", update:true}),
	autoLoad : new Attribute({name:"autoLoad", type:"flag", trueIf:["",true,"true","yes"]}),

	onLoaded : new Attribute({name:"onLoaded", type:"event"}),
	onLoadError : new Attribute({name:"onLoadError", type:"event"}),

	// Load some HTML and inject it after our HTML.
	//	Same @callback semantics as `element.loadHtml()`.
	inject : function inject(url, callback, errback, scope) {
		if (!scope) scope = this;
		
		var onLoaded = function(html) {
				if (callback) html = callback.apply(scope, arguments);
				if (html !== null) this.append(html);
			};
		;
		if (!errback) {
			errback = function errback() {
				console.error("Couldn't load file "+url);
			}
		}
		errback = errback.bind(scope);
		XHR.get(url, onLoaded, errback, this, false);
	}
});

Script.loaded("{{hope}}Element.js");
});// end Script.require()
