
/** A Package is a collection of grouped files. 
	All files with group='preload' are loaded automatically.
	Package can have 'onLoaded' handler.
*/
new hope.File.subclass({
	name 	: "Package",
	prototype : {

		// list of Script, Template, Stylesheet, etc objects, segmented by group
		_fileGroup : undefined,
		_files : undefined,

		onCreate : function() {
			this._fileGroup = {};
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
		   Puts the file in the appropriate group(s).
		*/
		setFile : function(file) {
			this._files.push(file);
			if (file.group) {
				var groups = file.group.split(hope.Patterns.splitOnCommas), group, i = 0;
				while (group = groups[i++]) {
					var group = (this._fileGroup[group] || (this._fileGroup[group] = {}));
					var list = (group[file.classType] || (group[file.classType] = []));
					list.push(file);
				}
			}
		},
		setScript : function(file) {	this.setFile(file)	},
		setTemplate : function(file) {	this.setFile(file)	},
		setStylesheet : function(file) {this.setFile(file)	},		

		/** The packge itself was loaded, either as XML or JS. */
		onLoaded : function(data) {
			if (hope.isAnElement(data)) {
				hope.xml.toJs(data, null, this);
			} else {
				this.set(data);
			}
			// load all preload files.
			this.loadGroup("preload");
		},
		
		
		// event handlers for a group of files being loaded
		onFilesLoaded : undefined,
		onFilesLoadError : undefined,

		/** Load all files of a particular group which have not been loaded. */
		loadGroup : function(groupName, onLoaded) {
			var files = this._fileGroup[groupName];
			console.warn("loading ",groupName," :",files);
			return this;
		},
		
		loadPreloads : function() {
		
		},
	
		/** Mark all files in a group as already being loaded. */
		markAsLoaded : function(groupName, classType) {
			var files = this._fileGroup[groupName], i = 0, file;
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
/*		
		,
		
		parseXML : function(element, namespace) {
			var options = hope.xml.attributes(element);
			var scripts = hope.xml.childrenToObjects(element, namespace, "script"),
				stylesheets = hope.xml.childrenToObjects(element, namespace, "stylesheet"),
				templates = hope.xml.childrenToObjects(element, namespace, "templates")
			;
			options.files = [].concat(scripts, stylesheets, templates);
			return options;
		},
		
		fromXML : function(element, namespace) {
			var options = this.parseXML(element, namespace);
			return new hope.Package(options);
		}
*/
	}
});
hope.xml.register("package", hope.Package);


