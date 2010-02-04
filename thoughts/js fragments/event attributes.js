		/** List of attributes that we will output to our main element, if present.
			@see getEventsHTML()
		 */
		events : "onMouseMove,onMouseOver,onMouseOut,onMouseDown,onMouseUp,onClick,onDoubleClick,onMouseEnter,onMouseLeave",


		/** Make sure events is an array, and append to any previous events. */
		setEvents : function(list) {
			list = (typeof list == "string" ? list.split($.patterns.splitOnCommas) : list);
			return this.events = (this.events ? this.events.concat(list) : list);
		},

		/** Hook up any dynamic events.
			Note that our standard events (mouseDown, keyPress, etc) are hooked up 
			in our template expansion.
		 */
		hookUpEvents : function() {
			// HACK: check for onMouseEnter and onMouseLeave handlers
			//			if present, hook them up on the events the jQuery way
			if (this.onMouseEnter || this.onMouseLeave) {
				var target = this, handler = function(event){return $.on(event,target)};
				if (this.onMouseEnter) elements.mouseenter(handler);
				if (this.onMouseLeave) elements.mouseleave(handler);
			}
		},

		/** Return HTML for our 'standard' events that we'll output into our main element. 
			We apply all properties that are in our "events" object.
		*/
		getEventsHTML : function getEventsHTML() {
			var output = [], list = [].concat(this.events), event, i=0;
			while (event = list[i++]) {
				var handler = this[event];
				if (handler) {
					var name = $.eventMethodMap[event];
					output.push(name + "=\"$.on(event,"+this+")\"");
				}
			}
			return output.join(" ");
		},

