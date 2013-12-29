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
	this.prepareInput = function prepareInput(options, callback) {

		var that = this,
		    valueSource;

		// Store the options in here
		this._options = options;

		this.module = options.module;

		// See if a path has been given
		if (options.fullPath) {
			this.fullPath = options.fullPath;
		} else {
			this.fullPath = '';
		}

		// Get the field name
		if (options.fieldName) {
			this.fieldName = options.fieldName;
		} else {
			log.error('There is no fieldname set!');
			return;
		}

		// Get the field config
		if (options.fieldConfig) {
			this.fieldConfig = options.fieldConfig;
		}

		// Get the model, if there is any
		if (typeof options.model == 'object') {
			this.model = options.model;
		} else if (typeof options.model == 'string') {
			this.model = this.getModel(options.model);
		} else {
			this.model = false;
		}

		// Get the current model name
		if (this.model) {
			this.modelName = this.model.modelName;
		} else {
			this.modelName = false;
		}

		// Set the data name
		if (options.dataName) {
			this.dataName = options.dataName;
		} else {
			if (this.modelName) {
				this.dataName = this.modelName;
			} else {
				this.dataName = 'ModelEditorField';
			}
		}

		// Get the record item where our value could be in
		if (options.item) {
			this.item = options.item;
		} else {
			this.item = false;
		}

		// Set the value to undefined
		this.value = undefined;

		// Get the current value, if any
		if (options.value) {
			this.value = options.value;
		} else {
			
			// See if there's a record available to get the value from
			if (this.item) {

				// Look directly in the item for the wanted field
				if (this.item[this.fieldName]) {
					valueSource = this.item;
				} else {
					// Is there a modelname, we might need to look inside the record
					if (this.item[this.modelName]) {
						valueSource = this.item[this.modelName];
					} else {
						// If that's also not there, just use the object given
						valueSource = this.item;
					}
				}

				if (typeof valueSource[this.fieldName] !== 'undefined') {
					valueSource = valueSource[this.fieldName];

					// If a path has been given, look into the object
					if (this.fieldConfig.path && (typeof valueSource !== 'undefined')) {
						valueSource = valueSource[this.fieldConfig.path];
					}

					this.value = valueSource;
				}

			}
			
			if (typeof this.value === 'undefined') {
				
				if (options.fieldConfig.default) {
					this.value = options.fieldConfig.default;
				} else {
					this.value = '';
				}
			}
		}
		
		// See if the fieldView is set in the options
		// This can still be changes by the input itself
		if (options.fieldView) {
			this.fieldView = options.fieldView;
		} else {
			this.fieldView = 'default';
		}

		if (!this.fullPath) {
			this.fullPath += '[' + this.dataName + '][' + this.fieldName + ']';

			if (this.fieldConfig.path) {
				this.fullPath += '[' + this.fieldConfig.path + ']';
			}
		}

		// The path should always begin with data
		this.fullPath = 'data' + this.fullPath;

		this.input(function afterInput() {
			callback({
				id: 'AdminField-' + that.fieldName,
				fullPath: that.fullPath,
				field: that.fieldName,
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