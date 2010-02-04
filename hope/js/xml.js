hope.extend(hope, {
	isAnElement : function(it) {
		return (it != null && it.parentNode != null);
	},
	
	// xml/html manipulation utilities
	xml : {

		/** Native browser objects to parse/serialize XML.
			Work in Gecko/Webkit, probably not elsewhere.
		*/
		_parser  	: new DOMParser(),
		_serializer : new XMLSerializer(),

		/** Given an html/xml element, return an object with all of the attributes of the element. 
			Returns null if element has no attributes.
		*/
		attributes : function(element) {
			if (!element || !element.hasAttributes()) return;
			var output = {}, i = 0, attribute;
			while (attribute = element.attributes[i++]) {
				output[attribute.name] = attribute.value;
			}
			return output;		
		},
		
		/** Given a string of XML, return an XML element (NOT document). */
		fromString : function(string, mimeType) {
			var doc = hope.xml._parser.parseFromString(string, mimeType || "text/xml");
			if (	doc.documentElement.nodeName == "parsererror"		// gecko
				||  doc.documentElement.querySelector("parsererror"))	// webkit
			{
				hope.error("Couldn't parse xml string:\n",doc.documentElement.firstChild.textContent);
			} else {
				return doc.firstChild;
			}
		},
		
		/** Given an XML/HTML element, convert it to a string */
		toString : function(element) {
			return hope.xml._serializer.serializeToString(element);
		},

		/** Given an XML/HTML element, convert it to a string */
		childrenToString : function(element) {
			var results = [], child, i=-1;
			while ( (child = element.childNodes[++i]) != null) {
				results[i] = hope.xml._serializer.serializeToString(child);
			}
			return results.join("\n");
		},


		/** Given an xml/html element, try to parse it according to known tag names.
			Default is to just create an anonymous object.
		*/
		// TODO: introduce namespaces
		Parsers : {
			hope : {}
		},
		register : function(tagName, callback, namespace) {
			if (namespace == null) namespace = "hope";
			if (!this.Parsers[namespace]) this.Parsers[namespace] = {}; 
			this.Parsers[namespace][tagName.toLowerCase()] = callback;
		},

		/** Convert an html/xml node (and all children if any) to JS object(s).
			- Element nodes will be converted to JS objects
				- object will have all element attributes as strings (courtesy of attributesOf())
				- object.__type == tag name of the element
				- object.children == hope.toObjects(element.childNodes)
			- Document nodes will call recursively on their first child
			- text/CDATA nodes will be returned as a string
			- comment and other types of nodes will return undefined
		*/
		toJs : function(node, namespace, object) {
			if (!node) return;
//console.warn(1,node);
			// note: order is based on expected frequency
			switch (node.nodeType) {
				// handle text nodes
				case Node.TEXT_NODE:
					return node.textContent;

				// handle element nodes
				case Node.ELEMENT_NODE:

// TODO: handle hooking "onXXX" things up as Events
/*
					// parse according to the namespace
					if (namespace !== "object") {
						var tagName = node.tagName.toLowerCase(),
							parser =   this.Parsers[namespace||"hope"][tagName]
									|| this.Parsers.hope[tagName]		// try in hope namespace
						;
						if (parser) {
							if (parser.fromXML) 	return parser.fromXML(node, namespace);
							else					return parser(node, namespace);
						}
					}
*/
					if (namespace != "object") {
						var tagName = node.tagName.toLowerCase(),
							constructor =   this.Parsers[namespace||"hope"][tagName]
										 || this.Parsers.hope[tagName]	// default to hope namespace
						;
//console.info(2,tagName);
						if (constructor) {
//console.warn(3,constructor.classType);
							if (constructor.parseXML) {
								return constructor.parseXML(element, namespace, object);
							} else {
								// create a new instance of the constructor
								var options = this.attributes(node);
								if (!object) {
									object = new constructor(options);
								} else {
									if (object.set) object.set(options);
									else			hope.mixin(object, options);
								}
								
								if (node.childNodes.length) {
									var i = 0, child, childObject, value = "";
									while (child = node.childNodes[i++]) {
										childObject = this.toJs(child);
										if (childObject == null) continue;
										if (typeof childObject == "string") {
											value += childObject;
										} else {
											var property = childObject.classType || child.tagName;
											if (object.set) object.set(property, childObject);
											else			object[property] = childObject;
										}
									}
									if (value != "") object.set("value", value);
								}
								return object;
							}
						}
					}

					// if we get here, parse as an anonymous object
					return this.toObject(node, namespace);

				case Node.CDATA_SECTION_NODE:
					return node.textContent;

				// for documents, return their first child
				case Node.DOCUMENT_NODE:
					return this.toJs(node.firstChild, namespace);
			}
		},

		/** Convert an element to an anonymous JS object. 
			Children will be converted via childrenToObjects, which uses toJs.
		*/
		toObject : function(element, namespace){
			var object = this.attributes(element) || {};
			object.__type = element.tagName;
			if (element.hasChildNodes()) {
				var children = this.childrenToObjects(element, namespace);
				if (children) object.children = children;
			}
			return object;
		},

		/** Given an html/xml element root, return all children as an array of JS objects. 
			- element nodes will be converted via hope.toObject()
			- comment nodes will be ignored
			- text nodes will be returned as strings
			- adjacent text nodes (including those split by comments) will be merged
			- whitespace between elements is ignored
			
		*/
		childrenToObjects : function(root, namespace, selector) {
			var elements = (selector ? hope.selectAll(selector, root) : root.childNodes);
			if (!elements.length) return null;
			var results = [], 
				element, result, 
				i = 0,
				count = 0,
				allSpaces = hope.Patterns.isAllSpaces,
				previous
			;
			while (element = elements[i++]) {
				var result = hope.xml.toJs(element);
				if (result == null) continue;
				// process strings
				if (typeof result === "string") {
					// convert all-whitespace runs to a single space
					if (allSpaces.test(result)) {
						// skip leading or trailing whitespace
						if (count == 0 || i == elements.length) continue;
						result = " ";
					}
					// if previous was a string, add the string to that
					if (typeof previous === "string") {
						previous = (results[count-1] = previous + result);
						continue;
					}
				}
	
				// if previous is all-whitespace, overwrite it
				if (allSpaces.test(previous)) {
					count--;
				}
				// otherwise add the next result
				previous = results[count++] = result;
			}
			
			return (results.length ? results : null);
		}
	}	// end xml
});

