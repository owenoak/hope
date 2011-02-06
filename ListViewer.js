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
	properties : {
		template : "<container><rows></rows></container>",
		
		// template to draw for each item
		rowTemplate : "<row></row>",
		
		// message to show when no items in the list
		emptyMessage : "No items to show",

		// template actually used to show the emptyMessage
		emptyMessageTemplate : "<row><notice>{{emptyMessage}}</notice></row>",

		// max number of rows to show
//TODO: make this a sliding window
		maxRows : Attribute({name:"maxRows", type:"number", update:true, inherit:true, value:50}),
		
		// first row we're currently displaying
		startRow : Attribute({name:"startRow", type:"number", update:true, inherit:true, value:0}),

		// if true, we automatically deselect when updating the list
		autoDeselect : false,
		
		// if true, we observe events on the list and update as it changes
		observeList : false,
		
		
		// .list is the list of data we're pointing to.  When it's changed:
		//		- observe its add/remove?
		//		- redraw the list
		list : new InstanceProperty({
			name:"list", 
			onChange : function(newList, oldList) {
				if (this.observeList) {
					// stop observing the old list, if set
				//TODO: make this a pattern somehow...
					if (oldList && oldList.un && this.__oldListHandlers) {
						for (var key in this.__oldListHandlers) {
							oldList.un(key, this._oldListHandlers[key]);
						}
						delete this._oldListHandlers;
					}
					if (newList && newList.on) {
						var handlers = this._oldListHandlers = {
							changed : newList.on("changed", "onListChangd", this),
							added   : newList.on("added", "onItemAdded", this),
							removed : newList.on("removed", "onItemRemoved", this)
						}
					}
				}

				// clear the selection
				if (this.autoDeselect) this.selectedIndex = -1;
				this.fire("update");
			}
		}),
		
		// Set .columns to a comma-separated list of column names
		//	to generate an rowTemplate of <outputs> for those columns automatically.
		//	The class of each column will be set to the column name.
		columns : Attribute({name:"columns", type:"list", value:"", update:true,
			onChange : function(list) {
				var output = ["<row>"];
				if (list) list.forEach(function(column) {
					output.push("<output class='"+column+"'>{{"+column+"}}</output>");
				});
				output.push("</row>");
				this.rowTemplate = output.join("");
			}
		}),

		// return the row for a given index
		getRow : function(index) {
			return this.$rows.selectAll("row")[index];
		},

		// index of the item in our list which is selected
		selectedIndex : Attribute({name:"selectedIndex", type:"number", 
				update:true, value:-1, inherit:true,
				onChange : function(index) {
					this.fixSelectionHighlight();					
					var record = (this.list ? this.list[index] : null);
					this.soon("selectionChanged", index, record);
				}
			}),

		// Selected is a pointer to our list item which is selected.
		//	Setting .selected will change the selectedIndex
		selected : Property({
			get : function() {
				return (this.list ? this.list[this.selectedIndex] : undefined);
			},
			set : function(item) {
				this.selectedIndex = (this.list ? this.list.indexOf(item) : -1);
			}
		}),
		
		onReady : function() {
			this.$rows = this.select("rows");
			this.$rows.onChild("row", "click", "onRowClicked", this);
		},
		
		onRowClicked : function(event, row) {
			var index = row.attr("index");
			this.selectedIndex = index;
		},

		

		onItemAdded : function(item, index, list) {
console.warn(this, "itemAdded: ", arguments);
			this.soon("update");
		},

		onItemAdded : function(item, index, list) {
console.warn(this, "itemAdded: ", arguments);
			this.soon("update");
		},
		onItemRemoved : function(item, index, list) {
console.warn(this, "itemRemoved: ", arguments);		
			this.soon("update");
		},
		
		// full on redraw of the entire list
		onUpdate : function() {
			if (this.list == null || this.list.length == 0) {
				this.$rows.html = this.emptyMessageTemplate.expand(this);
				return;
			}
console.info(this.id,"updating, selectedIndex: ",this.selectedIndex, ", length:",this.list.length);

			// clear the old list items
			this.$rows.empty();
			
			var index = this.startRow-1, 
				last = Math.min(this.startRow + this.maxRows, this.list.length)
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
			this.$rows.selectAll("row").forEach(function(row, index) {
				row.attr("index", index);
			});
		},

		fixSelectionHighlight : function() {
			// clear the old hilight
			var row = this.select("row[selected]");
			if (row) row.attr("selected",null);
			
			// show the new highlight
			row = this.select("row[index='"+this.selectedIndex+"']");
			if (row) row.attr("selected","yes");
		},
		
		// return a single, expanded outer HTML element that represents a row for the list item
		getItemRow : function(item, index) {
			return this.rowTemplate.inflateFirst(item);
		}
	}
});



Script.loaded("{{hope}}ListViewer.js");
});
