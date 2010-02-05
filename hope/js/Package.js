
/** A Package is a collection of files, grouped by 'tag'. 
	All files with tag='preload' are loaded automatically.
	Package can have 'onload' handler.
*/
new hope.File.subclass({
	name 	: "Package",
	prototype : {

		// list of Script, Template, Stylesheet, etc objects, segmented by tag
		_fileTags : undefined,
		_files : undefined,

		onCreate : function() {
			this._fileTags = {};
			this._files = [];
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
			this._files.push(file);
			if (file.tag) {
				var tags = file.tag.split(hope.Patterns.splitOnSpaces), tag, i = 0;
				while (tag = tags[i++]) {
					var tag = (this._fileTags[tag] || (this._fileTags[tag] = {}));
					var type = file.classType.toLowerCase();
					var list = (tag[type] || (tag[type] = []));
					list.push(file);
				}
			}
		},
		setScript : function(file) {	this.setFile(file)	},
		setTemplate : function(file) {	this.setFile(file)	},
		setStylesheet : function(file) {this.setFile(file)	},		

		/** The packge itself was loaded, either as XML or JS. */
		onload : function(data) {
			if (hope.isAnElement(data)) {
				hope.xml.toJs(data, null, this);
			} else {
				this.set(data);
			}
			// load all preload files.
			this.loadTag("preload");
		},
		
		
		// event handlers for a tag of files being loaded
		onFilesLoaded : undefined,
		onFilesLoadError : undefined,

		/** Load all files of a particular tag which have not been loaded. */
		loadTag : function(tagName, onload) {
			var files = this._fileTags[tagName].script, i=-1, results = [];
			while (file = files[++i]) {
				var url = file.src;
				if (url.indexOf("{{") == -1) url = this.base + url;
				results[i] = url;
			}
			// TODO: weed out the loaded ones
			hope.loadScripts(results, onload);
			return this;
		},
		
		/** Mark all files in a tag as already being loaded. */
		markAsLoaded : function(tagName, classType) {
			var files = this._fileTags[tagName], i = 0, file;
			if (!files) return;
			while (file = files[i++]) {
				if (classType && file.classType != classType) continue;
				file.set("loaded", true);
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


