/*** Make an element or class of elements drag-resizable by its edges by mixing this into it ***/

//TODO:  make sure the element is absolutely positioned when we start resizing!
//TODO:	 constrain to parent, constrain to only certain edges
//TODO:  when resizing, watch the arrow keys to nudge

Script.require("{{hope}}Element.js", function() {

var Resizable = {
	// mix methods into an element, but don't intialize
	mixinTo : function(it) {
		if (it.isAClass) it = it.prototype;
		hope.extendIf(it, Resizable.properties);
		return it;
	},
	
	// apply directly to an element and set things up
	applyTo : function(element) {
		this.mixinTo(element);
		element.initResize();
	}
}
hope.setGlobal("Resizable", Resizable);


Resizable.resizableEventMap = {
	"onResizeStart" : "mousedown",
	"onMouseMove" : "mousemove",
	"onMouseOut" : "mouseout"
}

Resizable.bodyEventMap = {
	"onResizing" : "mousemove",
	"onResizeEnd" : "mouseup",
//	"onResizeKey" : "keypress"
}


Resizable.properties = {
	listeners : "mousedown:onResizeStart,mousemove:onMouseMove,mouseout:onMouseOut",

	// Should we express our size in relative coordinates (percentages?)
//TODO: this is broken in WebKit, we're getting some sort of creeping error as we resize if relative is true
	resizeRelative : false,

	// # of pixels for our 'edge'
	edgeSize : new Attribute({name:"edgeSize", type:"number", value:10, inherit:true}),
	
	// edges that are resizable for us
	resizeEdges : new Attribute({name:"resizeEdges", value:"NSEWC", inherit:true}),

	// minimum # of pixels on resize
	resizeMin : new Attribute({name:"resizeMin", type:"number", value:10, inherit:true}),
	
	// Should we constrain to the dimensions of our container?
	// Default is yes
	constrain : new Attribute({name:"constrain", type:"boolean", value:true, inherit:true}),
	

	// Should we clone the element when dragging starts with the alt/option key held down?
	// Default is no
	cloneable : new Attribute({name:"cloneable", type:"boolean", value:false, inherit:true}),


	initResize : function() {
		this.hookup(Resizable.resizableEventMap);
	},
	
	clearResize : function() {
		this.unhook(Resizable.resizableEventMap);
	},
	
	
	// Called when the cursor is moving over us, to show the appropriate resize cursor
	onMouseMove : function(event) {
		if (this._resizeInfo) return;
		var edge = this.getEventEdge(event),
			resize = this._resizeMoveInfo || (this._resizeMoveInfo = {})
		;
		if (edge) {
			if (edge != resize.edge) {
				if (resize.cursor == null) resize.cursor = this.style.cursor;
				resize.edge = edge;
				this.style.cursor = this.getEdgeCursor(edge);
			}
		} else {
			if (resize.cursor != null) this.style.cursor = resize.cursor;
		}
	},
	onMouseOut : function(event) {
		if (this._resizeInfo) return;
		var resize = this._resizeMoveInfo;
		if (resize && resize.cursor != null) this.style.cursor = resize.cursor;
		delete this._resizeMoveInfo;
	},

	
	// Called when the mouse goes down in us.
	//
	// TODO: have an element attribute which turns this off temporarily or something?
	//
	onResizeStart : function(event) {
		// skip right-click
		if (event.button !== 0) return;
		
		// stop default event processing or we'll start a drag
		event.stop();

		var element = this,
			bounds = element.pageBounds,
			edge = element.getEventEdge(event, bounds)	
		;
		if (!edge) return;

		// if moving from the center, we're cloneable and the alt/option key is down
		//	create a clone and move it instead.
		if (element.cloneable && edge === "C" && event.altKey) {
			element = element.clone(true);
		}

		var resize = element._resizeInfo = {
			// name of the resize edge
			edge 		: edge,
			
			// parent coordinates
			parent 		: element.offsetParent.pageBounds,

			// current cursor
			cursor 		: (this._resizeMoveInfo ? this._resizeMoveInfo.cursor 
												: element.style.cursor)
		}

		// set resize.N true if we should resize the north side, etc
		for (var i = 0; i < edge.length; i++) {
			resize[edge[i]] = true;
		}

		if (resize.C) {
			resize.offsetX = element.pageLeft - event.pageX;
			resize.offsetY = element.pageTop - event.pageY;

			if (element.cloneable && event.altKey) {
				
			}
		} else {
			// minimum we're allowed to resize
			resize.min = element.resizeMin;
		}

		
//console.dir(resize);
		// show the appropriate cursor
		element.style.cursor =  document.body.style.cursor = element.getEdgeCursor(edge);
		
		// have the body notify us of events so we can manipulate our size
		document.body.hookup(Resizable.bodyEventMap, element);
	},
	
	
	// called when we're actually resizing
	onResizing : function(event) {
		var resize = this._resizeInfo;

		if (resize.C) {
			// constrain if the shift key is held down
			resize.constrain = event.shiftKey;
			if (resize.constrain) {
				// figure out the direction to constrain after movement of 5 px or more
				if (resize.direction == null) {
					if (resize.startX == null) {
						resize.startX = event.pageX;
						resize.startY = event.pageY;
					} else {
						var deltaX = Math.abs(event.pageX - resize.startX),
							deltaY = Math.abs(event.pageY - resize.startY)
						;
						if (deltaX > 5 || deltaY > 5) {
							if (deltaX > deltaY) {
								resize.direction = "H";
								this.style.cursor = "col-resize";
							} else {
								resize.direction = "V";
								this.style.cursor = "row-resize";
							}
						}
					}
				}
			} else {
				this.style.cursor = "move";
				delete resize.direction;
				delete resize.startX;
				delete resize.startY;
			}
			this.onResizeCenter(resize, event.pageX, event.pageY);
		} else {
			if (resize.N) 		this.onResizeTop(resize, event.pageX, event.pageY);
			else if (resize.S)	this.onResizeBottom(resize, event.pageX, event.pageY);
			if (resize.W) 		this.onResizeLeft(resize, event.pageX, event.pageY);
			else if (resize.E)  this.onResizeRight(resize, event.pageX, event.pageY);
		}

		// fire the onResized event		
		this.onResized();
	},
	
	
	onResizeCenter : function(resize, eventX, eventY) {
		var left = eventX - resize.parent.left + resize.offsetX,
			top = eventY - resize.parent.top + resize.offsetY
		;
//console.warn(resize.constrain , resize.direction);
		if (resize.constrain && resize.direction) {
			if (resize.direction === "H") 	top = this.top;
			else							left = this.left;
		}
		if (this.constrain) {
			if (left < 0) {
				left = 0;
			} else if (left + this.width > resize.parent.width) {
				left = resize.parent.width - this.width;
			}
			if (top < 0) {
				top = 0;
			} else if (top + this.height > resize.parent.height) {
				top = resize.parent.height - this.height;
			}
		}
		this._resizeTo({left:left, top:top});
	},

	onResizeLeft : function(resize, eventX, eventY) {
		var left = eventX - resize.parent.left;
		if (this.constrain && left < 0) left = 0;
		var width = this.right - left;
		if (width < resize.min) {
			width = resize.min;
			left = this.right - width;
		}
		this._resizeTo({left:left, width:width});
	},

	onResizeTop : function(resize, eventX, eventY) {
		var top = eventY - resize.parent.top;
		if (this.constrain && top < 0) top = 0;
		var height = this.bottom - top;
		if (height < resize.min) {
			height = resize.min;
			top = this.bottom - height;		
		}
		this._resizeTo({top:top, height:height});
	},

	onResizeRight : function(resize, eventX, eventY) {
		var width = eventX - this.pageLeft;
		if (this.constrain && this.pageLeft + width > resize.parent.right) {
			width = resize.parent.width - this.left;
		}
		if (width < resize.min) width = resize.min;
		this._resizeTo({width:width});
		this.width = width;
	},

	onResizeBottom : function(resize, eventX, eventY) {
		var height = eventY - this.pageTop;
		if (this.constrain && this.pageTop + height > resize.parent.bottom) {
			height = resize.parent.height - this.top;
		}
		if (height < resize.min) height = resize.min;
		this._resizeTo({height:height});
	},

	
	// Set left/top/width/height according to size passed in.
	_resizeTo : function(size) {
		if (this.resizeRelative) {
			var parent = this.offsetParent.bounds;
//console.info("width:", size.width , "was:", this.width,  "    left:",size.left, "was:",this.left);
			if (parent.width !== 0 && parent.height !== 0) {
				size.left = ((size.left != null ? size.left : this.left) / parent.width).toPercent()+"%";
				size.top = ((size.top != null ? size.top : this.top) / parent.height).toPercent()+"%";
				size.width = ((size.width != null ? size.width : this.width) / parent.width).toPercent()+"%";
				size.height = ((size.height != null ? size.height : this.height) / parent.height).toPercent()+"%";
			}
		}
		if (size.left !== undefined) this.left = size.left;
		if (size.top !== undefined) this.top = size.top;
		if (size.width !== undefined) this.width = size.width;
		if (size.height !== undefined) this.height = size.height;
	},
	
	
	// Called when the mouse goes up after we've resized.
	//	Fires event "onResized".
	onResizeEnd : function(event) {
		var resize = this._resizeInfo;
		if (!resize) return;
		
		// clear the body events
		document.body.unhook(Resizable.bodyEventMap);
		
		// reset the cursor
		this.style.cursor = resize.cursor;
		document.body.style.cursor = "";

		// clear the resize data
		delete this._resizeInfo;
	},
	

	//
	//	bring to front/send to back/etc
	//
	moveForwards : function() {
		this.moveToIndex(this.index()+2);
	},
	
	moveBackwards : function() {
		this.moveToIndex(this.index()-1);
	},
	
	moveToFront : function() {
		this.moveToIndex(-1);
	},
	
	moveToBack : function() {
		this.moveToIndex(0);
	},
	
	moveToIndex : function(index) {
		var parent = this.parentNode,
			element = parent.elements[index]
		;
		
		if (index === -1 || !element) {
			parent.appendChild(this);
		} else {
			parent.insertBefore(this, element);
		}
	},
	
	index : function() {
		return (this.parentNode ? this.parentNode.elements.indexOf(this) : -1);
	},


	// CRAP: this isn't working
	// TODO: watch for the arrow keys and nudge if they're pressed
	onResizeKey : function(event) {},
	
	// Fired when we've actually been resized.
	// Use element.bounds or element.pageBounds to get our current size.
	onResized : function() {},

	//
	// "edge" detection  (TODO: move this somewhere else?)
	//

	// Return the "edge" that a global x/y coordinate is in relative to us.
	//	pass page x/y coordinates or an event
	//	returns null if outside of us
	//	returns some combination of "N", "S", "E", "W" if in an edge
	//	returns "C" if inside but not in an edge
	getEdge : function(pageX, pageY, bounds) {
		if (!bounds) bounds = this.pageBounds;
		var x = pageX - bounds.left,
			y = pageY - bounds.top
		;
		if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) return null;
		var edgeSize = this.edgeSize,
			edges = this.resizeEdges,
			edge = ""
			nonActiveEdge = ""
		;
		if (y < edgeSize) {
			if (edges.indexOf("N") === -1) 	nonActiveEdge += "N";
			else							edge += "N"
		} else if (y > bounds.height - edgeSize) {
			if (edges.indexOf("S") === -1) 	nonActiveEdge += "S";
			else							edge += "S"
		}

		if (x < edgeSize) {
			if (edges.indexOf("W") === -1) 	nonActiveEdge += "W";
			else							edge += "W"
		} else if (x > bounds.width - edgeSize) {
			if (edges.indexOf("E") === -1) 	nonActiveEdge += "E";
			else							edge += "E"
		}
		
		if (edge) return edge;
		if (nonActiveEdge || edges.indexOf("C") == -1) return null;
		return "C";
	},
	
	// syntactic sugar for getting an edge which corresponds to a mouse event
	getEventEdge : function(event, bounds) {
		return this.getEdge(event.pageX, event.pageY, bounds);
	},
	
	// return the resize cursor to show according to an 'edge'
	getEdgeCursor : function(edge) {
		return (edge === "C" ? "move" : edge+"-resize");
	}
}


Script.loaded("{{hope}}Resizable.js");
});
