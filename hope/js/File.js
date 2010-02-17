
// TODO: saveable/etc as necessary


/** Generic file loader. */
new hope.Class({
	name : "File",
	prototype : {
		src : null,				// where the file loads from
		loadOptions : {},		// options for the ajax call:  method, cache, async
		loaded : false,			// are we loaded
		value : null,			// value of the file
		
		// load the file -- subclasses can completely override this (eg: scripts)
		load : function(src, options) {
			if (src) this.src = src;
			if (options) this.options = hope.extend(this.options, options);
			var file = this;
			function callback() {
				file.loaded = true;
				var data = file.processRequest(request);
				file.notify("load", data);
			}
			var request = hope.ajax(src, callback, options);
		},

		// parse the raw data returned from the file (request.responseText)
		//	 your subclass will no doubt do something more interesting
		processRequest : function(request) {
			return request.responseText;
		}
	}
});


/** ScriptLoader */


/** Script -- JS file that can be loaded.  
	You can use hope.ScriptLoader as a top-level class as well.
*/
new hope.File.subclass({
	name 	: "Script",
	load : function(src, options) {
	
	}
});
hope.xml.register("script", hope.Script);




/** XML file which can be loaded.  
	You can use hope.XmlLoader as a top-level class as well.
*/
new hope.File.subclass({
	name 	: "XmlFile",
	statics : {
		loader : new hope.Loader.subclass({
			name : "XmlLoader",
			prototype : {
				// we load as text and process the output ourselves so we can be sure to catch errors
				// TODO: this may be a problem in going from debugging -> production mode!
				cacheResults : hope.debugging === hope.OFF,
				outputType : "xml"
			}
		})
	}
});

