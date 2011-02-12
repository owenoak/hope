/* Menus, eg: context menus 

	Note: When this is initialized, we add a global "contextmenu" handler to the body
			which displays a context menu for any element which has a "menu" attribute (property?).
*/

//TODO: doesn't handle nested menus
//TODO: showing menu 2 should hide menu 1
//TODO: leave body.autoHide handler on all the time and key off menu being set?
//TODO: when menu showing, use keys:
//			- arrows to go up/down menu
//			- return to select
//			- escape to clear menu

Script.require("{{hope}}Element-attach.js", function(){

new Element.Subclass("hope.Menu", {
	tag : "contextmenu",
	properties : {
		template : "<container></container>",

		visible : false,
		autoHide : new Attribute({name:"autoHide", type:"flag", falseIf:[false,"false","no"]}),
		
		// attach this menu to some element
		// TODO: set "context" on all (direct?) children of the menu, for easy callback semantics?
		showForElement : function(element, event) {
			// set the "context" property of me (and all my children) to the element
			//	to make it easy to reference the menu
			var menu = this;
			this.recurse(function() { this.menu = menu; this.context = element; });
			// show the menu immediately (may do an animation)
			this.visible = true;

			// hide the menu on click if autoHide is true
			// NOTE: this breaks submenus!
			if (this.autoHide) {
				document.body.observe({	eventType:"click", once:true, capture:true, scope:this,
										handler:function() {
											this.visible = false
										}
									});
			}
			
			// if we have a browser event, move to be under the mouse
			if (event) {
				this.moveToEvent(event);
				// skip the browser context menu
				event.stop();
			}
		}
	},
	
	"static" : {
		debug : hope.debug("Menu"),
		
		showMenuFor : function(element, event, menuSelector) {
			if (menuSelector == null) menuSelector = element.contextMenu;
			var menu = select(menuSelector);
			if (!menu) return;
			menu.showForElement(element, event);
		}
	}
});



// Watch for the "contextmenu" event of any child with a "menu" attribute.
hope.onReady("document", function() {
	document.body.onChild(
		function(){return !!this.contextMenu}, 
		"contextmenu", 
		function(event, element) {

		// DEBUG: QUESTIONABLE
		//	if ctrl key is down, show the standard menu instead of the custom menu
		if (event.ctrlKey) return;
		
		hope.Menu.showMenuFor(element, event);
	});
});


Script.loaded("{{hope}}Menu.js");
});
