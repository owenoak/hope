/* Stack:  section which only shows one child at a times */

Script.require("{{hope}}Element-attach.js", function(){

// a Stack is a section whose children:
//	- are shown one at a time (via stack.selected), and
//	- take up the full space of the stack
//	- 
new hope.Section.Subclass("hope.Stack", {
	tag : "stack",
	properties : {
		// set to a css selector for our child element to be used as a selector
		//	to show different item in the stack
		itemSelector : null,
		
		// constructor for our item selectors
		selectorConstructor : hope.Action,

		// switch the visible section when selected
		listeners : "selected,deselected",

		// figure out if we have an itemSelector before processing children
		initialize : function() {
			var selector = this.attr("itemSelector") || this.itemSelector;
			if (typeof selector === "string") {
				this.itemSelector = this.select(selector) || select(selector);
			}
			this.as(hope.Section);
			
			// set up the selected item on a timer...
			var stack = this;
			setTimeout(function(){stack.fire("selected", stack.selection)},0);
		},

		//TODO: this is a trait, or at least abstract it somehow...
		preference : new Attribute({name:"preference", type:"preference"}),
		selection : new Attribute({
			name : "selection",
			get : function() {
				if (this.preference) return hope.preference(this.preference);
				return this.data.selection;
			},
			
			set : function(newValue) {
				var oldValue, pref = this.preference;
				if (pref) 	oldValue = hope.preference(pref);
				else		oldValue = this.data.selection;
				if (oldValue === newValue) return;
				if (oldValue) this.fire("deselected", oldValue);

				if (pref) 	hope.preference(pref, newValue);
				else		this.data.selection = newValue;
				this.attr("selection", newValue);
				if (newValue) this.fire("selected", newValue);
			}
		}),
		
		// pointer to our selected section
		$selection : Getter(function() {
			var selection = this.selection;
			return (selection ? select("#"+selection) : undefined);
		}),

		// called when one of our items is selected
		onSelected : function(event, newSection) {
			var element;
			if (newSection) {
				if (element = this.getSelectorFor(newSection)) 	element.selected = true;
				if (element = this.getItem(newSection))			element.visible = true;
			}
		},

		// called when one of our items is deselected
		onDeselected : function(event, oldSection) {
			if (oldSection) {
				if (element = this.getSelectorFor(oldSection)) 	element.selected = false;
				if (element = this.getItem(oldSection))			element.visible = false;
			}
		},

		getItem : function(id) {
			return this.container.select("#"+id);
		},

		// process children to:
		//	- hide them initially, and
		//	- make a selector for them if they specify a 'title'
		processChild : function(section) {
			if (section.id) {
				section.visible = false;
				this.makeSelectorFor(section);
			}
			return section;
		},
		
		
		// selector item for each section
		getSelectorFor : function(id) {
			if (this.itemSelector instanceof Element)
				return this.itemSelector.select("[for='"+id+"']");
		},
		
		makeSelectorFor : function(section) {
			if (! (this.itemSelector instanceof Element)) return;
			var title = section.label || section.attr("label"),
				id = section.id
			;
			if (!title || !id) return;
			
			var container = this,
				selector = new this.selectorConstructor({
					html 	: title,
					handler : function() {
						container.selection = id;
					},
					attrs : { "for" : id }
				})
			;
			this.itemSelector.appendChild(selector);
		}
	}
});


Script.loaded("{{hope}}Stack.js");
});
