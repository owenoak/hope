
/** A Package is a collection of files, grouped by 'tag'. 
	All files with tag='preload' are loaded automatically.
	Package can have 'onload' handler.
*/
new hope.File.subclass({
	name 	: "Package",
	autoRegister : true,
	primaryKey : "name",
	prototype : {

		// list of Script, Template, Stylesheet, etc objects, segmented by tag
		Tags : undefined,

		onCreate : function(){
			this.Tags = {};
		},
		
		/** Set a bunch of files all at once. */
		setFiles : function(files) {
			var i = 0, file;
			while (file = files[i++]) {
				this.setFile(file);
			}
		},

		/* Called as we absorb each file in turn.  
		   Puts the file in the appropriate tag(s).
		*/
		setFile : function(file) {
			if (file.tag) {
				var tags = file.tag.split(hope.Patterns.splitOnSpaces), tag, i = 0;
				while (tag = tags[i++]) {
					var tag = (this.Tags[tag] || (this.Tags[tag] = {}));
					var type = file.classType.toLowerCase();
					var list = (tag[type] || (tag[type] = []));
					list.push(file);
				}
			}
		},
		setScript : function(file) {	this.setFile(file)	},
		setTemplate : function(file) {	this.setFile(file)	},
		setStylesheet : function(file) {this.setFile(file)	},		

		/** The packge itself was loaded, either as XML or JS. 
		onload : function(data) {
			if (hope.isAnElement(data)) {
				hope.xml.toJs(data, null, this);
			} else {
				this.set(data);
			}
			// load all preload files.
			this.loadTag("preload");
		},
		*/
		
		/** Load all files of a particular tag which have not been loaded. */
// TODO: load stylesheets and templates!
		loadTag : function(tagName, onload) {
			// set the onload handler passed in up to fire on load
// TODO: observeOnce???
			if (onload) this.observe("load", onload, tagName);

			// set up the callback to notify that the tag has been loaded
			var pkg = this;
			function packageLoadCallback() { pkg.notify("load", null, tagName) }

			var files = this.Tags[tagName].script, i=-1, urls = [];
			while (file = files[++i]) {
				if (file.loaded) continue;	// weed out the loaded files
				var url = hope.url.relativeTo(file.src, this.base);
				urls[i] = url;
			}
			// if all loaded, notify now
			if (urls.length == 0) 	packageLoadCallback();
			else					hope.loadScripts(urls, packageLoadCallback);

			return this;
		},
		
		/** Mark all files in a tag as already being loaded. */
		markAsLoaded : function(tagName, classType) {
			var allFiles = this.Tags[tagName], i = 0, file;
			if (!allFiles) return;
			for (var key in allFiles) {
				if (classType && classType != key) continue;
				var files = allFiles[key];
				while (file = files[i++]) {
					file.set("loaded", true);
				}
			}
			return this;
		}
		
	},
	statics : {
		loader : new hope.Loader.subclass({
			name : "PackageLoader",
			prototype : {
				cacheResults : hope.debugging === hope.OFF,
				outputType : "js/xml"
			}
		})
	}
});
hope.xml.register("package", hope.Package);
