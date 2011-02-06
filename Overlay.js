/* Overlays, like a dialog, but doesn't necessarily have a close button */

Script.require("{{hope}}Element-attach.js", function(){

new hope.Section.Subclass("hope.Overlay", {
	tag : "overlay",
				
	properties : {
		visible : false,
		template : "<mask part='overlay:$mask'>\
						<border part='overlay:$border'>\
							<close part='overlay:$close' visible='no'></close>\
							<container></container>\
						</border>\
					</mask>",
		autoHide : new Attribute({name:"autoHide", type:"flag", falseIf:[false,"false","no"] }),
		listeners : "click:onClick",
		
		onReady : function() {
			this.$close.visible = this.autoHide;
		},
		
		onClick : function(event) {
			if (!this.autoHide) return;
			if (event.target === this.$close ||
				 (event.target == this.$mask && this.autoHide)) this.visible = false;
		}
	}
});


// create an overlay w/id "loadingMessage" to show/hide messages when loading
new hope.Overlay.Subclass("hope.LoadingMessage", {
	tag : "overlay",
	selector : "#loadingMessage",
	properties : {
		template : "<mask part='overlay:$mask'>\
						<border part='overlay:$border'>\
							<close part='overlay:$close' visible='no'></close>\
							<container><notice part='overlay:$notice'></notice></container>\
						</border>\
					</mask>",

		showMessage : function(message) {
			this.$notice.html = message;
			this.visible = true;
		}
	}
});

Script.loaded("{{hope}}Overlay.js");
});
