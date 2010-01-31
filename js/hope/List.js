/*! Hope application framework, v 0.1					See: http://hopejs.com
 *	MIT license.										See: http://hopejs.com/license
 *	Copyright (c) 2006-2009, Matthew Owen Williams.
 */


// TODO: check notification pattern, make sure we're not hammering
//			especially with clear() or something like that which will change a lot of things


/** 
	List-like extensions. Added to Array and you can add to other items as you like. 

	For indexOf() and other comparisons, you can implement list.equals(a,b) 
	which returns true if `a` and `b` are semantically the same for your list.
	
	
	We have three variant mixins:
		hope.ListLike		= Something that IS a list
		hope.ListManager 	= Something that MANAGES a list (eg: has a list as one of its properties).
								For this, your prototype MUST define:
									function getList() {
										return this.YOUR_LIST_PROPERTY_NAME;
									}
		hope.Set			= A named set (object/hash/map/whatever) that you want to treat like a list.

*/


//	TODO:
//			- check out Giammarchi's Stack-extensions for speed
//			- For list subclasses (eg: ElementList)
//				- ElementList.clone(someOtherListLikeThing) => returns ElementList
//				- 
//			- redo foreach using native map, creating a function to do the lookup if string method?
//			- 1-based lists?
//			- foreach makes a new instance of the same type of object?
//				- listConstructor which defaults to constructor?
//
//			- Sparse array w/ranges (ala SproutCore)
//			- Notify semantics?
//			- when dealing with a set, forEach() should return a new set with the same keys
//				- probably need a custom forEach() for this which doesn't use an iterator

