/** RANDOM DEBUG STUFF -- COLLECT HERE TO MAKE IT EASY TO REMOVE **/


setTimeout(function(){
	window.it = window.$brandO;
//	it.on("shown", function(){console.warn("$brandO SHOWN")});
//	it.on("hidden", function(){console.warn("$brandO HIDDEN")});
},1000);

// DEBUG
window.timeit = function timer() {
	var t0 = new Date().getTime();
	selectAll("*[_dataId]");
	console.warn("took ",(new Date().getTime() - t0),"msec");	
}





// simulate a window.onunload event so we can see what gets cleaned up
window.simulateUnload = function() {
	var event = document.createEvent("HTMLEvents");
	event.initEvent("unload",false,false);
	window.dispatchEvent(event);
}

