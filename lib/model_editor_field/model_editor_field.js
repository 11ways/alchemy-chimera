var ModelEditorFields = alchemy.shared('Chimera.modelEditorFields');

/**
 * The chimera class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.classes.BaseClass.extend(function ModelEditorField() {

	/**
	 * Instantiate a new Chimera View after this class has been extended
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
		var name     = child.name.replace(/ModelEditorField$|MEF$/, ''),
		    typeName = name.underscore();

		child.prototype.fieldName = name;
		child.prototype.typeName = typeName;

		// Do not let the child inherit the extendonly setting
		if (!child.prototype.hasOwnProperty('extendonly')) {
			child.prototype.extendonly = false;
		}

		// Create a new instance if this is a useable type
		if (!child.prototype.extendonly) {
			ModelEditorFields[typeName] = new child();
		}
	};

	/**
	 * Prepare a field for input
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareInput = function prepareInput(model, item, field, fieldName, callback) {

		var that = this;

		this.model = model;
		this.item = item;
		this.field = field;
		this.fieldName = fieldName;

		if (item && item[model.modelName]) {
			this.value = item[model.modelName][fieldName];
		} else {
			this.value = '';
		}
		
		this.fieldView = 'default';

		this.input(function afterInput() {
			callback({
				field: fieldName,
				value: that.value,
				view: that.fieldView
			});
		});
	};

	/**
	 * The function that actually modifies the input value
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.input = function input(callback) {
		callback();
	};

});