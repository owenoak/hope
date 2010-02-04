// TODO: this is too much code for what it does, concerned that it'll be slow in practice


//
//	url munging
//

// 	Given a url (and optional name of a base dir), 
//	return a hope.Url object that represents the absolute url referenced.
//
//	Use this routine rather than creating hope.Urls directly because we share urls
//		that are the same.
//	TODO: better dox
hope.url = function(url, baseDir) {
	if (url instanceof hope.Url) return url;
	return new hope.Url(url, baseDir);
}


/**
	Url breaks a URL up into pieces (much like window.location).
	Note that urls are cached, so creating them should be relatively efficient.
	
	@param {String} url URL to convert into a location object.

	@example For the url:		http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash

		url.href			=	http://www.server.com:81/path/to/a/file.xml?p1=v1&amp;p2=v2#hash
		url.fullpath		=	http://www.server.com:81/path/to/a/
		url.prefix			=	http://www.server.com:81
		url.protocol		=	http:
		url.host			=	www.server.com:81
		url.hostname		=	www.server.com
		url.port			=	81
		url.pathname		=	/path/to/a/file.xml
		url.path			=	/path/to/a/
		url.file			=	file.xml
		url.filename		=	file
		url.extension		=	.xml
		url.search			=	?p1=v1&amp;p2=v2
		url.hash			=	#hash
		url.parameters		=	{p1:"v1", p2:"v2"}

*/
function Url(url, baseDir) {
	if (typeof url !== "string") {
		if (url && ((typeof url.url === "string") || url.url instanceof hope.Url)) {
			url = url.url;
		} else {
			return hope.error("hope.Url must be initialized with a string: "+url);
		}
	}
	var name = (baseDir && url.indexOf("{{") == 0 ? baseDir + url : url);
	if (Url.Cache[name]) return Url.Cache[name];
	if (url instanceof hope.Url) return url;

	// normalize and get from the cache if present
	var absoluteUrl = Url.absolutize(url, baseDir);
	if (Url.Cache[absoluteUrl]) return Url.Cache[absoluteUrl];
	
	// match against our regular expression
	this.match = hope.Patterns.urlParser.exec(absoluteUrl);
	if (!this.match) throw hope.error("Url not understood: "+url);
	
	// remember both under the absolute URL and the original one passed in
	Url.Cache[absoluteUrl] = Url.Cache[name] = this;
}
hope.registerThing("Url", Url);

/** Static methods for the Url class. */
hope.extend(Url, {
	// methods to get the various pieces of the url.
	prototype : {
		aliases : "",
		get href()		{ return this.match[0] },
		get fullpath()	{ return "" + this.prefix + this.path },
		get prefix()	{ return this.match[2] || "" },
		get protocol()	{ return this.match[3] || "" },
		get host()		{ return this.match[4] || "" },
		get hostname()	{ return this.match[5] || "" },
		get port()		{ return this.match[6] || "" },
		get pathname()	{ return "" + this.path + this.file},
		get path()		{ return this.match[7] || "" },
		get file()		{ return this.match[8] || "" },
		get filename()	{ return this.match[9] || "" },
		get extension()	{ return this.match[10] || "" },
		get search()	{ return this.match[11] || "" },
		get hash()		{ return this.match[12] || "" },
		get parameters(){
			if (!this.search) return undefined;
			if (this._params) return this._params;
			var params = this._params = {};
			this.search.split("&").forEach(
				function(it){
					it=it.split("=");
					params[it[0]]=it[1]
				}
			)
			return params;
		},
		toString : function(){	return this.href	}
	},

	/** Named paths we can load.  Specify in a url as   "{{namedPath}}file.html" */
	NamedPaths : {
		document 	: undefined,	/** Path to the document. */
		app			: undefined,	/** Path to this 'app' -- assumed to be the same as the document. */
		hopejs		: undefined,	/** Path where the hope javascript files come from. */
		hope		: undefined,	/** The master 'hope' directory (holds js, css, images, etc). */
		lib			: undefined		/** where external libraries come from -- peer of "hope". */
	},
	
	/** Set up some named base paths. */
	initNamedPaths : function() {
		var docLocation = new Url(window.location.href).fullpath;
		this.addNamedPath("document", docLocation);
		this.addNamedPath("app", docLocation);

		// the last script we can find in the document is OUR script
		var	hopeScriptUrl = new Url(hope.hopeScript.getAttribute("src")).fullpath;
		this.addNamedPath("hopejs", hopeScriptUrl);
		this.addNamedPath("hope", new Url(hopeScriptUrl + "../").fullpath);
		this.addNamedPath("lib", new Url(hopeScriptUrl + "../lib/").fullpath);
		

		/** Flag to ignore absolute path conversion. */
		this.addNamedPath(hope.RELATIVE, "");

		//console.dir(paths);
	},
	
	addNamedPath : function(name, path) {
		hope.Url.NamedPaths[name] = path;
	},
	

	Cache : {},

	/** Convert a special characters in URL paths.
		Converts `.`, `..`, and `//`.
		Converts named paths {{foo}}.
		Yields an absolute URL, either starting with "http" or "/".
		@param {String} url URL to convert.
		@param {String} [baseDir] Name of base directory for relative urls.
		@returns {String} URL with special characters converted.
	*/
	absolutize : function(url, baseDir) {
		// first expand any named paths in the url
		url = hope.expand(url, Url.NamedPaths);
		
		// if the url doesn't start with "http", "file" or "/", it's a relative path
		// 	pre-pend the baseDir
		var start = url.substr(0,4);
		if (start != "http" && start != "file" && url.charAt(0) != "/") {
			url = (Url.NamedPaths[baseDir||"document"]||baseDir) + url;
		}
		// convert any "//", "/./" and/or "/../" entries in the url
		url = url.replace(/\/\.\/(\.\/)*/g,"/").replace(/([^:])\/\/+/g, "$1/");
		url = url.split("/");
		for (var i = 0; i < url.length; ) {
			if (url[i] == "..") 	url.splice(--i, 2);
			else					i++;
		}
		return url.join("/");
	}
});
Url.initNamedPaths();
