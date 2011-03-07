/*** Element object extensions ***/

Script.require("{{hope}}Element.js", function(){

Element.prototype.extend({
	// url to load from
	url : new Attribute({name:"url", update:true, inherited:true}),
	
	// if true, we load automatically once we've been set up
	autoLoad : new Attribute({name:"autoLoad", type:"flag", trueIf:["",true,"true","yes"]}),

	// have we been loaded
	isLoaded : false,
	
	// are we currently loading
	isLoading : false,

	// was there a load error?
	// TODO: set to some string on error ???
	loadError : false,

	//	Load HTML and replace our innerHTML with it.
	//	Note that this automatically calls Element.initializeElements() on all children.
	//	if @callback is provided, that will be called with:
	//		(element, html, XHRequest) AFTER the html has been set.
	//		and should return (possibly massaged) html to insert.
	load : function load(url, callback, errback, scope) {
		if (this.dirtyBit) {
			this.dirtyBit.state = "loading";
			this.dirtyBit.fileName = url;
		}
		
		this.url = XHR.expand(this.url);
		url = XHR.expand(url) || this.url;
		
		var callbackHandler, errbackHandler
		if (callback) callbackHandler = this.once("loaded", callback, scope);
		if (errback) errbackHandler = this.once("loadError", errback, scope);

//TODO: if loadError, start loading again, right???
//TODO: is this right???
		if (this.isLoading && (url == this.url)) return;
		this.url = url;
	
		var onLoaded = function(html, request) {
			if (this.dirtyBit) this.dirtyBit.state = "saved";
			
			// clear the errbackHandler in case we're loaded again
			if (errbackHandler) this.un("loadError", errbackHandler);
			
			// call .processLoad() to set the html
			this.processLoad(html, request);
			this.isLoading = false;
			this.isLoaded = true;
			this.fire("loaded", html, request);
			if (this.global) hope.setReady(this.global, true, this);
			this.isReady = true;
			this.fire("ready");
		};
		var onError = function(status, request) {
			if (this.dirtyBit) this.dirtyBit.state = "error";
			
			// clear the callbackHandler in case we're loaded again
			if (callbackHandler) this.un("loaded", callbackHandler);

			this.isLoading = this.isLoaded = false;
			this.loadError = true;
			if (this.global) hope.readyError(this.global, status);
			this.fire("loadError", status, request);
		}

		this.isReady = false;
		if (this.global) hope.clearReady(this.global);

		XHR.get(url, onLoaded, onError, this, false);

		this.isLoaded = this.loadError = false;
		this.isLoading = true;
		return this;
	},

	// Called when html has actually been loaded.
	//	Default is to take the html response and set our .html to it.
	//	Override and massage the html before calling the super method to change the response.
//TODO: name
	processLoad : function(html, request) {
		this.html = html;
	}
});

Script.loaded("{{hope}}Element.js");
});// end Script.require()
