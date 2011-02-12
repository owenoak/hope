/* 	Single-select list viewer.  
	Define an .rowTemplate to draw for each item or set .columns to create one automatically.
	
	TODO:
		- header row (can we position:fixed it ???)
		- paging/scrolling/etc
		- smart selection semantics
		- observe the list add/remove/etc ?
		- multiple columns
*/

Script.require("{{hope}}Section.js", function(){



new hope.Section.Subclass("hope.ListViewer", {
	tag : "listviewer",
	mixins : "Noticeable",
	properties : {
		onReady : function() {
			this.$rows = this.getChild("rows");
			this.$rows.onChild("row", "click", "onRowClicked", this);
		},

		template : "<container><rows></rows></container>",
		
		// template to draw for each item
		rowTemplate : "<row></row>",
		
		// message to show when no items in the list
		emptyMessage : "No items to show",

		// max number of rows to show
//TODO: make this a sliding window
		maxRows : Attribute({name:"maxRows", type:"number", update:true, inherit:true, value:0}),
		
		// first row we're currently displaying
		startRow : Attribute({name:"startRow", type:"number", update:true, inherit:true, value:0}),

		// if true, we automatically deselect when updating the list
		autoDeselect : false,
		
		// .list is the list of data we're pointing to.  When it's changed:
		//		- redraw the list
		list : new InstanceProperty({
			name:"list", 
			onChange : function(newList, oldList) {
				// clear the selection
				if (this.autoDeselect) this.selectedIndex = -1;
				this.fire("update");
			}
		}),
		
		// Set .columns to a comma-separated list of column names
		//	to generate an rowTemplate of <cells> for those columns automatically.
		//	The class of each column will be set to the column name.
		columns : Attribute({name:"columns", type:"list", value:"", update:true,
			onChange : function(list) {
				var output = ["<row>"];
				if (list) list.forEach(function(column) {
					output.push("<cell class='"+column+"'>{{"+column+"}}</cell>");
				});
				output.push("</row>");
				this.rowTemplate = output.join("");
			}
		}),

		// return the row for a given index
		getRow : function(index) {
			return this.$rows.getChildren("row")[index];
		},

		// index of the item in our list which is selected
		selectedIndex : Attribute({name:"selectedIndex", type:"number", 
				update:true, value:-1, inherit:true,
				onChange : function(index) {
//console.warn(this.id+".selectedIndex changed to ",index);				
					this.fixSelectionHighlight();					
					var record = (this.list ? this.list[index] : null);
					this.soon("selectionChanged", record, index);
				}
			}),

		// Selected is a pointer to our list item which is selected.
		//	Setting .selection will change the selectedIndex
		selection : Property({
			get : function() {
				return (this.list ? this.list[this.selectedIndex] : undefined);
			},
			set : function(item) {
//console.warn(this.id+".selection changing to index "+(this.list ? this.list.indexOf(item) : -1), item, this.list);
				this.selectedIndex = (this.list ? this.list.indexOf(item) : -1);
			}
		}),
		
		onRowClicked : function(event, row) {
			var index = row.attr("index");
			this.selectedIndex = index;
		},

		
		// full on redraw of the entire list
		onUpdate : function() {
			if (this.list == null || this.list.length == 0 && this.emptyMessage) {
				this.notice = this.emptyMessage;
				return;
			}
			this.notice = "";
			
//console.info(this.id,"updating, selectedIndex: ",this.selectedIndex, ", length:",this.list.length);

			// clear the old list items
			this.$rows.empty();
			
			var index = this.startRow-1, 
				length = this.list.length,
				last = (this.maxRows == 0 ? length : Math.min(this.startRow + this.maxRows, length))
			;
			while (++index < last) {
				var item = this.list[index];
				var row = this.getItemRow(item, index);
				this.$rows.append(row);
			}
			this.updateRowIndices();
			this.fixSelectionHighlight();
		},
		
		// update the row indices to correspond to the list
		updateRowIndices : function() {
			this.$rows.getChildren("row").forEach(function(row, index) {
				row.attr("index", index);
			});
		},

		fixSelectionHighlight : function() {
			// clear the old hilight
			var row = this.getChild("row[selected]");
			if (row) row.attr("selected",null);
			
			// show the new highlight
			row = this.getChild("row[index='"+this.selectedIndex+"']");
			if (row) {
				row.attr("selected","yes");
				// make sure the selected row is visible
				this.revealChild(row);
			}
		},
		
		// return a single, expanded outer HTML element that represents a row for the list item
		getItemRow : function(item, index) {
			return this.rowTemplate.inflateFirst(item);
		}
	}
});



Script.loaded("{{hope}}ListViewer.js");
});
