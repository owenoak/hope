/* Section.  Can have header/footer/bodies */

Script.require("{{hope}}Panel.js", function(){


new hope.Panel.Subclass("hope.Section", {
	tag : "section",
	properties : {
		template : "<container></container>",

		childProcessors : "header:initHeader,footer:initFooter,notice:initNotice",

		label 			: Attribute("label"), 

//TODO: make this a pattern
		initHeader : function(header) {
			if (Element.debug) console.info(this, "processing header", header, this.$container);
			var templateHeader = this.getChild("header");
			if (templateHeader) {
				templateHeader.parentNode.replaceChild(header, templateHeader);
			} else {
				this.$container.parentNode.insertBefore(header, this.$container);
			}
			this.classList.add("hasHeader");
			this.$header = header;
		},
		
		initFooter : function(footer) {
			if (Element.debug) console.info(this, "processing footer", footer);
			var templateFooter = this.getChild("footer");
			if (templateFooter) {
				templateFooter.parentNode.replaceChild(footer, templateFooter);
			} else {
				this.$container.parentNode.insertAfter(footer, this.$container);
			}
			this.classList.add("hasFooter");
			this.$footer = footer;
		},
		
		// TODO: merge with "Noticeable" mixin?
		initNotice : function(notice) {
			if (Element.debug) console.info(this, "processing notice", notice);
			var templateNotice = this.getChild("notice");
			if (templateNotice) {
				templateNotice.parentNode.replaceChild(notice, templateNotice);
			} else {
				this.$container.parentNode.insertBefore(notice, this.$container);
			}

			this.classList.add("hasNotice");
			this.$notice = notice;
		},
		
		
		// Set our notice to some HTML message.
		// If notice is not empty, shows the notice and hides our container.
		// If notice is empty, shows the container and hides the notice.
		setNotice : function(message) {
			if (!this.$notice) {
				this.initNotice(new hope.Notice());
			}
			
			this.$notice.message = message;
			this.$container.visible = (!this.$notice.visible);
		}
	}
});



Script.loaded("{{hope}}Section.js");
});
