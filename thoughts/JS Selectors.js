Selectors for JSON
- Have syntax that allows you to select JS Objects as easily as CSS selectors.

Thoughts from CSS:

	*			Selects everything (??)
	type		Selects instances of a given type (alias for Class?  only for Boolean/String/etc?)
	.Class		Selects instances of a given class
	#id			Selects instances with that id
	[foo]		Selects things with attribute foo defined
	[foo=bar]	Selects things with attribute foo==bar
	[foo~=bar]	Selects things with one space-separated item of foo attribute == bar
	[foo|=bar]	Selects things with one hyphen-separated item of foo attribute == bar

	sel1 sel2	Selects sel2 items which are DESCENDANTS of sel1
	sel1>sel2	Selects sel2 items which are CHILDREN of sel2
	
	sel:first	first element which matches
	sel:last	last element which matches


Other ideas:

	!sel		Selects things where selector is not true
	[foo*=bar]	Selects things where 'bar' is a substring of attribute foo
	(s1,s2,s3)	Selects things where any of the three selectors is true


Questions
	- null?
	- how can we do index?  [1] ?
	- 	
