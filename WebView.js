/* Section.  Can have header/footer/bodies */

Script.require("{{hope}}Element-attach.js", function(){


new hope.Section.Subclass("hope.WebView", {
	tag : "webview",
	properties : {
		template : "<iframe part='webview:$frame'></iframe>",
		childContainerSelector : "iframe",
		listeners : "shown,hidden",
		
		// show automatically when url is set?
		autoShow : new Attribute({name:"autoShow", type:"flag", falseIf:[false,"false","no"] }),
		
		// clear automatically on hide?
		autoClear : new Attribute({name:"autoHide", type:"flag", falseIf:[false,"false","no"] }),

		url : Attribute({
			name : "url",
//NOTE: this is not reliable if the URL changes
			get : function() {
				return this.$frame.src;
			},
			
			set : function(url) {
				setTimeout(function(){
					try {
						this.$frame.src = url;
						if (this.autoShow && url && url != "about:blank") this.visible = true;
					} catch (e) {}
				}.bind(this),0);
			}
		}),
		
		
		homeUrl : Attribute({name:"homeUrl", update:true, inherit:true, value:"about:blank"}),
		goHome : function() {
			this.$frame.src = this.homeUrl;
		},
		
		
		// go back and forth by adjusting the global history
		//	'cause we can't get access to the iframe's history by itself.  :-(
		goBack : function() {
			history.back();
		},
		
		goForward : function() {
			history.forward();		
		},
		
		
		// clear on hide if necessary
		onHidden : function() {
			if (this.autoClear) this.url = "about:blank";
		}
	}
});



Script.loaded("{{hope}}WebView.js");
});
