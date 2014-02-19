var PropertyTypes = alchemy.shared('Chimera.propertyTypes');

/**
 * The Property Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.classes.BaseClass.extend(function PropertyType() {

	/**
	 * Instantiate the class
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   parent   The parent class
	 * @param    {Function}   child    The (extended) child class
	 */
	this.__extended__ = function __extended__(parent, child) {

		// Extract the name
		var title     = child.name.replace(/PropertyType$/, ''),
		    typeName = title.underscore();

		child.prototype.title = title.titleize();
		child.prototype.typeTitle = title;
		child.prototype.typeName = typeName;

		// Do not let the child inherit the extendonly setting
		if (!child.prototype.hasOwnProperty('extendonly')) {
			child.prototype.extendonly = false;
		}

		// Create a new instance if this is a useable type
		if (!child.prototype.extendonly) {
			PropertyTypes[typeName] = new child();
		}
	};

});