/* Tabs, tabbars, etc */

Script.require("{{hope}}Section.js", function(){


hope.Action.Subclass("hope.Tab", {
	tag : "tab"
});

hope.Stack.Subclass("hope.TabGroup", {
	tag : "tabgroup",
	properties : {
		itemSelector : "tabselector",
		selectorConstructor : hope.Tab
	}
});


Script.loaded("{{hope}}Tab.js");
});
