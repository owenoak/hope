//
//	Textile adaptor for hope -- based on lib/textile.js by 	ben@ben-daglish.net
//

(function(hope) {	/* Begin hidden from global scope */

hope.fromTextile = hope.global.fromTextile;

// reloads the last url if none passed in
// if no div, creates one (and re-uses it)
hope.loadTextile = function loadTextile(url, div) {
	if (!url) 	return hope.error("hope.loadTextile(): You must specify a url");

	if (div && typeof div == "string") div = hope.select(div);
	if (!div) div = hope.create("div",{id:'textileDisplay',parent:'body'});

	var request = hope.ajax(url, showTextile);
	
	function showTextile() {
		var text = request.responseText;
		var html = hope.fromTextile(text);
		div.innerHTML = html;
	}
}

})(hope);

