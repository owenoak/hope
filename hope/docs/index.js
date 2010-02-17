
// show the docs
hope.docs = function(page){
	page = hope.docs.getPage(page);
	hope.cookie("hope.docs.lastPage", page);	// remember for reload
	var url = "{{docs}}"+page+".textile";
	hope.loadTextile(url, "#contents");
	hope.select("#title").innerHTML = page;
}


// get the page to show, first of:   page passed in, window.hash, cookie, default: "The Plan"
hope.docs.getPage = function(page) {
	if (page) return page;
	if (window.location.href) return window.location.hash.substr(1);
	return hope.cookie("hope.docs.lastPage") || "The Plan";
}

// load the TOC and the default page
hope.docs.launch = function() {
	// load the TOC
	hope.loadTextile("{{docs}}TOC.textile", "#toc");
	// load the last selected main content page
	hope.docs()
	
	// start a hash listener
// TODO: convert to a real hash listener...
	function checkHash() {
		var page = unescape(window.location.hash.substr(1));
		if (page == hope.cookie("hope.docs.lastPage")) return;
		hope.docs(page);
	}
	setInterval(checkHash, 100);
}

