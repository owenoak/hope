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


// events always attached to the windo
var _windowEvents = {};
_windowEvents[Browser.EVENT.resize] = "onReflow";



var _docEvents = {};
//TODO: genericise style name
if (Browser.webkit) _docEvents["webkitTransitionEnd"] = "onTransitionEnd";


// global options according to platform (can't change per scrollbar)
//	TODO: figure out which of these don't make sense for android
var _desktopCompatibility = false,
	_bounce = true,
	_bounceLock = false,
	_momentum = Browser.threed,		// only enable if CSSMatrix stuff is enabled
	_alwaysShowScrollbar = false,
	_fadeScrollbar = true,
	_scrollbarAnimationTime = (_fadeScrollbar ? 300 : 0),
	_shrinkScrollbar = true,
	_wrapperOverflow = (_desktopCompatibility ? "auto" : "hidden")
;

new Element.Subclass("hope.IScroller", {
	tag : "scroller",
	properties : {
		listeners : "reflow",
		
		// h[orizontal], v[ertical], or b[oth]
		direction : new Attribute({name:"direction", inherit:true, value:"both",
						onChange : function() {
//							this.left = 0;
//							this.top = 0;
							this.soon("reflow");
						}
		}),
		
		// "light" or "dark"
		appearance : new Attribute({name:"appearance", inherit:true, value:"light"}),
		
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
		showScrollbars : new Attribute({name:"showScrollbars", type:"flag", 
											falseIf:[false,"false","no"] }),

		// snap to pages?
		snap : new Attribute({name:"snap", type:"flag", trueIf:["",true,"yes","true"] }),
		
		// go to top whenever dom changes?
		autoReset : new Attribute({name:"autoReset", type:"flag", trueIf:["",true,"yes","true"] }),
		
		
		
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
				info.pageX = -Math.round(info.x / info.visibleWidth);
				info.pageY = -Math.round(info.y / info.visibleHeight);
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
	
			pageX = -pageX*info.visibleWidth;
			pageY = -pageY*info.visibleHeight;

			var snap = this._snapToPage(pageX, pageY);
			pageX = snap.x;
			pageY = snap.y;
			if (speed == null) speed = snap.time;

			this.scrollTo(pageX, pageY, speed);
		},
	
		// scroll an element into view
		//	attempts to leave things where they are if possible
		scrollToElement: function (el, runtime) {
			el = this.getChild(el);
			if (!el) return;
	
			var info = this._scrollInfo;
			if (!info) info = this.onReflow();
			if (!info) {
				return setTimeout(function(){
									this.scrollToElement.apply(this,arguments)
								}.bind(this),100);
			}
			var x, y;

			if (info.scrollX) {
				var elementLeft 	= el.offsetLeft,
					elementRight 	= elementLeft + el.width,
					visibleLeft 	= -info.x,
					visibleRight 	= visibleLeft + info.visibleWidth
				;
//	console.warn("eL:", elementLeft, "eR: ",elementRight, "vL:",visibleLeft,"vR:",visibleRight);
	
				if (elementLeft >= visibleLeft && elementRight <= visibleRight) {
//					console.info("inside:  don't need to scroll");
					x = null;
				} else if (elementLeft < visibleLeft) {
					x = -el.offsetLeft
//					console.info("need to scroll so LEFT is visible: x is now", x);
				} else if (elementRight > visibleRight) {
					x = info.x + (visibleRight - elementRight);
//					console.info("need to scroll so RIGHT is visible: x is now ",x);
				} else {
					console.info("x scroll: dunno");
				}
	
				if (x != null) x = x.between(info.maxScrollX, 0);
			}

			if (info.scrollY) {
				var elementTop 		= el.offsetTop,
					elementBottom 	= elementTop + el.height,
					visibleTop 		= -info.y,
					visibleBottom 	= visibleTop + info.visibleHeight
				;
//	console.warn("eT:", elementTop, "eB: ",elementBottom, "vT:",visibleTop,"vB:",visibleBottom);
	
				if (elementTop >= visibleTop && elementBottom <= visibleBottom) {
//					console.info("inside:  don't need to scroll");
					y = null;
				} else if (elementTop < visibleTop) {
					y = -el.offsetLeft
//					console.info("need to scroll so TOP is visible: y is now", y);
				} else if (elementBottom > visibleBottom) {
					y = info.y + (visibleBottom - elementBottom);
//					console.info("need to scroll so BOTTOM is visible: y is now ",y);
				} else {
					console.info("y scroll: dunno");
				}
	
				if (y != null) y = y.between(info.maxScrollY, 0);
			}

			this.scrollTo(x, y, runtime);
		},
	

		// center a child element in the view -- this almost always moves
		centerElement: function (el, runtime) {
			el = this.getChild(el);
			if (!el) return;
	
			var info = this._scrollInfo;
			if (!info) info = this.onReflow();
			if (!info) {
				return setTimeout(function(){
									this.centerElement.apply(this,arguments)
								}.bind(this),100);
			}
			var x, y;

			if (info.scrollX) {
				var elementLeft 	= el.offsetLeft,
					elementWidth	= el.width,
					visibleCenter	= info.visibleWidth / 2
				;
				x = visibleCenter - elementLeft - (elementWidth/2);
				if (x != null) x = x.between(info.maxScrollX, 0);
			} else {
				x = 0;
			}

			if (info.scrollY) {
				var elementTop 		= el.offsetTop,
					elementHeight	= el.height,
					visibleCenter	= info.visibleHeight / 2
				;
				y = visibleCenter - elementTop - (elementHeight/2);
				if (y != null) y = y.between(info.maxScrollY, 0);
			} else {
				y = 0;
			}

			this.scrollTo(x, y, runtime);
		},
	


		onTouchStart: function(event) {
			// if more than one finger is down, forget it
			if (Browser.mobile && event.touches && event.touches.length > 1) return;

			// capture mouseup before it goes to the page elements to call onTouchEnd
			this._globalUpEvent = window.capture(Browser.EVENT.up, this.onTouchEnd, this);

			if (!this._scrollInfo) this.fire("reflow");
			if (!this.enabled) return;
	
			event.preventDefault();
			event.stopPropagation();
			
			var info = this._scrollInfo;
			info.scrolling = true;
			info.originalTarget = event.touch.target;
	
			info.moved = false;
			info.distX = 0;
			info.distY = 0;
	
			this._setTransitionTime(0);
	
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
			// clear the captured window.mouseUp event
			window.un(Browser.EVENT.up, this._globalUpEvent);

			if (!this._scrollInfo.scrolling) return;

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
			} else {
				// if we get here, scrolling actually happened
				//	we want to eat any mouseup and click events so they don't 
				//	go to things underneath the mouse (scrolling trumps clicking)
			
				event.preventDefault();			
				event.stopPropagation();	

				// capture the click event and unhook it (immediately) on a timer
				//	this is the only way I can figure out to reliably eat the click
				var _captured = window.capture("click",function(event){
					// console.warn('eating click'); 
					event.stop();
				});
				setTimeout(function(){
					// console.warn("unhooked window click eater")
					window.un("click", _captured);
				},0);
			}
	
			if (!this.snap && time > 250) {			// Prevent slingshot effect
				this._resetPosition();
				return;
			}
	
			if (_momentum) {
				momentumX = info.scrollX === true
					? this._calculateMomentum(info.x - info.scrollStartX,
									time,
									_bounce ? -info.x + info.visibleWidth/5 : -info.x,
									_bounce ? info.x + info.scrollerWidth - info.visibleWidth + info.visibleWidth/5 : info.x + info.scrollerWidth - info.visibleWidth)
					: { dist: 0, time: 0 };
	
				momentumY = info.scrollY === true
					? this._calculateMomentum(info.y - info.scrollStartY,
									time,
									_bounce ? -info.y + info.visibleHeight/5 : -info.y,
									_bounce ? (info.maxScrollY < 0 ? info.y + info.scrollerHeight - info.visibleHeight : 0) + info.visibleHeight/5 : info.y + info.scrollerHeight - info.visibleHeight)
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
//console.error("GOT TO END");

			return false;
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
			
			info.visibleWidth = this.parentNode.clientWidth;
			info.visibleHeight = this.parentNode.clientHeight;
			
			if (info.visibleWidth === 0) {
//console.warn("deferring reflow");
				this.soon("reflow");
				return null;
			}
			
			info.scrollerWidth = this.offsetWidth;
			info.scrollerHeight = this.offsetHeight;
			
			info.maxScrollX = info.visibleWidth - info.scrollerWidth;
			info.maxScrollY = info.visibleHeight - info.scrollerHeight;
			
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
				info.maxPageX = -Math.floor(info.maxScrollX/info.visibleWidth);
				info.maxPageY = -Math.floor(info.maxScrollY/info.visibleHeight);
	
				snap = this._snapToPage(resetX, resetY);
				resetX = snap.x;
				resetY = snap.y;
			}
	
			if (resetX != info.x || resetY != info.y) {
				this._setTransitionTime(0);
				this._setPosition(resetX, resetY, true);
			}
			
			info.scrollX = this.scrollHorizontally && (info.scrollerWidth > info.visibleWidth);
			info.scrollY = this.scrollVertically && (!_bounceLock && !this.scrollX || info.scrollerHeight > info.visibleHeight);
	
			// Update horizontal scrollbar
			if (this.showScrollbars && info.scrollX) {
				info.scrollBarX = info.scrollBarX || new ScrollThumb('horizontal', this.parentNode, this.appearance);
				info.scrollBarX.init(info.visibleWidth, info.scrollerWidth);
			} else if (info.scrollBarX) {
				info.scrollBarX = info.scrollBarX.remove();
			}
	
			// Update vertical scrollbar
			if (this.showScrollbars && info.scrollY && info.scrollerHeight > info.visibleHeight) {
				info.scrollBarY = info.scrollBarY || new ScrollThumb('vertical', this.parentNode, this.appearance);
				info.scrollBarY.init(info.visibleHeight, info.scrollerHeight);
			} else if (info.scrollBarY) {
				info.scrollBarY = info.scrollBarY.remove();
			}
			return info;
		},
	
		_setPosition: function (x, y, hideScrollBars) {
			var info = this._scrollInfo;
	
			info.x = (x == null ? info.x : x) || 0;
			info.y = (y == null ? info.y : y) || 0;
			if (Browser.cssTransitions) {
//TODO: genericise style name
				this.style.webkitTransform = _translate(info.x, info.y);
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
			this.transitionSpeed = time;
			
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
	
			if (info.directionX > 0) 		x = Math.floor(x/info.visibleWidth);
			else if (info.directionX < 0) 	x = Math.ceil(x/info.visibleWidth);
			else							x = Math.round(x/info.visibleWidth);

			info.pageX = -x;

			x = x * info.visibleWidth;
			if (x > 0) {
				x = info.pageX = 0;
			} else if (x < info.maxScrollX) {
				info.pageX = info.maxPageX;
				x = info.maxScrollX;
			}
	
			if (info.directionY > 0) 		y = Math.floor(y/info.visibleHeight);
			else if (info.directionY < 0)	y = Math.ceil(y/info.visibleHeight);
			else							y = Math.round(y/info.visibleHeight);

			info.pageY = -y;

			y = y * info.visibleHeight;
			if (y > 0) {
				y = info.pageY = 0;
			} else if (y < info.maxScrollY) {
				info.pageY = info.maxPageY;
				y = info.maxScrollY;
			}
	
			// Snap with constant speed (proportional duration)
			time = Math.round(Math.max(
					Math.abs(info.x - x) / info.visibleWidth * 100,
					Math.abs(info.y - y) / info.visibleHeight * 100
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
});// end Element.Subclass("hope.IScroller")


// visible scrollbar thinger
// TODO:  transform to an Element.Subclass?
// TODO:  I'm not clear why this needs the whole canvas thing:
//			-- couldn't it just be a single rounded div and we set it's size/position?
var uid = 0;
function ScrollThumb (direction, parent, appearance) {
	this.direction = direction;

	// Create scrollbar wrapper
	var wrapper = this.wrapper = Element.create("scroll-track", {	className:direction, 
																	appearance:appearance
																});

	// Create main scrollbar
	this.bar = Element.create("scroll-thumb");

	// Add scrollbar to the DOM
	wrapper.appendChild(this.bar);
	parent.appendChild(wrapper);
	
	if (_alwaysShowScrollbar) this.wrapper.opacity = 1;
}


//TODO: why is this a canvas???  Should be able to just use a round-cornered div
ScrollThumb.prototype = {
	init : function (scroll, size) {
		// Create scrollbar mask
		if (this.direction == 'horizontal') {
			this.maxSize = this.wrapper.offsetWidth;
		} else {
			this.maxSize = this.wrapper.offsetHeight;
		}

		this.size = Math.max(Math.round(this.maxSize * this.maxSize / size), 6);
		this.maxScroll = this.maxSize - this.size;
		this.toWrapperProp = this.maxScroll / (scroll - size);
		this.bar.style[this.direction == 'horizontal' ? 'width' : 'height'] = this.size + 'px';
	},
	
	_setPosition : function (pos) {
		if (this.wrapper.style.opacity != '1') this.show();

		pos = Math.round(this.toWrapperProp * pos);
		var size = this.size;

		// if scrolled off the top
		if (pos < 0) {
			pos = _shrinkScrollbar ? pos + pos*3 : 0;
			if (this.size + pos < 7) {
				pos = -this.size + 6;
			}
			// shrink the height of the bar so it stays within bounds
			size += pos;
			pos = 0;
		} 
		// if scrolled off the bottom
		else if (pos > this.maxScroll) {
			pos = _shrinkScrollbar ? pos + (pos-this.maxScroll)*3 : this.maxScroll;
			if (this.size + this.maxScroll - pos < 7) {
				pos = this.size + this.maxScroll - 6;
			}
			// shrink the height of the bar so it stays within bounds
			size += (this.maxScroll - pos);
		}
		
		if (this.direction == "horizontal") {
			this.bar.left = pos;
			this.bar.width = size;
		} else {
			this.bar.top = pos;
			this.bar.height = size;
		}
	},

	show : function () {
		if (_alwaysShowScrollbar) return;
//TODO: genericise style name
		if (Browser.threed) this.wrapper.style.webkitTransitionDelay = 0;
		this.wrapper.style.opacity = '1';
	},

	hide : function () {
		if (_alwaysShowScrollbar) return;
//TODO: genericise style name
		if (Browser.threed) this.wrapper.style.webkitTransitionDelay = 350;
		this.wrapper.style.opacity = '0';
	},
	
	remove : function () {
		this.wrapper.parentNode.removeChild(this.wrapper);
		return null;
	}
};


Script.loaded("{{hope}}IScroller.js");
});
