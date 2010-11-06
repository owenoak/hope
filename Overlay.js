/* Overlays, like a dialog, but doesn't necessarily have a close button */

Script.require("{{hope}}Element-attach.js", function(){

new $Section.Subclass("$Overlay", {
	tag : "overlay",
				
	properties : {
		visible : false,
		template : "<mask part='overlay:$mask'>\
						<border part='overlay:$border'>\
							<close part='overlay:$close'></close>\
							<container></container>\
						</border>\
					</mask>",
		autoHide : new Attribute({name:"autoHide", type:"flag", inherit:true, value:true}),
		listeners : "click:onClick",
		
		onClick : function(event) {
			if (event.target === this.$close ||
				 (event.target == this.$mask && this.autoHide)) this.visible = false;
		}
	}
});



Script.loaded("{{hope}}Overlay.js");
});
