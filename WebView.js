/* Section.  Can have header/footer/bodies */

Script.require("{{hope}}Element-attach.js", function(){


new Element.Subclass("$WebView", {
	tag : "webview",
	properties : {
		template : "<iframe part='webview:$frame'></iframe>",

		childContainerSelector : "iframe",
		childProcessors : "header:initHeader,footer:initFooter",
		
		src : Attribute({
			name : "src",
			get : function() {
				return this.$frame.src;
			},
			
			set : function(url) {
				setTimeout(function(){this.$frame.src = url}.bind(this),0);
			}
		}),

//TODO: make this a pattern
		initHeader : function(header) {
			if (Element.debug) console.info(this, "processing header", header, this.container);
			var templateHeader = this.select("header");
			if (templateHeader) templateHeader.parentNode.replaceChild(header, templateHeader);
			else this.container.parentNode.insertBefore(header, this.container);
			this.classList.add("hasHeader");
			this.$header = header;
		},
		
		initFooter : function(footer) {
			if (Element.debug) console.info(this, "processing footer", footer);
			var templateFooter = this.select("footer");
			if (templateFooter) templateFooter.parentNode.replaceChild(footer, templateFooter);
			else this.container.parentNode.insertAfter(footer, this.container);
			this.classList.add("hasFooter");
			this.$footer = footer;
		}
	}
});



Script.loaded("{{hope}}WebView.js");
});
