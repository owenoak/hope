/* Tabs, tabbars, etc */

Script.require("{{hope}}Section.js", function(){


$Action.Subclass("$Tab", {
	tag : "tab"
});

$Stack.Subclass("$TabGroup", {
	tag : "tabgroup",
	properties : {
		itemSelector : "tabselector",
		selectorConstructor : $Tab
	}
});


Script.loaded("{{hope}}Tab.js");
});
