(function(hope) {	/* Begin hidden from global scope */

var slice = Array.prototype.slice;

/** 
	HTML helpers
*/

hope.extend(hope, {


	/** Co-opt the native (document||element).querySelector and .querySelectorAll */
	/** Select the first item that matches a css selector. */
	select : function(selector, context) {
		if (context == null) context = document;
		return context.querySelector(selector);
	},
	
	/** Return all items that match a css selector. */
	selectAll : function(selector, context) {
		if (context == null) context = document;
		var array = context.querySelectorAll(selector);
		return slice.call(array);
		// TODO: convert to a hope.ElementList ?
//		return (hope.ElementList ? new hope.ElementList(array) : array);
	},
	

	
	//	quick html element creation
	create : function(tagName, attributes) {
		var element = document.createElement(tagName);
		if (attributes) hope.setAttributes(element, attributes)
		return element;
	},

	// Return the html passed in transformed to a list of elements.
	//	Note: Ignores top-level children which are not elements (comments, text/whitespace, etc)
	//	TODO: check for <tr> which needs to go into a table, etc? 
	//		how does jQuery do it?  look for "wrapMap"
	toElements : function(html) {
		var parent = hope.create("div", {html:html});
		var results = [], i=0, child;
		// return only children which are elements
		while (child = parent.childNodes[i++]) {
			if (child.nodeType == Node.ELEMENT_NODE) results[results.length] = child;
		}
		return results;
	},

	// return the first element after converting the html passed into elements
	toElement : function(html) {
		return hope.toElements(html)[0];
	},

	
	// set attrributes of an object based on values passed in
	//		attributes.classname
	//		attributes.html
	//		attributes.value
	//		attributes.style
	//		attributes.parent		element or selector
	//	
	//	everything else will set an attributes
	setAttributes : function(element, attributes) {
		for (var name in attributes) {
			var value = attributes[name];
			switch (name) {
				case "classname":
				case "classname":	element.className = value; break;
				case "HTML":		
				case "html":		element.innerHTML = value; break;
				case "value":		element.value = value; break;
				case "style":		hope.setStyles(element, value); break;
				case "parent":		if (typeof value === "string") parent = hope.select(value);
									if (parent) parent.appendChild(element);
									break;
				default:			element.setAttribute(name, value);
			}
		}
		return element;
	},

	setStyles : function(element, styles) {
		for (var property in styles) {
			element.style[property] = styles[property];
		}
	},
	
	
	/** Add/remove/toggle a class from an element. Using jQuery for now. */
	addClassTo : function(element, className) {
		if (element) {
			var classes = element.className.split(hope.Patterns.runOfSpaces);
			if (classes.indexOf(className) != -1) return;
			classes.push(className);
			element.className = className.join(" ");
		}
	},
	
	removeClassFrom : function(element, className) {
		if (element) {
			var classes = element.className.split(hope.Patterns.runOfSpaces);
			var index = classes.indexOf(className);
			if (index == -1) return;
			classes.splice(index, 1);
			element.className = className.join(" ");
		}
	},

	toggleClassOf : function(element, className, condition) {
		return (condition ? hope.addClassTo : hope.removeClassFrom)(element, className);
	},
	
	/** Add/remove a 'Hidden' class on an element, which will show/hide it. 
		We'll use CSS animations in the Hidden class to animate.
	*/
	show  : function(element) {
		hope.removeClass(element, "Hidden");
	},
	hide : function(element) {
		hope.addClass(element, "Hidden");
	}
});


/* End hidden from global scope */ })(hope);

