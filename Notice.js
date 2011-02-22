/*** 
		Notice:  Display a message, generally inside a control.
		
		Noticeable:  give your template a <... part='$notice'> element a
			and set  .notice = "xxx" to show a notice, or .notice = "" to hide it.
			Shows and hides your main container automatically as appropriate.
***/
Script.require("{{hope}}Element-attach.js", function(){


new Element.Subclass("hope.Notice", {
	tag : "notice",
	properties : {
		template : "<container></container>",
		message : Attribute({	
			name : "message", 
			onChange : function(newMessage) {
				if (newMessage == null) {
					newMessage = "";
				} else if (typeof newMessage !== "string") {
					newMessage = ""+newMessage;
				}
				this.$container.html = newMessage;
				this.visible = (newMessage != "");
			}
		})
	}
});



//TODO: I like the pattern that Section uses for this better.
var Noticeable = {
	mixinTo : function(it) {
		if (it.isAClass) it = it.prototype;
		hope.extendIf(it, Noticeable.properties);
		return it;
	},
	properties : {
		notice : new Attribute({name:"notice", update:true, 
					onChange : function(newMessage) {
						// if no notice element, prepend one
						if (!this.$notice) {
							this.$notice = this.prepend(new hope.Notice({visible:"no"}));
						}

						if (typeof newMessage === "string") newMessage = newMessage.expand(this);
						this.$notice.message = newMessage;
						
						if (this.$container == this) return;
						
						var showMain = (this.$notice.message == "");
						this.$container.visible = showMain;
						if (this.$header) this.$header.visible = showMain;
						if (this.$footer) this.$footer.visible = showMain;
					}
				})
	}
};
hope.setGlobal("Noticeable", Noticeable);

Script.loaded("{{hope}}Notice.js");
});// end Script.require
