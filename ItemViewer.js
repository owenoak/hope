/* 	ItemViewer draws all (or some) of the properties of its   .item   object in a vertical table  */

Script.require("{{hope}}Section.js", function(){


new hope.Section.Subclass("hope.ItemViewer", {
	tag : "itemviewer",
	mixins : "Noticeable",
	properties : {
		template : "<container visible='no'><rows></rows></container>",
		
		// template to draw for each item
		rowTemplate : "<row><label>{{key}}</label><output>{{value}}</output></row>",
		
		// message to show when no items in the list
		emptyMessage : "",

		// .item is the item we're displaying, we update when it changes
		item : new InstanceProperty({
			name:"item", 
			onChange : function(newItem, oldItem) {
				this.soon("update");
			}
		}),
		
		// Set .columns to a comma-separated list of column names
		//	to restrict the output to just that list.
		//	If empty, we'll draw ALL OF THE PROPERTIES OF THE ITEM.
		columns : Attribute({name:"columns", type:"list", value:"", update:true}),

		onReady : function() {
			this.$rows = this.getChild("rows");
			this.onChild("output", "mousedown", "onSelectOutput", this);
			this.onChild("output", "click", "onSelectOutput", this);
		},
		
		onSelectOutput : function(event, output) {
			output.selectContents();
		},

		// full on redraw of the entire list
		onUpdate : function() {
			var item = this.item;
			
			if (item == null) {
				this.$rows.html = "";
				if (this.emptyMessage) this.notice = this.emptyMessage;
				return;
			}
			this.notice = "";
			
			// clear the old list items
			this.$rows.empty();
			
			if (this.columns) {
				this.columns.forEach(function(column) {
					this.$rows.append(this.getItemRow(column, item[column]));
				}, this);
			} else {
				for (var key in item) {
					this.$rows.append(this.getItemRow(key, item[key]));
				}
			}
		},
		
		// return a single, expanded outer HTML element that represents a row for the list item
		getItemRow : function(key, value) {
			return this.rowTemplate.inflateFirst({key:key, value:value});
		}
	}
});



Script.loaded("{{hope}}ItemViewer.js");
});
