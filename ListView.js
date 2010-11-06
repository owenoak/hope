/* Single-select list viewer.  Define "getItemHTML" to return the HTML for one particular item.

*/

Script.require("{{hope}}Element-attach.js", function(){



new Element.Subclass("$ListView", {
	tag : "listview",
	properties : {

		// .list is the list of data we're pointing to.  When it's changed:
		//		- observe its add/remove?
		//		- redraw the list
		list : new InstanceProperty({
			name:"list", 
			onChange : function(newValue, oldValue) {
				// TODO: stop observing oldLst
				// TODO: start observing newList

				this.selected = null;
				this.dirty = true;
			}
		}),

		// selected is a pointer to our list item which is selected
		selected : new InstanceProperty({
			name : "selected",
			onChange : function(newValue, oldValue) {
				
			}
		}),
		
		init : function() {
			// initialize our selected section
			this.selected = this.selected;
		}
	}
});



Script.loaded("{{hope}}ListView.js");
});