(function(hope) {	/* Begin hidden from global scope */

// copy of slice and splice so we can use them below
var splice = Array.prototype.splice, 
	slice = Array.prototype.slice,
	map  = Array.prototype.map
;
var ARRAY_KEYS = [];


// identity comparison function
var IDENTITY_EQUALS = function(a,b) {	return (a === b);	}



//
//	Methods for dealing with something that IS a linear list of items 
//		(eg: indexes are numbers from 0..N)
//
var ListMethods = {
	/** 
		NOTE: Your subclass may need to override some of the following few methods, 
				but you'll get everything below getKeys() for free.
	*/

	/** Return a pointer to the list. 
		Override this if your list is not your main object.
	*/
	getList : function() {
		return this;
	},

	/** Return the item at a certain index. */
	getItem : function(index) {
		return this[index];
	},
	
	/** Set the item at a certain position. */
	setItem : function(index, value) {
		var list = this.getList();
		if (list[index] !== value) {
			// use splice so this will always update "length"
			splice.apply(list, [index, 1, value]);
			this.notifyListChange(index, 1, value);
		}
		return this;
	},
	
	/** Add one or more items to this array at a certain position, pushing other things back. */
	addItem : function addItem(index, item1, item2, etc) {
		if (index == null) index = this.length;
		var args = hope.args(arguments, 1, [index, 0]),
			list = this.getList()
		;
		splice.apply(list, args);
		this.notifyListChange(index, null, list);
		return this;
	},

	/** Remove the item at a particular index of the array, moving things up to fill the hole. */
	removeItem : function removeItem(index, count) {
		var	list = this.getList();
		if (index > list.length) return this;
		if (count == null) count = 1;
		splice.call(list, arguments);
		this.notifyListChange(index, null, list);
		return this;
	},


	/** Return an vanilla array of keys of items in this array. 
		For an array, it's just an array of numbers:   [0,1,2,3,4,etc] 
		(constructing this list is quick 'cause we cache it).
		
		For a hash, it would be the list of keys of the hash, etc.
		
		If startAt is undefined, we set it to 0.
		If endAt is undefined, we set it to our length.
		
		NOTE: this implementation will barf for a large sparse array -- do something else.
	*/
	getKeys : function getKeys() {
		var length = this.length;
		if (ARRAY_KEYS.length < length) {
			for (var i = ARRAY_KEYS.length; i < endAt; i++) {
				ARRAY_KEYS[i] = i;
			}
		}
		return ARRAY_KEYS.slice(0,length);
	},


	/** Return an enumerator -- a function that yields each item in your list one at a time. 
		Returns hope.DONE when there are no more items in the list.
		The list of items that the enumerator looks at is fixed at the time you create it.
		
		Note that behavior of your enumerator is not well defined 
		if the list mutates while enumerating!
	*/
	getEnumerator : function getEnumerator() {
		var list = this.getList(), index = 0;
		return function getNext() {
			if (index >= list.length) return hope.DONE;
			getNext.index = index;
			return list[index++];
		}
	},

	/** Return the first index that equals it. Returns -1 if not found. 
		Note: this is not the most efficient, you may want to override this as well.
	*/
	indexOf : function indexOf(it, index) {
		var list = this.getList();
		var length = list.length;
		if (length === 0) return -1;
		if (index == null) index = 0;
		if (this.equals === IDENTITY_EQUALS) {
			// subtract 1 from index and convert to a while?
			for (; index < length; index++) {
				if (it === list[index]) return index;
			}
		} else {
			for (; index < length; index++) {
				if (this.equals(it, list[index])) return index;
			}
		}
		return -1;
	},


	/** 
	 *
	 *  	All of the below are completely generic, they use only the methods above. 
	 *		You should not need to override any of the below.
	 *
	 */

	/** Add items at the end of the list (aka 'push').  
		May not work well for non-linear variants. 
	*/
	add : function(item1, item2, etc) {
		var args = hope.args(arguments, 0, [this.length]);
		this.addItem.apply(this, args);
	},

	/** Return true if a is logically the same as b.
		Default is to do a === compare, override in your subclass
		to do a more logical comparison.
	*/
	equals : IDENTITY_EQUALS,

		
	/** Return the last index that equals it. Returns -1 if not found. */
	lastIndexOf : function lastIndexOf(it, index) {
		var length = this.length;
		if (index == null) index = length;
		for (; index > -1 ; index--) {
			if (this.equals(it, this.getItem(index))) return index;
		}
		return -1;
	},
	
	/** Return true if this set is empty. */
	isEmpty : function() {
		return (this.length === 0);
	},
	
	/** Return true if this array contains it. */
	contains : function contains(it) {
		return (this.indexOf(it) != -1);
	},
	
	/** Return true if an array starts with value passed in. */
	startsWith : function startsWith(it) {
		return this.equals(this.getItem(0), it);
	},

	/** Return true if an array ends with value passed in. */
	endsWith : function endsWith(it) {
		return this.equals(this.getItem(this.length-1), it);
	},
	
	
	/** Add one or more items at an index. 
		If any item is already in the list, remove it from its current position
		and add it at the new spot.
	*/
	addOnce : function(index, item1, item2, etc) {
		for (var i = arguments.length - 1, position; i >= 1; i--) {
			while ( (position = this.indexOf(arguments[i])) != -1) {
				this.removeItem(position);
			}
		}
		return this.addItem.apply(this, arguments);
	},

	/** Clear the entire list. */
	clear : function() {
		return this.removeItem(0, this.length);
	},


	/** Remove all occurances of one or more items from the array. */
	remove : function remove(item1, item2, etc) {
		for (var i = arguments.length - 1; i >= 0; i--) {
			var it = arguments[i], index;
			while ((index = this.indexOf(it)) != -1) {
				this.removeItem(index);
			}
		}
		return this;
	},
	
	/** Replace this thing with that thing.
		If thisThing is not in the array, puts thatThing at the end.
	*/
	replace : function(thisThing, thatThing) {
		if (this.equals(thisThing, thatThing)) return this;
		
		var index = this.indexOf(thisThing)
		if (index === -1) return this.addItem(null, thatThing);
		while (index != -1) {
			this.setItem(index, thatThing);
			index = this.indexOf(thisThing)
		}
		return this;
	},



	/** Iterator function which:
			- takes either:
				- a function 'method' and optional 'context' object, or
				- a string 'method', which, for each item
					- if item or item[property] is not defined, returns undefined
					- if item[property] is a method, returns item[property]()
					- otherwise returns item[property]
			- ALWAYS returns an array of the results, even if the array is not defined
		
		So you can do:
		
			var myArray = [ {a:1, b:function(){return true}}, {a:2, b:function(){return false}}];
			myArray.forEach("a");		<== [1,2]
			myArray.forEach("b");		<== [true, false]
			myArray.forEach(function(it){return "" + it.a + it.b() });	<== ["1true","2false"]
			
		Note that we take over Array.prototype.forEach and/or Array.forEach, 
		but this version is fully backwards compatible (except our version ALWAYS returns an array).
	*/
	forEach : function forEach(method, context) {
		var results = new (this.constructor)(), getNext = this.getEnumerator(), it, value, i = 0;

		// invoke-style
		if (typeof method === "string") {
			while ((it = getNext()) != hope.DONE) {
				value = (it ? it[method] : null)
				if (typeof value === "function") value = it[method]();
				results.setItem(getNext.index, value);
			}
		}
		// map style with a context object
		// TODO: we could use Array.proto.map here for speed if in an array-like...
		else if (context) {
			while ((it = getNext()) != hope.DONE) {
				value = method.apply(context, [it, getNext.index, this]);
				results.setItem(getNext.index, value);
			}
		}
		// map-style with a method
		else {
			while ((it = getNext()) != hope.DONE) {
				value = method(it, getNext.index, this);
				results.setItem(getNext.index, value);
			}
		}
		return results;
	},
	
	
	/** Return a new list of items for which the condition function is true. 
		Returned list is of the same type as this list.
		
		If <condition> is a string, we will invoke a function with that name on each defined item.
		if <condifion> is a function, we will call that function anonymously on each item.
	
		Pass "true" for getFirst to return the first element which succeeds (NOT as an array).
	*/
	where : function where(condition, getFirst) {
		var results = new (this.constructor)(), 
			getNext = this.getEnumerator(),
			it
		;
		if (typeof condition === "string") {
			while ((it = getNext()) != hope.DONE) {
				if (it == null || typeof it[condition] !== "function") continue;
				if (it[condition]()) {
					if (getFirst) 	return it;
					else			results.setItem(getNext.index, it);
				}
			}
		} else {
			while ((it = getNext()) != hope.DONE) {
				if (condition(it, getNext.index, this)) {
					if (getFirst) 	return it;
					else			results.setItem(getNext.index, it);
				}
			}
		}
		return (getFirst ? null : results);
	},
	
	
	/** Returns the first item for which condition is truthy.
		See `array.where()` for possible values of condition.
	*/
	firstWhere : function firstWhere(condition) {
		return this.where(condition, true);
	},


	/** Strip null entries from this array and return it. */
	compact : function compact() {
		for (var i = this.length - 1; i >= 0; i--) {
			if (this.getItem(i) == null) this.removeItem(i);
		}
		return this;
	},

	/** Special method to notify when the list changes. 
		You should use this rather than calling this.notify() directly
		because it will clear the cache for lists that care about it.
		
		NOTE: this is a special case that we can maybe eliminate when the notification
				system is more robust.
		
	*/
	notifyListChange : function notifyListChange(index, count, _members) {
		if (this.clearListCache) this.clearListCache();
		if (!this.notify) return;
		if (count == 1) {
			this.notify("changed", index, _members || this.getItem(index));
		} else {
			if (index == null) index = 0;
			var last = (count != null ? index + count : this.length);
			if (_members) {
				for (; index < last; index++) {
					this.notify(index, _members[index]);
				}
			} else {
				for (; index < last; index++) {
					this.notify("changed", index, this.getItem(index));
				}
			}
		}
	},
	
	/** Clear the list items out of the cache.  Override if your list maintains cached items. */
	// clearListCache : function() {}

};// end ListMethods


// create a ListLike mixin
new hope.Mixin(
	{
		name : "ListLike", 
		overwrite  : hope.MERGE,					// default is to NOT overwrite
		prototype : ListMethods,
		classDefaults : hope.makeAppliers(ListMethods),
		mixin : "Observable"
	}
);


// apply ListLike to Array, overwriting what's already there.
//hope.ListLike.mixinTo(Array, hope.OVERWRITE);




new hope.Class({
	name : "List",
	constructor : function List() {
		push.apply(this, slice.call(arguments));
		this.initialize();
	},
	mixins : "ListLike",	// also gets Observable, Cacheable
	prototype : {
		length : 0
	}
});






// Create a variant on ListLike for something that Manages a list (like a tree),
//	eg: where the list is one of the properties of the thing, but not the list itself.
//
//	NOTE: you MUST provide a getList() method -- everyting else is automatic.
//			And your getList() MUST return at least an empty array.
//
var ListManagerMethods = hope.extend(hope.IGNORE, {}, ListMethods, {

	/** Pitch a fit if they didn't define "getList" */
	getList : function(){
		throw TypeError("You MUST define a getList() method for your ListManager.");
	},
	
	/** getter/setter for length to look into the main list. */
	get_length : function()		{	return this.getList().length;	},
	set_length : function(value){	this.getList().length = value;	}
	
});

// create a ListManager mixin.
new hope.Mixin(
	{
		name : "ListManager", 
		overwrite  : hope.MERGE,					// default is to NOT overwrite
		prototype : ListManagerMethods,
		classDefaults : hope.makeAppliers(ListManagerMethods),
		mixin : "Observable"
	}
);





//
//	Treat sets or other non-linear lists like arrays.
//
//	We do this by iterating over their list of KEYS, as defined by list.getKeys()
//	rather than by their indices.   While getting the keys may be non-trivial,
//	this allows us to use a hash or a tree or what have you any place we would
//	normally use a list.
//
//	The default implementation caches the getKeys() and updates them whenever the list changes.
//

//	TODO: some way of setting up prototypes?
//
var SetMethods = hope.extend(hope.IGNORE, {}, ListMethods, {
	/** Return a pointer to the set. 
		Override this if your set is stored in some specific object.
	*/
	getList : function() {
		return (this.__set || (this.__set = {}));
	},

	/** Return the item at a certain index. */
	getItem : function(index) {
		return this.getList()[index];
	},

	/** Set the item at a certain position. */
	setItem : function(key, value) {
		var set = this.getList();
		if (set[key] !== value) {
			set[key] = value;
			this.notifyListChange(key, 1, value);
		}
		return this;
	},

	
	/** We will cache keys for speed. */
	clearListCache : function() {
		this.cache("list.keys", hope.CLEAR);
	},

	/** Length for a non-linear list is the length of its keys. */
	get_length : function(){
		return this.getKeys().length;
	},
	/** Define a bogus setter just so we don't get errors if someone trys to assign to it. */
	set_length : function(){},
	
	/** Generate the keys from the keys in our main object. */
	getKeys : function getKeys() {
		var keys;
		if (keys = this.cache("list.keys")) return keys;
		keys = [];
		var set = this.getList();
		for (var key in set) {
			keys[keys.length] = key;
		}
		return this.cache("list.keys", keys);
	},
	
	/** If they pass a number into getItem, return that item in the keys. */
	getItem : function(key) {
		var set = this.getList();
		if (typeof key == "number") {
			if (set[key] !== undefined) return set[key];
			key = this.getKeys()[key];
			return set[key];
		} else {
			return set[key];
		}
	},

	/** Add a single value to this array under a certain key. */
	addItem : function addItem(key, value) {
		// skip errors -- just don't add (?)  warn?
		if (key == null) return hope.error(this+".add(",arguments,")", "You must specify a key to add for this type of list");
		if (arguments.length > 2) hope.warn(this+".add(",arguments,")", "You can't add more than one thing at once to this type of list. Skipping values after first");
		return this.setItem(key, value);
	},

	/** Remove a single item from this array */
	removeItem : function removeItem(key, count) {
		if (count != null && count != 1) return hope.warn(this+".removeItems(",arguments,")", "You can only remove one item at a time from this type of list");
		return this.setItem(key, undefined);
	},

	/** Return an enumerator -- a function that yields each item in your list one at a time. 
		Returns hope.DONE when there are no more items in the list.
		The list of items that the enumerator looks at is fixed at the time you create it.
		
		Note that behavior of your enumerator is not well defined 
		if the list mutates while enumerating!
	*/
	getEnumerator : function() {
		var list = this, keys = this.getKeys(), index = 0, key, value;
		return function getNext() {
			if (index === keys.length) return hope.DONE;
			key = keys[index++];
			getNext.index = key;
			return list.getItem(key);
		}
	},

	/** Return the first index where the item equals() it. Returns -1 if not found. 
		This works in terms of the list getKeys(), so it works fine with a hash, etc.
	*/
	indexOf : function indexOf(it, index) {
		var length = this.length, keys;
		if (length === 0) return -1;
		
		if (index == null) index = 0;
		keys = this.getKeys();

		for (; index < length; index++) {
			var key = keys[index], next = this.getItem(key);
			if (this.equals(it, next)) return key;
		}
		return -1;
	},
	
	/** Return the last index that equals it. Returns -1 if not found. 
		This works in terms of the list getKeys(), so it works fine with a hash, etc.
	*/
	lastIndexOf : function lastIndexOf(it, fromIndex) {
		var length = this.length, endAt, keys;
		if (index === undefined) index = length;
		keys = this.getKeys();

		for (; index >= 0; index--) {
			var key = keys[index], next = this.getItem(key);
			if (this.equals(it, next)) return key;
		}
		return -1;
	},

	/** Clear the entire list. */
	clearList : function() {
		var keys = this.getKeys();
		for (var i = keys.length - 1; i >= 0; i--) {
			this.removeItem(keys[i]);
		}
		return this;
	},


	/** Override the _setUnknown (property) method to set on the __set. */
	set_unknown : function(key, value) {
		var set = this.getList();
		var oldValue = set[key];
		if (oldValue != value) {
			set[key] = value;
			if (this.notify) this.notify("changed."+key, value);
			return value;
		}
	}
});


// create a mixin for the non-Linear methods
new hope.Mixin(
	{
		name : "SetLike", 
		overwrite  : hope.MERGE,					// default is to NOT overwrite
		prototype : SetMethods,
		classDefaults : hope.makeAppliers(SetMethods)//,
//		mixins : "Observable"
	}
);


new hope.Class({
	name : "Set",
	mixins : "SetLike"
});


/* End hidden from global scope */ })(hope);
