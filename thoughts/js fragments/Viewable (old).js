/*
	A View is a JS object which has an on-screen representation, draw() semantics, etc.
	
	Currently each viewable should point to a single ".element" which is the dom node
	that it manipulates.
	
	Note that you can call Element methods on View and they will be passed down to the elements.


*/

new Class({
	name : "View",
	collection : "Views",


	defaults : {
		id : undefined,				// globally unique id for this control (will be generated if necessary, guaranteed to be unique)
		globalRef : undefined,		// globally unique reference string for this control (will be generated, guaranteed to be unique)

		elements : undefined,		// pointer to our main element(s) after we've been drawn
		childContainer : "",		// pointer to (or local selector for) our child container or "" to indicate our main element
		replaceElements : false,	// if true, when we redraw we replace our elements 

		parent : undefined,			// pointer to our parent control (or view, etc)
		parentElement : undefined,	// pointer to (or global selector of) our parent element
		
		autoDraw : false,			// if true, we draw automatically after being created
		
		// the following properties are generally used in templates to apply styling/etc to our
		//	outer element(s) -- it is up to the templates to include them
		
		className : undefined,		// css class name for outer element (in template, use <<@className>>)
		style : undefined,			// css style properties for outer element (in template, use <<@style>>)
		
		// event handling
		observes : undefined,		// comma-separated list of events that we handle (in template, use <<@events>>)

		movable : false,			// can we be moved around the screen with the mouse?
		// TODO: moveConstraint ?
		resizable : false,			// can we be resized with the mouse?

		draggable : false,			// can we be dragged with the mouse?
		dragType : "",				// type of thing that is being dragged (if dynamic, set in "dragStart()")

		droppable : false,			// can we be dropped on when something else is dragging?
		dropTypes : "*",			// space-separated list of types of things that can be dropped on us
									// "*" means we'll accept anything
		
		
		visible : true,				// if true, the control is visible  (affected by parents)
		enabled : true,				// if true, the control is enabled (affected by parents)
		selectableText : true,		// if true, user can select text in the control (affected by parents)

		redrawDelay : .1,			// delay in SECONDS between last '.redrawSoon()' and the actual '.redraw()'
		
		mainTemplate : undefined,	// id or pointer to our main template object [see expand()]

		//
		//	creation/destruction
		//

		initialize : function initialize(attributes) {
			this.set(attributes);
			this.makeGloballyAddressable();
			if (this.autoDraw) this.draw();
		},

		destroy : function() {
			this.orphan();
			if (this.elements) this.elements.invoke(null, "destroy");
		},


		//
		//	drawing/resizing semantics
		//
	
		draw : function(index) {
			this.beforeDraw();
			this.drawElements(index);
			this.drawChildren();
			this.setupEvents();
			this.afterDraw();
		},
		
		// do any initialization before drawing our elements
		beforeDraw : function() {},
		
		// Actually draw our elements and place them in their parent container.
		//
		// Default implementation expands our mainTemplate.
		//
		// NOTE: this should set .elements to an array of elements (or at least an empty array)
		drawElements : function(index) {
			var outerHtml = this.expand();
			this.elements = outerHtml.toElements();
			if (this.elements.length == 0) return;

			// if we're not visible, hide BEFORE inserting into the page
			if (!this.visible) this.hide();
			
			if (typeof this.parentElement == "string") this.parentElement = document.select(this.parentElement);
			
			if (!this.parentElement) return this._warn(this,".drawElements(): parentElement not defined");
			this.parentElement.addList(this.elements, index);
		},
		
		// Actually draw our children.
		// Default implementation tells each of our children to draw themselves.
		drawChildren : function() {
			if (!this.children) return;
			var container = this.getChildContainer();
			
			this.children.forEach(function(child) {
				if (!child.parentElement) child.parentElement = container;
				child.draw();
			});
		},


		// set up any event handlers
		setupEvents : function() {},
		
		// do any cleanup after drawing our elements
		afterDraw : function() {},



		// call redraw 'in a little while'
		//	use this if a lot of manipulations would call redraw() over and over
		scheduleRedraw : function() {
			this.delay("redraw", this.redrawDelay, "redraw");
		},
		
		// top-level redraw
		redraw : function() {
			this.clearDelay("redraw");
			this.beforeRedraw();
			this.redrawElements();
			this.redrawChildren();
			this.afterRedraw();
		},
		
		
		beforeRedraw : function() {},
		redrawElements : function(){
			if (this.replaceElements) {
				var oldElements = this.elements,
					newElements = this.expand().toElements()
				;
				this.parentElement.replaceList(oldElements, newElements);
				this.elements = newElements;
				
				// call setupEvents again (??? breaks encapsulation slightly to have this here)
				this.setupEvents();
			}
		},
		redrawChildren : function() {
			if (this.children) this.children.invoke("redraw");
		},
		afterRedraw : function() {},
		


		// resize to a specific (outer) width and height
		//	TODO: animation?
		resize : function resize(width, height) {
			this.invoke(selector, "resize", [width, height]);
			return this;
		},
	


		// return the sub-element of this object which should hold our children
		getChildContainer : function() {
			return this.select(this.childContainer);
		},



		// expand a template
		// called without any arguments, expands our mainTemplate
		expand : function(template) {
			var template = Template.get(template || this.mainTemplate);
			if (!template) return "";
			
			// make sure at least this object is in the array of arguments
			var args = Array.args(arguments, 1);
			if (args.length == 0) args[0] = this;
			
			return template.expand.apply(template, args);
		},


		//
		//	children semantics
		//

		// set our children to an array of children
		setChildren : function(children) {
			this.empty();
			if (children) this.addList(children);
			return this;
		},
		
		// add child to this.children at spot index
		//	if index is undefined, appends to end
		// NOTE: if this parent has been drawn, the child will be implicitly drawn as well
		add : function(child, index) {
			if (child == null) return;
			if (!this.children) this.children = [];

			// remove the child if it was previously in the list of children
// TODO: this was causing an endless loop
//			this.remove(child);

			// add it in the proper place in the list of children
			this.children.add(child, index);

			// remove us from our old parent
			if (child.parent && child.parent != this) {
				child.orphan();
			}
			
			child.parent = this;

			// if we have been drawn
			var container = this.getChildContainer();
			if (container) {
				child.parentElement = container;
				
				// if the child has not been drawn, draw it now
				if (!child.elements) {
					child.draw(index);
				}
				// otherwise add the elements to our container
				else {
					container.addList(child.elements);
				}
			}

			return this;
		},
		
		addList : function(list, index) {
			if (typeof index != "number") index = (this.children ? this.children.length : 0);
			Array.forEach(list, function(it) { this.add(it, index++) }, this);
			return this;
		},
		
		// add child to the end of our list of children
		append : function(child) {
			return this.add(child);
		},
		
		// add child to the front of our list of children
		prepend : function(child) {
			return this.add(child, 0);
		},
		
		// append this node to another node
		appendTo : function(parent) {
			parent.append(this);
		},

		// prepend this node to another node
		prependTo : function(parent) {
			parent.prepend(this);
		},
		
		// empty out our list of children
		empty : function empty() {
			if (this.children) this.children.invoke("orphan");
			return this;
		},

		// remove the child from us
		remove : function(child) {
			if (this.children) this.children.remove(child);
			if (child.parent == this) child.orphan();
			return this;
		},
		
		// remove us from our current parent
		orphan : function() {
			if (this.parent && this.parent.children) this.parent.children.remove(this);
			if (this.elements) this.elements.invoke("orphan");
			return this;
		},
		
		
		// replace one child with another
		replace : function(oldChild, newChild) {
			if (!this.children) this.children = [];
			var index = this.children.indexOf(oldChild);
			this.remove(oldChild);
			this.add(newChild, index);
			return this;
		},


		
		//
		//	ancestry
		//

		
		// return the first parent where selector function is truthy
		selectParent : function(selector) {
			var parent = this;
			while (parent == parent.parent) {
				if (selector == null || (parent.matches && parent.matches(selector))) {
					return parent;
				}
			}
		},

		// optional selector is a function -- ancestors for which selector is not truthy will not be returned
		ancestors : function(selector) {
			var ancestors = [], parent = this;
			while (parent == parent.parent) {
				if (selector == null || (parent.matches && parent.matches(selector))) {
					ancestors.push(parent);
				}
			}
			return ancestors;
		},

		// are we an immediate child of parent?
		isChildOf : function(parent) {
			return (this.parent == parent);
		},
	
		// are we a descendant of ancestor?
		isDescendantOf : function(ancestor) {
			var parent = this;
			while (parent = parent.parent) {
				if (parent == ancestor) return true;
			}
			return false;
		},
	
		// are we an ancestor of child?
		isAncestorOf : function(child) {
			return child.descendantOf(this);
		},
		

		//
		// selector semantics -- get sub-element pieces
		//
		
		// return the first sub-elements which match the given selector
		// returns null if no match (or this has no elements)
		//	passing an element simply returns that element
		//	pass empty ("" or null) selector to return the first main element
		//  pass selector starting with "*" to do a global search
		//  pass a number to return the nth main element
		//
		// NOTE: this WILL match our primary elements
		//
		select : function(selector) {
			if (selector instanceof Element) return selector;
			
			if (selector && selector.charAt(0) == "*") return document.select(selector.substr(1));
			
			if (this.elements) {
				// if "" or null selector, return the first element
				if (!selector) return this.elements[0];

				// if a number, return the nth element
				if (typeof selector == "number") return this.elements[selector];
	
				for (var i = 0, element; element = this.elements[i++];) {
					if (element.matches(selector)) return element;
					
					var it = element.select(selector);
					if (it) return it;
				}
			}
		},
		
		// return all sub-elements which match the given selector
		// returns empty array if no match
		//	pass empty ("" or null) selector to return the all main elements
		//  pass selector starting with "*" to do a global search
		selectAll : function(selector) {
			if (selector && selector.charAt(0) == "*") return document.selectAll(selector.substr(1));

			if (this.elements) {
				// if "" or null selector, return the first element
				if (!selector) return this.elements;

				// if a number, return an array containing the nth element
				if (typeof selector == "number") return [this.elements[selector]];
				
				var all = [];
				for (var i = 0, element; element = this.elements[i++];) {
					if (element.matches(selector)) all.push(element);
					
					var list = element.selectAll(selector);
					if (list.length > 0) all = Array.toArray(list, all);
				}
				return all;
			}
			return [];
		},
		
		// invoke a named method for all sub-elements which match "selector"
		// if no elements matched selector, returns undefined
		// if exactly one element matches selector, returns result of that call
		// otherwise returns array of results of call to each matched element
		invoke : function(selector, method, args) {
			var list = this.selectAll(selector);

			if (list.length == 1) {
				var it = list[0];
				method = (typeof method == "function" ? method : it[method]);
				return method.apply(it, args);
				
			} else if (list.length > 1) {
				return list.invoke(method, args);
			}
		},
		
		
		// return true if this item matches the selector
		//  Currently selector is a function (called with the control as "this" and as first argument)
		//	Eventually selector may be something like a CSS selector for selecting controls
		matches : function(selector) {
			if (!selector) return true;
			if (typeof selector != "function") return this._warn(this,"matches(",selector,"): selector not understood");
			return !!(selector.call(this, this));
		},
		
		
		
		//
		//	html manipulation
		//
		
		html : function(html, selector) {
			this.invoke(selector, "html", [html]);
		},
		
		//
		//	attribute methods
		//
		//		- these all work on our main element by default
		//		- pass a selector to have them act on sub-elements that match the selector if desired
		//
		
		// return true if ALL elements matching selector have the specified attribute
		hasAttribute : function(name, selector) {
			return (this.invoke(selector, "hasAttribute", [name]) || false).all();
		},
		
		// set the attribute "name" to "value" for all matching elements
		setAttribute : function(name, value, selector) {
			this.invoke(selector, "setAttribute", [name, value]);
			return this;
		},

		removeAttribute : function(name, selector) {
			return this.invoke(selector, "removeAttribute", [name]);
		},
		
		// add the attributes of this element to object for all matching elements
		//	returns list of attribute object
		getAttributes : function(selector) {
			return this.invoke(selector, "getAttributes");
		},
	
		// Does the list-like attribute contain a certain value?
		// Delimiter is used to split the attribute value up -- default is " ".
		attributeContains : function(name, value, delimiter, selector) {
			return (this.invoke(selector, "attributeContains", [name, value, delimiter]) || false).all();
		},
	
		// Add valueToAdd to the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		addToAttribute : function(name, valueToAdd, delimiter, selector) {
			this.invoke(selector, "addToAttribute", [name, valueToAdd, delimiter]);
			return this;
		},
	
		// Remove valueToRemove from the list-like attribute <name>.
		// Delimiter is used to split the attribute value up -- default is " ".
		removeFromAttribute : function(name, valueToRemove, delimiter, selector) {
			this.invoke(selector, "removeFromAttribute", [name, valueToRemove, delimiter]);
			return this;
		},
	
		// Toggle the presence of <value> in list-like attribute <name>.
		//	Condition can be:
		//		- undefined : we'll remove <value> if it was present or add it if it was not.
		//		- a function:  executes the function with arguments <name>,<value>
		//		- any other value: we add attribute if value is truthy
		// 	Delimiter is used to split the attribute value up -- default is " ".
		toggleAttribute : function(name, value, condition, delimiter, selector) {
			this.invoke(selector, "toggleAttribute", [name, value, condition, delimiter]);
			return this;
		},
	
		//
		// class name manipulation
		//
		hasClass : function(name, selector) {
			return (this.invoke(selector, "hasClass", [name]) || false).all();
		},
	
		addClass : function(name, selector) {
			this.invoke(selector, "addClass", [name]);
			return this;
		},
	
		removeClass : function(name, selector) {
			this.invoke(selector, "removeClass", [name]);
			return this;
		},
	
		// if element had the name, removes it -- otherwise adds it
		//	pass condition of function (called with 'this' as element)
		//		boolean, etc to set explicitly  [ see element.toggleAttribute() ]
		toggleClass : function(name, condition, selector) {
			this.invoke(selector, "toggleClass", [name]);
			return this;
		},
	
	
		// return the current style for prop (in camelCase form)
		getStyle : function(prop, selector) {
			return this.invoke(selector, "get", [prop]);
		},
		
		// set a bunch of styles either as:
		//		string of  "camelCaseProp:blah;otherProp:blah;"
		//  or  object of  {camelCaseProp:'blah', otherProp:'blah'}
		setStyle : function(styles, selector) {
			this.invoke(selector, "set", [styles]);
			return this;
		},

		//	
		//	visible semantics
		//
		
		isVisible : function() {
			if (!this.visible) return false;
			return this.ancestors().all(function(parent) {
				return this.visible;
			});
		},
		
		setVisible : function setVisible(visible, selector) {
			return (visible == false ? this.hide(selector) : this.show(selector));
		},
		
		show : function show(selector) {
			if (selector == null && this.visible != true) {
				this.visible = true;
				if (this.children) this.children.invoke("parentShown");
			}
			this.invoke(selector, "show");
			return this;
		},

		hide : function hide(selector) {
			if (selector == null && this.visible != false) {
				this.visible = false;
				if (this.children) this.children.invoke("parentHidden");
			}
			this.invoke(selector, "hide");
			return this;
		},
		
		// called by our parent when they are shown
		onParentShown : function() {
			if (this.visible == false && this._wasVisible == true) {
				this.show();
				delete this._wasVisible;
			}
		},
		
		// called by our parent when they are hidden
		onParentHidden : function() {
			if (this._wasVisible === undefined) this._wasVisible = this.visible;
			this.hide();
		},



		//	
		//	enable/disable semantics
		//
		setEnabled : function setEnabled(enable, selector) {
			return (enable == false ? this.disable(selector) : this.enable(selector));
		},
		
		enable : function enable(selector) {
			if (selector == null && this.enabled != true) {
				this.enabled = true;
				this.children && this.children.invoke("onParentEnabled");
			}
			this.invoke(selector, "enable");
			return this;
		},
		
		disable : function disable(selector) {
			if (selector == null && this.enabled != false) {
				this.enabled = false;
				if (this.elements) this.elements.invoke("disable");
				this.children && this.children.invoke("onParentDisabled");
			}
			this.invoke(selector, "disable");
			return this;
		},
		
		// called by our parent when they are enabled
		onParentEnabled : function() {
			if (this.enabled == false && this._wasEnabled == true) {
				this.enable();
				delete this._wasEnabled;
			}
		},
		
		// called by our parent when they are disabled
		onParentDisabled : function() {
			if (this._wasEnabled === undefined) this._wasEnabled = this.enabled;
			this.disable();
		},

		
		//
		// size and position
		//
	
		// return true if the element(s)' position is one of 'absolute', 'relative' or 'fixed'
		isPositioned : function(selector) {
			return (this.invoke(selector, "isPositioned") || false).all();
		},
	
		//  Make the element absolutely positioned at its current place in the document.
		//	If <toPage> is false, element stays within its container.
		//	If <toPage> is true,  element is re-rooted to <body> element.
		absolutize : function(toPage, selector) {
			this.invoke(selector, "absolutize", [toPage]);
			return this;
		},
		

		// first parent with relative/absolute positioning
		offsetParent : function(selector) {
			return this.invoke(selector, "offsetParent");
		},
		
		// all ancestors with relative/absolute positioning
		offsetParents : function() {
			return this.invoke(selector, "offsetParents");
		},
	
		offsetRect : function() {
			return this.invoke(selector, "offsetRect");
		},
	
		// return an object with {left, top, right, bottom, width, height} relative to the page
		rect : function() {
			return this.invoke(selector, "rect");
		},
	
	
		// get/set the left of this element relative to the offset parent
		left : function(left) {
			return this.invoke(selector, "left", [left]);
		},
		
		// get the left of this element relative to the entire page
		pageLeft : function() {
			return this.invoke(selector, "pageLeft");
		},
	
		// get/set the top of this element relative to the offset parent
		top : function(top) {
			return this.invoke(selector, "top", [top]);
		},
	
		// return the top of this element relative to the entire page
		pageTop : function() {
			return this.invoke(selector, "pageTop");
		},
	
		//
		// get/set outside width/height of the element (including border+padding, not including margin)
		//
		width : function(width) {
			return this.invoke(selector, "width", [width]);
		},
	
		height : function(height) {
			return this.invoke(selector, "height", [height]);
		},
	
		//
		// get/set content width/height -- does NOT include border, padding or margins
		//
		innerWidth : function(width) {
			return this.invoke(selector, "innerWidth", [width]);
		},
	
		innerHeight : function(height) {
			return this.invoke(selector, "innerHeight", [height]);
		},
	
	
	
		// return the padding for this element as {left, top, right, bottom}
		padding : function() {
			return this.invoke(selector, "padding");
		},
	
		// return the borders for this element as {left, top, right, bottom}
		borders : function() {
			return this.invoke(selector, "borders");
		},
	
		// return the margins for this element as {left, top, right, bottom}
		margins : function() {
			return this.invoke(selector, "margins");
		},
	
		// TODO: animation
		moveTo : function(left, top) {
			this.invoke(selector, "moveTo", [left, top]);
			return this;
		},
	
		// TODO: animation
		//	TODO: may want to set right & bottom if current width is a percentage...
		setRect : function(rect) {
			this.invoke(selector, "setRect", [rect]);
		},
	
	
		//
		//	scroll
		//
	
		// TODO: take a speed parameter?
		scrollTo : function(left, top) {
			this.invoke(selector, "scrollTo", [left, top]);
		},
		


		//
		//	event handling
		//
		
		
		
		
		
		
		// output the attributes that are needed for our event hookup
		//	TODO: have special case for draggable, resizable, droppable, etc
		getEventAttributes : function() {
			var output = "", observes = (this.observes || "").split(" ");
		
			// add special events to the observes list
			if (this.moveable && !observes.contains("move")) observes.push("move");
			if (this.resizable && !observes.contains("resize")) observes.push("resize");
			if (this.draggable && !observes.contains("drag")) observes.push("drag");
			if (this.droppable && !observes.contains("drop")) observes.push("drop");
			
			observes = observes.join(" ");
			if (observes) output = " observes='"+ observes + "'";
			if (this.selectableText == false) output += " selectable='false'";
			output += " target='" + this.globalRef + "'";
			
			return output;
		},
		
		set selectableText(selectable) {
			this.selectableText = (selectable = selectable != false);
			if (!this.elements) return;

			if (selectable) {
				this.removeAttribute("selectable");
			} else {
				this.addAttribute("selectable", "false");
			}
		}

	},
	
	classDefaults : {

	}
});



Debuggable.applyTo(View, "View");
