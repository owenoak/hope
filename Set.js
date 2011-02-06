var Set = {


	mapToList : function(map) {
		if (!map) return [];
		var list = [];
		for (var key in map) {
			list[list.length] = map[key];
		}
		return list;
	},
	

	// copy properties from src into dest
	//	creates dest if necessary
	extend : function(src, dest) {
		if (!dest) dest = {};
		if (src) {
			for (var key in src) {
				dest[key] = src[key];
			}
		}
		return dest;
	},
		

// TODO: take a single list instead?
	// return a map of only the things that are in ALL maps
	// if a map is empty 
	intersectMaps : function(maps) {
		// eliminate all null maps
		var args = $args().compact();
		
		// if there was at least one null map
		if (args.length !== arguments.length) return {};

		// if no maps passed in
		if (args.length == 0) return {};
		
		// if only one map, clone it
		if (args.length == 1) return Set.extend(args[0]);
		
		for (var i = 1, allMap = args[0]; i < args.length; i++) {
			var pairMap = {}, nextMap = args[i];
			for (var key in allMap) {
				if (nextMap[key] !== undefined) pairMap[key] = allMap[key];
			}
			matching = pairMap;
		}
		return matching;
	},
	
// TODO: take a single list instead?
	// return a map that is the UNION of all maps
	unionMaps : function(map1, map2, etc) {
		var args = $args().compact(),
			results = {},
			i = -1, 
			map
		;
		while (map = args[++i]) {
			Set.extend(map, results);
		}
		return results;
	}
}