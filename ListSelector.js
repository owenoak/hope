/* iOS list selector (kinda). */

//TODO: make items from a static list (semantics?)

Script.require("{{hope}}Menu.js", function(){


new hope.Menu.Subclass("hope.ListSelector", {
	tag : "listSelector",
	mixins : "Valued",
	properties : {
		template : "<container appearance='white'></container><span class='arrow'></span>",
		
		onReady : function() {
			this.onChild("row", "click", "onRowClicked");
		},
		
		update : function() {
			var old = this.select("row[selected]"),
				selected = this._selectedItem()
			;
			if (old && old != selected) old.selected = false;
			if (selected) selected.selected = true;
		},
		
		onRowClicked : function(event, row) {
			var value = row.attr("value");
			this.value = value;
			if (this.context) this.context.value = value;
			
			if (this.autoHide) this.visible = false;
		},
		
		
		_selectedItem : function() {
			return this.select("row[value='"+this.value+"']")
		},
		
		selectedLabel : function() {
			var item = this._selectedItem();
			if (item) {
				item = item.select("label");
				if (item) return item.innerHTML;
			}
			return this.value;
		}
	}
});


new hope.Action.Subclass("hope.ListSelectorButton", {
	tag : "listSelectorButton",
	mixins : "Valued",
	properties : {
		listeners : "click",
		
		menu : Attribute("menu"),
		$menu : Getter(function(){ var menu = this.menu; if (menu) return select(menu); }),
		
		onClick : function(event) {
			var menu = this.$menu;
			if (menu) menu.showForElement(this, event);
		},
		
		update : function() {
			var menu = this.$menu, value;
			if (menu) value = menu.selectedLabel();
			this.html = value || this.value;
		},
		
		onShown : function() {
			this.update();
		}
	}
});




Script.loaded("{{hope}}ListSelector.js");
});
