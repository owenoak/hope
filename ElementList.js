/*** List of ElementList (like malleable cross between NodeList and Array ***/

//TODO: pick up all standard Element properties and methods so they have the same api???

Script.require("{{hope}}Element.js,{{hope}}List.js", function(){

	new List.Subclass("ElementList");

	// give ElementList the same api as Element
	List.makeAppliers(ElementList, "on,attr,destroy");
	List.makeAppliers(ElementList, "select,selectAll,matches",true);
	List.makeAccessors(ElementList, "width,height,left,top,opacity");
	List.makeAccessors(ElementList, "innerHTML,className,style,bg,radius", true);
	
	// give the native NodeList and HTMLElement array-like-things the ElementList functionality
	// NOTE: some of it (eg: remove) doesn't work...
	hope.extendIf(NodeList.prototype, ElementList.prototype);

Script.loaded("{{hope}}ElementList.js");
});// end Script.reqiure
