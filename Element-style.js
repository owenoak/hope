Script.require("{{hope}}Element.js", function(){
var E = Element, EP = E.prototype;

var CSS_PREFIX = Browser.CSS_PREFIX;


EP.extendIf({

	// @animation is the style of animation we run when showing/hiding
	//	(only works on browsers with CSS3 animation support - Safari & Chrome)
	//
	//	If you set it to a single animation name, that will be used for show
	//	and it's opposite will be used for hide, 
	//		eg:  "slideDown" = show: slideDown, hide, slideUp
	//
	//	If you want to do a non-standard show/hide pairing, provide two styles with colon, 
	//		eg:   "slideDown:fadeOut"
	//
	animation : new Attribute({name:"animation", value:"none", inherit:true}),

	//
	//	show/hide
	//
	visible : new Attribute({
		name : "visible",
		value : true,
		get : function() {
			if (this.showIf) {
				var oldValue = this._visible,
					newValue = this.showIf()
				;
				if (oldValue !== newValue) this.visible = newValue;
				return newValue;
			}
			return this._visible;
		},
		
		set : function(visible) {
			if (typeof visible === "string") 	visible = (visible != "no");
			else 								visible = !!visible;

			// don't run the animation if our visible has never been set before
			//	this stops the flash on initial setup
			var initialized = this.hasOwnProperty("_visible"),
				oldValue = this._visible,
				
				// callback sets our @visible and recurses to visibile children
				callback  = function() {
					this.attr("visible", visible ? null : "no");
					if (initialized) this._visibilityChanged(visible, this);
				}.bind(this)
			;

			this._visible = visible;

			if (initialized && visible !== oldValue) {
				var animation = hope.Animation.getShowHideOperation(visible, this, callback);
				if (animation) return animation.go();
			}
			callback();
		}
	}),

	showIf : new Attribute({
		name		: "showIf", 
		type		: "condition", 
		onChange 	: function(newValue) { 
			this.visible = this.visible;
		}
	}),
	
	// spread the "shown" or "hidden" element to our children who are not already shown/hidden
	_visibilityChanged : function(visible, who) {
		this.fire(visible ? "shown" : "hidden", who);
		var children = this.children;
		if (children.length === 0) return;
		var i = -1, child;
		while (child = children[++i]) {
			if (child.visible) child._visibilityChanged(visible, who);
		}
	},


	//
	//	enable/disable
	//

	// enabled attribute -- sets @disabled to "yes" if the element is not enabled
	//	You can define a @enableIf condition which will be checked when accessing @enabled.
	enabled : new Attribute({
		type : "conditional",
		name : "disabled",
		property : "enabled",
		inherit : true,
		value : true,
		condition : "enableIf",
		ifTrue : null,
		ifFalse : "yes",
		onChange : function(newValue, oldValue) {
//TODO: parentEnabled and parentDisabled ?
			if (newValue) 	this.fire("enabled");
			else			this.fire("disabled");
		}
	}),
	enableIf : new Attribute({
		name:"enableIf", 
		type:"condition",
		onChange 	: function(newValue) { 
			this.enabled = this.enabled;
		}
	}),


	//
	//	selected
	//
	
	// selected attribute -- sets @selected to "yes" if the element is 'selected'
	//	(what that means, if anything, is specific to each class)
	//	You can define a @selectIf condition which will be checked when accessing @selected.
	selected : new Attribute({
		type : "conditional",
		name : "selected",
		inherit : true,
		value : false,
		condition : "selectIf",
		ifTrue : "yes",
		ifFalse : null,
		onChange : function(newValue, oldValue) {
			if (newValue) 	this.fire("selected", newValue, oldValue);
			else			this.fire("deselected", newValue, oldValue);
		}
	}),
	selectIf : new Attribute({
		name:"selectIf", 
		type:"condition",
		onChange 	: function(newValue) { 
			this.on("parentShown", function(){this.selected});
		}
	}),



	// Set/get our css styles
	//	Getter returns our computedStyles object
	//	Setter sets key:value; styles
	styles : new Property({
		get : function() {
			// computedStyle objects SEEM TO BE cacheable per object
			return window.getComputedStyle(this, null);
//			return (this._cs || (this._cs = window.getComputedStyle(this, null)));
		},
		set : function(styles) {
			if (typeof styles !== "string") return;	//TOTHROW
			// split into tuples
			styles = styles.tupelize();
			for (var property in styles) {
				this.style[property.toCamelCase()] = styles[property];
			}
		}
	}),
	

	//TODO: take box sizing into account
	width : new Property({
		get : function() {
			return this.offsetWidth;
		},
		
		set : function(width) {
			if (typeof width === "number") width += "px";
			this.style.width = width;
		}
	}),
	
	//TODO: take box sizing into account
	height : new Property({
		get : function() {
			return this.offsetHeight;
		},
		
		set : function(height) {
			if (typeof height === "number") height += "px";
			this.style.height = height;
		}
	}),


	left : new Property({
		get : function() {
			return this.offsetLeft;
		},
		
		set : function(left) {
			if (typeof left === "number") left += "px";
			this.style.left = left;
		}
	}),
	
	top : new Property({
		get : function() {
			return this.offsetTop;
		},
		
		set : function(top) {
			if (typeof top === "number") top += "px";
			this.style.top = top;
		}
	}),
	
	right : new Property({
		get : function() {
			return parseFloat(this.styles.right);
		},
		
		set : function(right) {
			if (typeof right === "number") right = right + "px";
			this.style.right = right;
		}
	}),

	bottom : new Property({
		get : function() {
			return parseFloat(this.styles.bottom);
		},
		
		set : function(bottom) {
			if (typeof bottom === "number") bottom = bottom + "px";
			this.style.bottom = bottom;
		}
	}),


	// rectangle as "top,right,bottom,left"
	rect : new Property({
		get : function() {
			return this.top + "," + this.right + "," + this.bottom + "," + this.left;
		},
		
		set : function(bottom) {
			debugger;
		}
	}),

	//
	//	element location/size
	//
	bounds : new Property({
		get : function() {
			var bounds = {};
			bounds.left = this.left;
			bounds.top = this.top;
			bounds.width = this.width;
			bounds.height = this.height;
			bounds.right = bounds.left + bounds.width;
			bounds.bottom = bounds.top + bounds.height;
			return bounds;
		},
		
		set : function(bounds) {
			if (!bounds) return;
			if (bounds.left != null) 	this.left = bounds.left;
			if (bounds.top != null) 	this.top = bounds.top;
			if (bounds.width != null) 	this.width = bounds.width;
			if (bounds.height != null) 	this.height = bounds.height;
			if (bounds.right != null) 	this.right = bounds.right;
			if (bounds.bottom != null) 	this.bottom = bounds.bottom;
		}
	}),
	
	pageLeft : new Property({
		get : function() {
			var left = this.offsetLeft, parent = this.offsetParent;
			while (parent && parent != $body) {
				left += parent.offsetLeft;
				parent = parent.offsetParent;
			}
			return left;
		},
		
		set : function(left) {
			debugger;
		}
	}),
	
	pageTop : new Property({
		get : function() {
			var top = this.offsetTop, parent = this.offsetParent;
			while (parent && parent != $body) {
				top += parent.offsetTop;
				parent = parent.offsetParent;
			}
			return top;
		},
		
		set : function(bounds) {
			if (typeof top === "number") top += "px";
			this.style.top = top;
		}
	}),

	pageRight : new Property({
		get : function() {
			return this.pageLeft + this.width;
		},
		
		set : function(left) {
			debugger;
		}
	}),

	pageBottom : new Property({
		get : function() {
			return this.pageTop + this.height;
		},
		
		set : function(left) {
			debugger;
		}
	}),
	
	// bounds relative to the page (rather than our enclosing context)
	pageBounds : new Property({
		get : function() {
			var bounds = {};
			bounds.left = this.pageLeft;
			bounds.top = this.pageTop;
			bounds.width = this.width;
			bounds.height = this.height;
			bounds.right = bounds.left + bounds.width;
			bounds.bottom = bounds.top + bounds.height;
			return bounds;
		},
		
		set : function(bounds) {
			debugger;
		}
	}),
	
/*	
	// bounds as a percentage of our offsetParent
	relativeBounds : new Property({
		get : function() {
			var bounds = {},
				our = this.pageBounds, 
				parent = this.offsetParent.pageBounds
			;
			bounds.left = ((our.left - parent.left) / parent.width).toPercent(3)+"%";
			bounds.top = ((our.top - parent.top) / parent.height).toPercent(3)+"%";
			bounds.width = (our.width / parent.width).toPercent(3)+"%";
			bounds.height = (our.height / parent.height).toPercent(3)+"%";
			bounds.right = (our.right / parent.right).toPercent(3)+"%";
			bounds.bottom = (our.bottom / parent.bottom).toPercent(3)+"%";
			return bounds;
		},
		
		set : function(bounds) {
			debugger;
		}
	}),
*/

	// bounds as a percentage of our offsetParent
	relativeBounds : new Property({
		get : function() {
			if (!this.offsetParent) return {};
			
			var size = {},
				styles = this.styles,
				our = this.pageBounds, 
				parent = this.offsetParent.pageBounds
			;
			var left = this.style.left || ""+styles.left;
			if (!left.contains("%")) 
				left = ((our.left - parent.left) / parent.width).toPercent(3)+"%"
			size.left = left;

			var top = this.style.top || ""+styles.top;
			if (!top.contains("%")) 
				top = ((our.top - parent.top) / parent.height).toPercent(3)+"%"
			size.top = top;

			var width = this.style.width || ""+styles.width;
			if (!width.contains("%")) 
				width = (our.width / parent.width).toPercent(3)+"%"
			size.width = width;

			var height = this.style.height || ""+styles.height;
			if (!height.contains("%")) 
				height = (our.height / parent.height).toPercent(3)+"%"
			size.height = height;

//			size.right = ((parseFloat(size.left)+parseFloat(size.width)) / 100).toPercent(3)+"%";
//			size.bottom = ((parseFloat(size.top)+parseFloat(size.height)) / 100).toPercent(3)+"%";
			return size;
		},
		
		set : function(bounds) {
			debugger;
		}
	}),

	
	// move so we're under the mouse
	// TODO: anchor
	// TODO: don't go off-screen
	moveToEvent : function(event) {
		var left = event.pageX,
			top = event.pageY
		;
		if (this.offsetParent) {
			left -= this.offsetParent.pageLeft;
			top -= this.offsetParent.pageTop;
		}
		this.left = left;
		this.top = top;
	},
	

/*TODO
	// amount that we're inset (border + padding)
	insets : new Property({
		get : function() {
			var insets = {};
			var css = this.styles;
			insets.left = css.borderLeftWidth + css.paddingLeftWidth;
			insets.top = this.pageTop;
			insets.width = this.width;
			insets.height = this.height;
			insets.right = insets.left + insets.width;
			insets.bottom = insets.top + insets.height;
			return insets;
		}
	}),
*/
	
	//
	// css property checking/manipulation
	//
	
	// border radius
//TODO: normalize mozilla multiple radius values to same as W3C & WebKit
	radius : new Property({
		get : function() {
			return this.styles[CSS_PREFIX+"BorderRadius"];
		},
	
		set : function(radius) {
			this.style[CSS_PREFIX+"BorderRadius"] = radius;
		}
	}),
	
	
	// background color
	bg : new Property({
		get : function() {
			return this.styles["backgroundColor"];
		},

		set : function(bg) {
			this.style.backgroundColor = bg;
		}
	}),


	// background image
	image : new Property({
		get : function() {
			return this.styles["backgroundImage"];
		},

		set : function(url) {
			if (url && !url.contains("url")) url = "url('"+url+"')";
			this.style.backgroundImage = url;
		}
	}),


	// css opacity
	opacity : new Property({
		get : function() {
			return parseFloat(this.styles["opacity"]);
		},

		set : function(opacity) {
			this.style.opacity = opacity;
		}
	}),
	

	// set speed of css transition animations
	transitionSpeed : new Property({
		get : function() {
			var css = this.styles;
			return parseInt(css["-webkit-transition-duration"])||0;
		},

		set : function(msec) {
			this.style[CSS_PREFIX+"TransitionDuration"] = msec+"ms";
		}
	}),

	
	// rotate to some number of degrees around our transformOrigin (which is generally center)
//TODO: parse actual rotation to make sure we're not axing some other dimension
//TODO: recast as a descriptor?
	rotate : function(degrees) {
		this.style[CSS_PREFIX+"Transform"] = "rotate("+degrees+"deg)";
	},

	// rotate to some number of degrees around our transformOrigin (which is generally center)
//TODO: parse actual rotation to make sure we're not axing some other dimension
//TODO: recast as a descriptor?
	scale : function(x,y) {
		var scale = (arguments.length === 2 ? x+","+y : x);
		this.style[CSS_PREFIX+"Transform"] = "scale("+scale+")";
	},



	// css transition
	transition : new Property({
		get : function() {
			var cs = this.styles;
			if (!cs["-webkit-transition-property"]) return "";
			return [
					cs["-webkit-transition-property"],
					cs["-webkit-transition-duration"],
					cs["-webkit-transition-timing-function"]
				].join(" ");
		},

		set : function(transition) {
			this.style.webkitTransition = transition;
		}
	}),
	
	
//
//	scroll a child into view
//
	revealChild : function(child) {
		var top = child.offsetTop,
			bottom = top + child.height,
			container = this.$contianer || this,
			
			scrollTop = container.scrollTop,
			scrollBottom = scrollTop + container.height
		;
		if      (scrollBottom < top) container.scrollTop = top;
		else if (scrollTop > top) container.scrollTop = top;
//console.warn(top, bottom, scrollTop, scrollBottom);
	}
		
});// end extendIf
	

//
//	ClassList abstraction from HTML5 (already implemented in FF)
//	
//	NOTE: the FF native classList will return
//				`element.classList[<numberOutOfRange>] === ""`
//		  which we can't do.  This implementation returns `undefined` instead.
//
if (!EP.hasOwnProperty("classList")) {
	var _push = Array.prototype.push,
		_indexOf = Array.prototype.indexOf,
		_join = Array.prototype.join,
		_splice = Array.prototype.splice,
		SPLIT_PATTERN = /\s+/,
		SAFE_PATTERN = /^[A-Za-z0-9_\-$]+$/
	;

	// reintialize the list in case something has changed
	function _reinit(list, cls) {
		list.length = 0;
		var classes = list.element.className;
		if (classes) _push.apply(list, classes.trim().split(SPLIT_PATTERN))
		if (cls && !SAFE_PATTERN.test(cls)) 
			throw TypeError("String contains an invalid character");
	}

	function _ClassList(element) {
		this.element = element;
		_reinit(this);
	}
	_ClassList.prototype = {
		length : 0,
		item : function(index) {
			_reinit(this);
			return this[index] || null;
		},
		contains : function(cls) {
			_reinit(this, cls);
			var index = _indexOf.call(this, cls);
			return index > -1;
		},
		add : function(cls, index) {
			if (index === undefined) {
				_reinit(this, cls);
				index = _indexOf.call(this, cls);
			}
			if (index == -1) {
				_push.call(this, cls);
				this.element.className = _join.call(this," ");
			}
		},
		remove : function(cls, index) {
			if (index === undefined) {
				_reinit(this, cls);
				index = _indexOf.call(this, cls);
			}
			if (index > -1) {
				_splice.call(this, index, 1);
				this.element.setAttribute("class", _join.call(this," "));
			}
		},
		toggle : function(cls, index) {
			if (index === undefined) {
				_reinit(this, cls);
				index = _indexOf.call(this, cls);
			}
			if (index === -1) 	this.add(cls, index);
			else				this.remove(cls, index);
		}
	}

	//hook it up as a getter on all elements
	hope.defineGetter(EP, "classList", 
		function() {
			if (!this._classList) this._classList = new _ClassList(this);
			return this._classList;
		}
	);
}


Script.loaded("{{hope}}Element-style.js");
});// end Script.require()
