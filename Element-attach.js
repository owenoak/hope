Script.require("{{hope}}Function.js,{{hope}}Object.js,{{hope}}List.js", function(){

// set up the constructor relationship for Element.prototype
Element.prototype.constructor = Element.prototype._adapter = Element;

// container used to inflate elements
var _slice = Array.prototype.slice,
	_emptyObject = {}
;



hope.extend(Element, {
	// initialize a list of elements, no type checking
	initializeElements : function(elements) {
		if (!elements || elements.length === 0)	return;

		// duplpadoe the array in case it gets changed while we're running
		elements = _slice.call(elements,0);

		var i = -1, element;
		while (element = elements[++i]) {
			this.initializeElement(element);
		}
	},
	
	// initialize a single element, no type checking
	initializeElement : function(element) {
		if (element.hasOwnProperty("initialized")) return;
		
		// if we have an adapter for this type of element, reassign the element's prototype
		// so it 'becomes' an instance of that class
		var adapter = Element.getAdapterFor(element);
		if (adapter) {
			if (Element.debug) console.info("adapting ",element," to ",adapter);
			hope.setProto(element, adapter.prototype);
			element.constructor = adapter;

			//YUCK! Safari doesn't let you change element.constructor!
			//		Add an "adapter" property instead.
			element._adapter = adapter;
			element._setUpData();
		}
		// and then initialize it whether it has an adapter or not
		element.initialize();
		
		return element;
	}
});



var _ELEMENT = Element.prototype.ELEMENT_NODE,
	_TEXT 	 = Element.prototype.TEXT_NODE,
	_CDATA	 = Element.prototype.CDATA_SECTION_NODE
;

Element.prototype.extend({
	// set to false to skip adaptation of children after this element has been adapted
	adaptChildren : true,

	// Map of lowercase attribute name => property name for that attribute.
	//	Set up automatically if you extend an element with an Attribute
	attributeMap : new InstanceMap({name:"attributeMap", tupelize:true, inherit:true}),
	
	// Map of {child tag => handler names} for dealing with children.  Inherited from superclass.
	//	You must set this up manually.  :-(
	childProcessors : new InstanceMap({name:"childProcessors", tupelize:true, inherit:true}),

	// the 'container' is the element who owns our logical children, defaults to this element.
	//	set up in `.initialize()`, may be modified in `.initTemplate()`
	container : undefined,

	// set to true to remove TextNodes which are only whitespace during `.initChildren()`
	//	use this if whitespace between children is causing your HTML to get wonky
	ignoreWhitespace : false,
	
	// Selector to use to find our childContainer.  
	//	Override, eg, to put your children inside a scroller.
	childContainerSelector : "container",


	// Initialize this element.  Called from `Element.initializeElement()`
	//	NOTE: you generally don't need to override this, but you might want to provide
	//	`.childProcessors` or `.attributeMap` entries
	initialize : function() {
		if (this.hasOwnProperty("initialized")) throw this+"trying to initialize twice";
		if (Element.debug) console.group(this,".initialize()");

		// add known attributes to us as properties (including normalization)
		this.processChildren();
		this.processAttributes();

		// recursively initialize all element children.
		if (this.adaptChildren && this.children.length) Element.initializeElements(this.children);
		
		// initialize any listeners we have defined
		if (this.listeners) this.on(this.listeners);
		
		// show/hide element if necessary
//TODO: generalize this somehow?
		this.visible = this.visible;
		
		this.initialized = true;

//debug so we can make sure everything's attached
//		this.setAttribute("_ready",true);
		
		// if we have a 'url' attribute & are set to autoLoad, load now
		if (this.url && this.autoLoad) {
			this.loadHTML(this.url);
		} 
		// otherwise tell the system we're ready
		else {
			if (this.global && !this.url) hope.setReady(this.global);
			this.fire("ready");
		}

		if (Element.debug) console.groupEnd();
		return this;
	},
	
	
	// this element is being destroyed, clean up any circular references
	destroy : function() {
		this.parentNode.removeChild(this);
		if (this.dataId) delete ELEMENT_INSTANCE_DATA[this.dataId];
		this.constructor = this._adapter = null;
	},
	
	// initialize our children
	// NOTE: this does NOT recurse, that happens in initialize() above
	processChildren : function() {
		// make a clone of the childNodes, since it will be changed if we replace our innerHTML
		var children = _slice.apply(this.childNodes), 
			templated = (this.template != null)
		;

		if (templated) {
			if (Element.debug) console.debug(this,"inflating template");
			// completely replace our innerHTML with the template
			this.innerHTML = this.template.expand(this);
			// reset our 'container' to the first <container> child, or us
			this.container = (this.select(this.childContainerSelector) || this);
		} else {
			this.container = this;
			if (children.length === 0) return;
		}
//console.warn(children);
		
		var container = this.container,
			i = -1, 
			child, 
			handlerMap = this.childProcessors || _emptyObject,
			handler, 
			result,
			type
		;
		while (child = children[++i]) {
			switch ((type = child.nodeType)) {
				case _TEXT:
				case _CDATA:	handler = "processTextNode"; 
								break;
				case _ELEMENT: 	handler = handlerMap[child.tagName.toLowerCase()] || "processChild";
								break;
				default:		handler = null;
			}
			result = (handler ? this[handler](child) : child);

			if (Element.debug && child.nodeType === _ELEMENT) 
				console.warn(this.tagName,"processing ",child.tagName,"w/handler ",handler,"result",result);
			if (templated) {
				if (result != null) container.appendChild(result);
			} else {
				if (result == null) {
					if (child.parentNode === this) this.removeChild(child);
				} else if (result !== child) {
					child.parentNode.replaceChild(result, child);
				}
			}
		}
	},

	// Initialize attributes set directly on an element.
	//	if the attribute name is found in our attributeMap, we set the property
	//	directly on the element, thus firing any onchange handlers, etc.
	processAttributes : function() {
		// assign all attributes which are in our attributeMap to us directly
		//	this lets us pick up, eg, "visible" when set as an attribute
		var map = this.attributeMap;
		if (this.attributes.length === 0 || !map) return;
		var attrs = this.attrs, name, property;
		for (name in attrs) {
			if (property = map[name]) this[property] = attrs[name];
			
		}
	},
	
	// process a child text node -- right now this only implements the 'ignoreWhitespace'
	processTextNode : function(child) {
//console.warn("processing whitespace", child.textContent.isWhitespace());
		if (this.ignoreWhitespace === true && child.textContent.isWhitespace()) return null;
		return child;
	}
});


//
// special child element initializers.  In all of them:
//		- `this` is the parent element.
//		- `this.container` is the container for normal child elements.
//
//TOOD: some way to set this up automatically?
Element.prototype.childProcessors = {
	"on" 		: "processOnTag", 
	"js" 		: "processJsTag", 
	"attribute"	: "processAttributeTag",
	"properties": "processPropertiesTag"
};

Element.prototype.extend({
	// initialize a child which was not processed another way
	processChild : function(child) {
		if (Element.debug) console.debug("processing generic child",child);
		return child;
	},

	// <on> tag:  hook up one or more events on this object
	//	NOTE: this returns undefined so <on> elements will be removed from the parent
	processOnTag : function(element) {
		var event = element.getAttribute("event"),
			script = element.textContent
		;
		// if an 'event' attribute was defined, hook up innerHTML as a function
		if (event) {
			var args = element.getAttribute("args") || "";
			var handler = new Function(args, script);
			this.on(event, handler);
		}
		// otherwise treat contents as an anonymous object of handler:method
		else {
			eval("event = "+script);
			parent.on(event);
		}
	},
	

	// <js> tag:  arbitrary JS which gets executed.  'this' is a pointer to this element.
	//	NOTE: this returns undefined so <on> elements will be removed from the parent
	processJsTag : function(element) {
		var it = parent;
		eval(element.textContent);
	},
	
	// <attribute> tag: defines an Attribute().
	//	NOTE: this returns undefined so <on> elements will be removed from the parent
	processAttributeTag : function(element) {
		var attrs = element.attrs, 
			attr = attrs.name
		;
		attrs.update = (attrs.update !== "false");
		hope.extendProperty(this, attr, new Attribute(attrs));
		if (attrs.value !== undefined) this[attr] = attrs.value;
	},
	
	
	// <properties> tag: defines a set of properties
	//	NOTE: this returns undefined so <on> elements will be removed from the parent
	processPropertiesTag : function(element) {
		eval("element = "+element.textContent);
		if (element) this.extend(element);
	}
});


//
//	special attributes defined on all element types
//
Element.prototype.extend({
	// sub-parts, automatically attached to parent when initialized
	part : new Attribute({
		name : "part",
		onChange : function(what) {
			what = what.split(":");
			var parentSelector = what[0], partId = what[1];
			var parent = this.selectUp(parentSelector);
			if (!parent) {
				return console.error("Couldn't find parent id "+parentSelector+" for part",partId,"for"+this);
			}
//console.warn("adding ",this,"as part ",partId,"to",parent);
			parent.addPart(this, partId);
		}
	}),

	//TODO: this is kinda wacky, have a concept for this
	updater : new Attribute({
		name : "update",
		onChange : function(what) {
			if (typeof what !== "string") return;
			what = what.split(":");
			var parentSelector = what[0]
			var parent = this.selectUp(parentSelector);
			if (!parent) {
				return console.error("Couldn't find parent id "+parentSelector
							+" for part",what,"for"+this);
			}
//console.warn("adding ",this,"as part ",partId,"to",parent);
			var updateString = what.slice(1).join(":");
			parent.addUpdater(this, updateString);
		}
	}),
	

	// @contextMenu:  use this to provide a custom context menu for some element
	//	NOTE: this inherits, so you can set it on your class's prototype.
	contextMenu : new Attribute({
		name:"contextMenu", 
		inherit:true, 
		update:false
	}),

	// @listeners:  Set of event listeners to automatically hook up (additive with our superclass)
	//	Syntax is an object of { eventName : "handler" }
	//	or a string of  "eventName:handler,eventName:handler,eventName"
	//	if you don't provide a handler string, we'll default to   "onEventName"
	listeners : new InstanceMap({
		name : "listeners", 
		tupelize : true,
		inherit : true,
		value : "ready"
	})
});



//
//	Set a @global property on any element to:
//		 - make a global pointer to it, or
//		 - replace it with an existing element globally available under it's name
//
//	The default is to store the global as `app[<element.id>]`, if you want to store somewhere
//	 else, set the @global attribute to the full path from the window where the element should go.
//
//	You can change the global root FOR ALL ELEMENTS by setting Element.GLOBAL_ROOT.
//	Do this BEFORE any elements have been created.
//


Element.GLOBAL_ROOT = "app.";
Element.prototype.extend({
	// sub-parts, automatically attached to parent when initialized
	global : new Attribute({
		name : "global",
		onChange : function(id) {
			if (!id && this.id) id = Element.GLOBAL_ROOT + this.id;
			if (!id) {
				return console.warn("Trying to define global without specifying @id or @global", this);
			}
			var existing = hope.get(window, id);
		
			// if there already is a global with that name, replace us with it
			//	(NOTE: any attributes or children on the original object will be lost)
			if (existing && this.parentNode) {
				console.info("replacing global ",this,"\nfor previously declared ",existing);
				this.parentNode.replace(existing, this);
			} 
			// assign a global pointer to the element
			hope.setGlobal(id, this);
			
			// remove the @global attribute and set @_global
			this.removeAttribute("global");
			this.setAttribute("_global",id);
			
			this.data._global = id;
		}
	})
});

// add an unload function to clear all of the globals
hope.unload(Element._clearGlobals);



$Element.Subclass("$Group", {
	tag : "group",
	properties : {
		ignoreWhitespace:true
	}
});



//
//	EXPERIMENTAL AND MAYBE DANGEROUS:
//
//		when the document loads, find all Tags under the body and adapt them
//
hope.onReady("document", function() {
	var t0 = new Date().getTime();
	Element.initializeElement(document.body);
	hope.debug.TIME["initialize body elements"] = (new Date().getTime()-t0);
});


Script.loaded("{{hope}}Element-attach.js");
});// end Script.require()
