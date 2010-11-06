/*** Scrolling thinger ***/
// Based on 

Script.require("{{hope}}Element-style.js", function(){

//TODO: this is now effing broken!!!
//TODO: switch to straight movement with flick and die-off?
//TODO: scrollTo()
//TODO: scrolling with small movements of finger is off, check friction/etc
//TODO: if mouse is not up, when currentX == parentX, stop the timer somehow
//TODO: watch unloaded and remove our events!!!  (especially the resize event!!!)

new Element.Subclass("$Scroller", {
	tag : "scroller",
	properties : { 
	
		listeners : "touchstart:onTouchStart,touchmove:onTouchMove,touchend:onTouchEnd,"
				  + "mousedown:onTouchStart,mousemove:onTouchMove",

		// h[orizontal], v[ertical], or b[oth]
		direction : new Attribute({name:"direction", inherit:true, value:"both"}),
		
		// friction:	larger friction = less snap back (was .3)
		friction : new Attribute({name:"friction", inherit:true, value:.3}),
	
		// scroll speed:  larger = faster scrolling  (was: .3)
		speed : new Attribute({name:"speed", inherit:true, value:.3}),
		
		// acceleration delta:  larger = more scrolling per flick  (was: .7)
		deltaV : new Attribute({name:"deltaV", inherit:true, value:.7}),
		
		// interval between updates, in msec
		updateDelay : 33,
		
		onTouchStart : function(e){
			var info = this.info || (this.info = {
				active : true,

				// current position
				currentX : 0,
				currentY : 0,
				
				// current acceleration
				accelerationX : 0,
				accelerationY : 0
			});
			// last position
			info.lastX = (Browser.ios ? e.targetTouches[0].pageX : e.pageX);
			info.lastY = (Browser.ios ? e.targetTouches[0].pageY : e.pageY);
			
			// capture mouseup at the window level for regular browsers
			//	so we won't keep scrolling if the mouse goes up outside our element
			if (!Browser.ios) window.once("mouseup",this.onTouchEnd, this);
		},
		
		onTouchMove : function(e){
			var info = this.info;
			if (info == null || !info.active) return;
			e.preventDefault();

			var newX = (Browser.ios ? e.targetTouches[0].pageX : e.pageX);
			var newY = (Browser.ios ? e.targetTouches[0].pageY : e.pageY);
	
			info.accelerationX += (newX - info.lastX) * this.speed;
			info.accelerationY += (newY - info.lastY) * this.speed;
	
			info.lastX = newX;
			info.lastY = newY;
	
			if (!info.interval) info.interval = 
				setInterval(this.updateScroll.bind(this), this.updateDelay);
		},
		
		onTouchEnd : function(e) {
			this.info.active = false;
		},
		
		updateScroll : function(){
			var info = this.info;
			if (!info) return;
			
			// if using absolute positioning:
			var maxWidth = Math.max(0, this.clientWidth - this.parentNode.clientWidth);
			var maxHeight = Math.max(0, this.clientHeight - this.parentNode.clientHeight);

			var direction = this.direction.charAt(0);
			if (direction === "h" || direction === "b") {
				info.currentX += info.accelerationX;
				var zerosnapBackLeft = (info.currentX - info.currentX * this.friction);
				var totalWidthSnapBack = (info.currentX - (maxWidth + info.currentX) * this.friction);
				info.currentX = (info.currentX > 0) ? zerosnapBackLeft : (info.currentX < -maxWidth) ? totalWidthSnapBack : info.currentX;
				info.accelerationX *= this.deltaV;
				info.currentX = parseInt(info.currentX);
				this.left = info.currentX;
			}
			if (direction === "v" || direction === "b") {

				info.currentY += info.accelerationY;
				var zerosnapBackTop = (info.currentY - info.currentY * this.friction);
				var totalHeightSnapBack = (info.currentY - (maxHeight + info.currentY) * info.friction);
				info.currentY = (info.currentY > 0) 
									? zerosnapBackTop 
									: (info.currentY < -maxHeight) 
									? totalHeightSnapBack 
									: info.currentY;
				info.accelerationY *= this.deltaV;
				info.currentY = parseInt(info.currentY);
				this.top = info.currentY;
			}
		},
		
		// reset to 0 & clear interval
		resetScroll : function(){
			this.left = this.top = 0;
			clearInterval(this.info.interval);
			delete this.info;
		}
	}
});

	Script.loaded("{{hope}}Scroller.js");

});	// end Script.require;
