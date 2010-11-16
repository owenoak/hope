/**
 * Based on "iScroll",
 * Copyright (c) 2010 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * Version 3.7.1 - Last updated: 2010.10.08
 *
 * Modifications for hope framework (c) 2010, Matthew Owen Williams
 * Also released under MIT license
 * 
 */

/** SMART LOCK
to do this make the following mods:
line 37: add a trailing comma
line 38: smartLock: true
line 281: Add the following, inside if (that.dist > 5) {

if (!that.moved && that.options.smartLock) {
// Set the smart lock sector
that.smartLockSector = -1;
if (Math.abs(leftDelta) < 2 && topDelta < -3) {
that.smartLockSector = 1;
} else if (Math.abs(topDelta) 3) {
that.smartLockSector = 2;
} else if (Math.abs(leftDelta) 3) {
that.smartLockSector = 3;
} else if (Math.abs(topDelta) < 2 && leftDelta < -3) {
that.smartLockSector = 4;
}
}
// Apply the smartlock if needed
if (that.smartLockSector == 1 || that.smartLockSector == 3) {
newX = that.x;
leftDelta = 0;
} else if (that.smartLockSector == 2 || that.smartLockSector == 4) {
newY = that.y;
topDelta = 0;
}

**/


Script.require("{{hope}}Element-attach.js", function(){


// generate the right translation property value for this platform
function _translate(x,y) {
	if (Browser.threed) return "translate3d("+x+"px,"+y+"px"+",0)";
	else 				return "translate("+x+"px,"+y+"px"+")";
}

var _scrollerEvents = {};
_scrollerEvents[Browser.EVENT.down] = "onTouchStart";
_scrollerEvents[Browser.EVENT.move] = "onTouchMove";
//_scrollerEvents["DOMSubtreeModified"] = "onDOMModified";


var _windowEvents = {};
_windowEvents[Browser.EVENT.resize] = "onReflow";
_windowEvents[Browser.EVENT.up] = "onTouchEnd";

var _docEvents = {};
//TODO: genericise style name
if (Browser.webkit) _docEvents["webkitTransitionEnd"] = "onTransitionEnd";


// global options according to platform (can't change per scrollbar)
//	TODO: figure out which of these don't make sense for android
var _desktopCompatibility = false,
	_bounce = true,
	_bounceLock = false,
	_momentum = Browser.threed,		// only enable if CSSMatrix stuff is enabled
	_fadeScrollbar = true,
	_scrollbarAnimationTime = (_fadeScrollbar ? 300 : 0),
	_shrinkScrollbar = true,
	_wrapperOverflow = (_desktopCompatibility ? "auto" : "hidden")
;

new Element.Subclass("$IScroller", {
	tag : "scroller",
	properties : {
		listeners : "reflow",
		
		// h[orizontal], v[ertical], or b[oth]
		direction : new Attribute({name:"direction", inherit:true, value:"both",
						onChange : function() {
							this.onReflow();
						}
		}),
//TODO: rename?
		scrollHorizontally : new Getter(function(){
								var dir = this.direction.charAt(0); 
								return dir == "h" || dir == "b";
							}),
		scrollVertically : new Getter(function(){
								var dir = this.direction.charAt(0); 
								return dir == "v" || dir == "b";
							}),

		// show scrollbars ?
		showScrollbars : new Attribute({name:"showScrollbars", type:"flag", value:true, inherit:true}),

		// snap to pages?
		snap : new Attribute({name:"snap", type:"flag", value:false, inherit:true}),
		
		// go to top whenever dom changes?
		autoReset : new Attribute({name:"autoReset", type:"flag", value:false, inherit:true}),
		
		onReady : function() {
//TODO: genericise style name
			this.style.webkitTransform = _translate(0,0);
			this.parentNode.style.overflow = _wrapperOverflow;
			this.hookup(_scrollerEvents);
		},

		scrollTo: function (destX, destY, runtime) {
			var info = this._scrollInfo;
			if (!info) info = this.onReflow();
			if (!info) return setTimeout(function(){this.scrollTo.apply(this,arguments)}.bind(this),100);
				
			if (info.x == destX && info.y == destY) {
				this._resetPosition();
				return;
			}
			info.moved = true;
			this._setTransitionTime(runtime || 350);
			this._setPosition(destX, destY);

			if (runtime==='0' || runtime=='0s' || runtime=='0ms') {
				this._resetPosition();
			} else {
				// At the end of the transition check if we are still inside of the boundaries
				document.hookup(_docEvents, this);
//				if (!info.onTransitionEnd) info.onTransitionEnd = document.on("webkitTransitionEnd", this.onTransitionEnd.bind(this));
			}
		},
		
		scrollToPage: function (pageX, pageY, speed) {
			var info = this._scrollInfo;
			if (!info) info = this.onReflow();
			if (!info) return setTimeout(function(){this.scrollToPage.apply(this,arguments)}.bind(this),100);
			
			if (pageX == null) pageX = info.pageX;
			if (pageY == null) pageY = info.pageY;
			
			if (!this.snap) {
				info.pageX = -Math.round(info.x / info.scrollWidth);
				info.pageY = -Math.round(info.y / info.scrollHeight);
			}
	
			if (pageX == 'next') {
				pageX = ++info.pageX;
			} else if (pageX == 'prev') {
				pageX = --info.pageX;
			}
	
			if (pageY == 'next') {
				pageY = ++info.pageY;
			} else if (pageY == 'prev') {
				pageY = --info.pageY;
			}
	
			pageX = -pageX*info.scrollWidth;
			pageY = -pageY*info.scrollHeight;

			var snap = this._snapToPage(pageX, pageY);
			pageX = snap.x;
			pageY = snap.y;
			if (speed == null) speed = snap.time;

			this.scrollTo(pageX, pageY, speed);
		},
	
		scrollToElement: function (el, runtime) {
			el = this.select(el);
			if (!el) return;
	
			var info = this._scrollInfo;
			if (!info) info = this.onReflow();
			if (!info) return setTimeout(function(){this.scrollToElement.apply(this,arguments)}.bind(this),100);
			
			var	x = info.scrollX ? -el.offsetLeft : 0,
				y = info.scrollY ? -el.offsetTop : 0
			;
	
			if (x >= 0) {
				x = 0;
			} else if (x < info.maxScrollX) {
				x = info.maxScrollX;
			}
	
			if (y >= 0) {
				y = 0;
			} else if (y < info.maxScrollY) {
				y = info.maxScrollY;
			}
	
			this.scrollTo(x, y, runtime);
		},
	

		onTouchStart: function(event) {
			// if more than one finger is down, forget it
			if (Browser.mobile && event.touches && event.touches.length > 1) return;

			if (!this._scrollInfo) this.fire("reflow");
			if (!this.enabled) return;
	
			event.preventDefault();
//			event.stopPropagation();
			
			var info = this._scrollInfo;
			info.scrolling = true;
			info.originalTarget = event.touch.target;
	
			info.moved = false;
			info.distX = 0;
			info.distY = 0;
	
			this._setTransitionTime(0);
	
//TODO: this was breaking touch on the pad - what the hell was it doing anyway?
			// Check if the scroller is really where it should be
//			if (Browser.threed && (_momentum || this.snap)) {
//				var matrix = new WebKitCSSMatrix(window.getComputedStyle(this).webkitTransform);
//				if (matrix.event != info.x || matrix.f != info.y) {
//					document.unhook(_docEvents, this);
//					if (info.onTransitionEnd) info.onTransitionEnd = document.un("webkitTransitionEnd", info.onTransitionEnd);
//					this._setPosition(matrix.e, matrix.f);
//XXX					info.moved = true;
//				}
//			}
			info.touchStartX = event.touch.pageX;
			info.scrollStartX = info.x;
	
			info.touchStartY = event.touch.pageY;
			info.scrollStartY = info.y;
	
			info.scrollStartTime = event.timeStamp;
	
			info.directionX = 0;
			info.directionY = 0;
			
			info.startOpacity = this.opacity;
			if (info.startOpacity !== 1) this.opacity = 1;
			
			this.classList.add("scrolling");
		},
		
		onTouchMove: function(event) {
			// if more than one finger is down, forget it
			if (Browser.mobile && event.touches && event.touches.length > 1) return;

			if (!this._scrollInfo || !this._scrollInfo.scrolling) return;
//console.warn("move");
	
			var info = this._scrollInfo,
				pageX = event.touch.pageX,
				pageY = event.touch.pageY,
				leftDelta = info.scrollX ? pageX - info.touchStartX : 0,
				topDelta = info.scrollY ? pageY - info.touchStartY : 0,
				newX = info.x + leftDelta,
				newY = info.y + topDelta
			;
//console.warn(info.x,newX,leftDelta);

	
			//event.preventDefault();
//			event.stopPropagation();
	
			info.touchStartX = pageX;
			info.touchStartY = pageY;
	
			// Slow down if outside of the boundaries
			if (newX >= 0 || newX < info.maxScrollX) {
				newX = _bounce ? Math.round(info.x + leftDelta / 3) : (newX >= 0 || info.maxScrollX>=0) ? 0 : info.maxScrollX;
			}
			if (newY >= 0 || newY < info.maxScrollY) { 
				newY = _bounce ? Math.round(info.y + topDelta / 3) : (newY >= 0 || info.maxScrollY>=0) ? 0 : info.maxScrollY;
			}
	
			if (info.distX + info.distY > 5) {			// 5 pixels threshold
				// Lock scroll direction
				if (info.distX-3 > info.distY) {
					newY = info.y;
					topDelta = 0;
				} else if (info.distY-3 > info.distX) {
					newX = info.x;
					leftDelta = 0;
				}
				this._setPosition(newX, newY);
				info.moved = true;
				info.directionX = leftDelta > 0 ? -1 : 1;
				info.directionY = topDelta > 0 ? -1 : 1;
			} else {
				info.distX+= Math.abs(leftDelta);
				info.distY+= Math.abs(topDelta);
	//			info.dist+= Math.abs(leftDelta) + Math.abs(topDelta);
			}
		},
		
		onTouchEnd: function(event) {
			if (!this._scrollInfo.scrolling) return;
//console.warn("end");

			this.classList.remove("scrolling");
			
			var info = this._scrollInfo,
				time = event.timeStamp - info.scrollStartTime,
				point = event.touch,
				target, ev,
				momentumX, momentumY,
				newDuration = 0,
				newPositionX = info.x, newPositionY = info.y,
				snap;
	
			info.scrolling = false;
	
			if (info.startOpacity != 1) this.opacity = info.startOpacity;
	
			if (!info.moved) {
				this._resetPosition();
				// if touchable, generate a click event manually
				if (Browser.touchable) {
					// Find the last touched element
					target = point.target;
					while (target.nodeType != 1) {
						target = target.parentNode;
					}
					// Create the fake event
					ev = document.createEvent('MouseEvents');
					ev.initMouseEvent('click', true, true, event.view, 1,
						point.screenX, point.screenY, point.clientX, point.clientY,
						event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
						0, null);
					ev._fake = true;
					target.dispatchEvent(ev);
				}
	
				return;
			}
	
			if (!this.snap && time > 250) {			// Prevent slingshot effect
				this._resetPosition();
				return;
			}
	
			if (_momentum) {
				momentumX = info.scrollX === true
					? this._calculateMomentum(info.x - info.scrollStartX,
									time,
									_bounce ? -info.x + info.scrollWidth/5 : -info.x,
									_bounce ? info.x + info.scrollerWidth - info.scrollWidth + info.scrollWidth/5 : info.x + info.scrollerWidth - info.scrollWidth)
					: { dist: 0, time: 0 };
	
				momentumY = info.scrollY === true
					? this._calculateMomentum(info.y - info.scrollStartY,
									time,
									_bounce ? -info.y + info.scrollHeight/5 : -info.y,
									_bounce ? (info.maxScrollY < 0 ? info.y + info.scrollerHeight - info.scrollHeight : 0) + info.scrollHeight/5 : info.y + info.scrollerHeight - info.scrollHeight)
					: { dist: 0, time: 0 };
	
				newDuration = Math.max(Math.max(momentumX.time, momentumY.time), 1);		// The minimum animation length must be 1ms
				newPositionX = info.x + momentumX.dist;
				newPositionY = info.y + momentumY.dist;
			}
	
			if (this.snap) {
				snap = this._snapToPage(newPositionX, newPositionY);
				newPositionX = snap.x;
				newPositionY = snap.y;
				newDuration = Math.max(snap.time, newDuration);
			}
	
			this.scrollTo(newPositionX, newPositionY, newDuration);
		},
	
		onTransitionEnd: function () {
			var info = this._scrollInfo;
			document.unhook(_docEvents, this);
//			if (info.onTransitionEnd) info.onTransitionEnd = document.un("webkitTransitionEnd", info.onTransitionEnd);
			this._resetPosition();
		},		
		// scrolling is done (???)
		onScrollEnd : function() {},
		
		onDOMModified: function (event) {
			if (!this._scrollInfo) return;
			
			// (Hopefully) execute onDOMModified only once
			if (event.target.parentNode != this) return;
	
			this.soon("reflow");
	
			if (this.autoReset && (this._scrollInfo.x != 0 || this._scrollInfo.y != 0)) {
				this.scrollTo(0,0,'0');
			}
		},
	
		onReflow: function (event) {
			if (!this.visible) return;
			
			if (!this._scrollInfo) {
				this._scrollInfo = {
					x : 0,
					y : 0
				};
				window.hookup(_windowEvents, this);
			}
		
			var info = this._scrollInfo,
				resetX = info.x || 0, 
				resetY = info.y || 0, 
				snap
			;
			
			info.scrollWidth = this.parentNode.clientWidth;
			info.scrollHeight = this.parentNode.clientHeight;
			
			if (info.scrollWidth === 0) {
//console.warn("deferring reflow");
				this.soon("reflow");
				return null;
			}
			
			info.scrollerWidth = this.offsetWidth;
			info.scrollerHeight = this.offsetHeight;
			
			info.maxScrollX = info.scrollWidth - info.scrollerWidth;
			info.maxScrollY = info.scrollHeight - info.scrollerHeight;
			
			info.directionX = 0;
			info.directionY = 0;

			if (info.scrollX) {
				if (info.maxScrollX >= 0) {
					resetX = 0;
				} else if (info.x < info.maxScrollX) {
					resetX = info.maxScrollX;
				}
			}
			if (info.scrollY) {
				if (info.maxScrollY >= 0) {
					resetY = 0;
				} else if (info.y < info.maxScrollY) {
					resetY = info.maxScrollY;
				}
			}
	
			// Snap
			if (this.snap) {
				info.maxPageX = -Math.floor(info.maxScrollX/info.scrollWidth);
				info.maxPageY = -Math.floor(info.maxScrollY/info.scrollHeight);
	
				snap = this._snapToPage(resetX, resetY);
				resetX = snap.x;
				resetY = snap.y;
			}
	
			if (resetX != info.x || resetY != info.y) {
				this._setTransitionTime(0);
				this._setPosition(resetX, resetY, true);
			}
			
			info.scrollX = this.scrollHorizontally && (info.scrollerWidth > info.scrollWidth);
			info.scrollY = this.scrollVertically && (!_bounceLock && !this.scrollX || info.scrollerHeight > info.scrollHeight);
	
			// Update horizontal scrollbar
			if (Browser.threed && this.showScrollbars && info.scrollX) {
				info.scrollBarX = info.scrollBarX || new _iScrollbar('horizontal', this.parentNode);
				info.scrollBarX.init(info.scrollWidth, info.scrollerWidth);
			} else if (info.scrollBarX) {
				info.scrollBarX = info.scrollBarX.remove();
			}
	
			// Update vertical scrollbar
			if (Browser.threed && this.showScrollbars && info.scrollY && info.scrollerHeight > info.scrollHeight) {
				info.scrollBarY = info.scrollBarY || new _iScrollbar('vertical', this.parentNode);
				info.scrollBarY.init(info.scrollHeight, info.scrollerHeight);
			} else if (info.scrollBarY) {
				info.scrollBarY = info.scrollBarY.remove();
			}
			return info;
		},
	
		_setPosition: function (x, y, hideScrollBars) {
			var info = this._scrollInfo;
	
			info.x = x;
			info.y = y;
			if (Browser.cssTransitions) {
//TODO: genericise style name
				this.style.webkitTransform = _translate(info.x||0, info.y||0);
			} else {
				this.left = info.x;
				this.top = info.y;
			}
			
			// Move the scrollbars
			if (!hideScrollBars) {
				if (info.scrollBarX) info.scrollBarX._setPosition(info.x);
				if (info.scrollBarY) info.scrollBarY._setPosition(info.y);
			}
			
			if (this.snap) {
				if (info._lastPageX != info.pageX) {
					this.fire("pageShown", info.pageX, info.pageY);
					info._lastPageX = info.pageX;
				}
			}
		},
		
		_setTransitionTime: function(time) {
			var info = this._scrollInfo;
	
			time = time || 0;
			this.transitionSpeed = time;//300;//time;
			
			if (info.scrollBarX) {
				info.scrollBarX.bar.transitionSpeed = time;
				info.scrollBarX.wrapper.transitionSpeed = _scrollbarAnimationTime;
			}
			if (info.scrollBarY) {
				info.scrollBarY.bar.transitionSpeed = time;
				info.scrollBarY.wrapper.transitionSpeed = _scrollbarAnimationTime;
			}
		},
			

	
		_resetPosition: function () {
			var info = this._scrollInfo,
				resetX = info.x,
				resetY = info.y
			 ;
	
			if (info.x >= 0) {
				resetX = 0;
			} else if (info.x < info.maxScrollX) {
				resetX = info.maxScrollX;
			}
	
			if (info.y >= 0 || info.maxScrollY > 0) {
				resetY = 0;
			} else if (info.y < info.maxScrollY) {
				resetY = info.maxScrollY;
			}
			
			if (resetX != info.x || resetY != info.y) {
				this.scrollTo(resetX, resetY);
			} else {
				if (info.moved) {
					this.onScrollEnd();		// Execute custom code on scroll end
//TODO: this was messing up click handling
//					info.moved = false;
				}
	
				// Hide the scrollbars
				if (info.scrollBarX) info.scrollBarX.hide();
				if (info.scrollBarY) info.scrollBarY.hide();
			}
		},
		
		_snapToPage: function (x, y) {
			var info = this._scrollInfo,
				time
			;
	
			if (info.directionX > 0) 		x = Math.floor(x/info.scrollWidth);
			else if (info.directionX < 0) 	x = Math.ceil(x/info.scrollWidth);
			else							x = Math.round(x/info.scrollWidth);

			info.pageX = -x;

			x = x * info.scrollWidth;
			if (x > 0) {
				x = info.pageX = 0;
			} else if (x < info.maxScrollX) {
				info.pageX = info.maxPageX;
				x = info.maxScrollX;
			}
	
			if (info.directionY > 0) 		y = Math.floor(y/info.scrollHeight);
			else if (info.directionY < 0)	y = Math.ceil(y/info.scrollHeight);
			else							y = Math.round(y/info.scrollHeight);

			info.pageY = -y;

			y = y * info.scrollHeight;
			if (y > 0) {
				y = info.pageY = 0;
			} else if (y < info.maxScrollY) {
				info.pageY = info.maxPageY;
				y = info.maxScrollY;
			}
	
			// Snap with constant speed (proportional duration)
			time = Math.round(Math.max(
					Math.abs(info.x - x) / info.scrollWidth * 100,
					Math.abs(info.y - y) / info.scrollHeight * 100
				));
				
			return { x: x, y: y, time: time };
		},
	
		_calculateMomentum: function (dist, time, maxDistUpper, maxDistLower) {
			var info = this._scrollInfo,
				friction = 2.5,
				deceleration = 1.2,
				speed = Math.abs(dist) / time * 1000,
				newDist = speed * speed / friction / 1000,
				newTime = 0;
	
			// Proportinally reduce speed if we are outside of the boundaries 
			if (dist > 0 && newDist > maxDistUpper) {
				speed = speed * maxDistUpper / newDist / friction;
				newDist = maxDistUpper;
			} else if (dist < 0 && newDist > maxDistLower) {
				speed = speed * maxDistLower / newDist / friction;
				newDist = maxDistLower;
			}
			
			newDist = newDist * (dist < 0 ? -1 : 1);
			newTime = speed / deceleration;
	
			return { dist: Math.round(newDist), time: Math.round(newTime) };
		},
		
		onDestroy: function () {
			var info = this._scrollInfo;
			if (!info) return;
			delete this._scrollInfo;
			
			this.unhook(_scrollerEvents);
			window.unhook(_windowEvents, this);
			document.unhook(_docEvents, this);
	
			if (info.scrollBarX) info.scrollBarX = info.scrollBarX.remove();
			if (info.scrollBarY) info.scrollBarY = info.scrollBarY.remove();
			
			return null;
		}
	}//end properties
});// end Element.Subclass("$IScroll")


// visible scrollbar thinger
// TODO:  transform to an Element.Subclass?
// TODO:  I'm not clear why this needs the whole canvas thing:
//			-- couldn't it just be a single rounded div and we set it's size/position?
var uid = 0;
function _iScrollbar (direction, parent) {
	var doc = document;
	
	this.direction = direction;
	this.uid = ++uid;

	// Create main scrollbar
	this.bar = doc.createElement("scroll-thumb");
	this.bar.className = direction;

	// Create scrollbar wrapper
	this.wrapper = doc.createElement("scroll-thumb-mask");
	this.wrapper.className = direction;
	this.wrapper.style.cssText = "-webkit-mask:-webkit-canvas(scrollbar" + this.uid + this.direction + ");"

	// Add scrollbar to the DOM
	this.wrapper.appendChild(this.bar);
	parent.appendChild(this.wrapper);
}


//TODO: why is this a canvas???  Should be able to just use a round-cornered div
_iScrollbar.prototype = {
	init: function (scroll, size) {
		var doc = document,
			pi = Math.PI,
			ctx;

		// Create scrollbar mask
		if (this.direction == 'horizontal') {
			if (this.maxSize != this.wrapper.offsetWidth) {
				this.maxSize = this.wrapper.offsetWidth;
				ctx = doc.getCSSCanvasContext("2d", "scrollbar" + this.uid + this.direction, this.maxSize, 5);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.beginPath();
				ctx.arc(2.5, 2.5, 2.5, pi/2, -pi/2, false);
				ctx.lineTo(this.maxSize-2.5, 0);
				ctx.arc(this.maxSize-2.5, 2.5, 2.5, -pi/2, pi/2, false);
				ctx.closePath();
				ctx.fill();
			}
		} else {
			if (this.maxSize != this.wrapper.offsetHeight) {
				this.maxSize = this.wrapper.offsetHeight;
				ctx = doc.getCSSCanvasContext("2d", "scrollbar" + this.uid + this.direction, 5, this.maxSize);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.beginPath();
				ctx.arc(2.5, 2.5, 2.5, pi, 0, false);
				ctx.lineTo(5, this.maxSize-2.5);
				ctx.arc(2.5, this.maxSize-2.5, 2.5, 0, pi, false);
				ctx.closePath();
				ctx.fill();
			}
		}

		this.size = Math.max(Math.round(this.maxSize * this.maxSize / size), 6);
		this.maxScroll = this.maxSize - this.size;
		this.toWrapperProp = this.maxScroll / (scroll - size);
		this.bar.style[this.direction == 'horizontal' ? 'width' : 'height'] = this.size + 'px';
	},
	
	_setPosition: function (pos) {
		if (this.wrapper.style.opacity != '1') this.show();

		pos = Math.round(this.toWrapperProp * pos);

		if (pos < 0) {
			pos = _shrinkScrollbar ? pos + pos*3 : 0;
			if (this.size + pos < 7) {
				pos = -this.size + 6;
			}
		} else if (pos > this.maxScroll) {
			pos = _shrinkScrollbar ? pos + (pos-this.maxScroll)*3 : this.maxScroll;
			if (this.size + this.maxScroll - pos < 7) {
				pos = this.size + this.maxScroll - 6;
			}
		}

		pos = (this.direction == 'horizontal' ? _translate(pos,0) : _translate(0,pos));
//TODO: genericise style name
		this.bar.style.webkitTransform = pos;
	},

	show: function () {
//TODO: genericise style name
		if (Browser.threed) this.wrapper.style.webkitTransitionDelay = 0;
		this.wrapper.style.opacity = '1';
	},

	hide: function () {
//TODO: genericise style name
		if (Browser.threed) this.wrapper.style.webkitTransitionDelay = 350;
		this.wrapper.style.opacity = '0';
	},
	
	remove: function () {
		this.wrapper.parentNode.removeChild(this.wrapper);
		return null;
	}
};


Script.loaded("{{hope}}IScroller.js");
});
