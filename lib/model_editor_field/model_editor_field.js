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
	 * Prepare field information for input or saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareInfo = function prepareInfo(options, callback) {

		var valueSource;

		// Store the options in here
		this._options = options;

		this.module = options.module;

		this.fieldKey = options.fieldKey;

		if (!this.fieldKey) {
			this.fieldKey = this.fieldName;
		}

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

		// Get the context: an object where data can be fetched from
		if (options.context) {
			this.context = options.context;
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
					if (this.fieldConfig.path && (typeof valueSource !== 'undefined') && valueSource !== null) {
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
			this.fullPath += '[' + this.dataName + '][' + this.fieldKey + ']';
		}

		// The path should always begin with data
		this.fullPath = 'data' + this.fullPath;

		callback();
	};

	/**
	 * Prepare a field for index view
	 *
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareIndex = function prepareIndex(options, callback) {

		var that = this;

		this.prepareInfo(options, function afterPrepareInfo() {

			that.index(function afterIndex() {
				callback({
					fullPath: that.fullPath,
					field: that.fieldName,
					value: that.value,
					view: that.fieldView + '_view'
				});
			});
		});
	};

	/**
	 * Prepare a field for input
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}     options
	 * @param    {Function}   callback
	 */
	this.prepareInput = function prepareInput(options, callback) {

		var that = this;

		// Prepare the field info
		this.prepareInfo(options, function afterPrepareInfo() {

			// Fire the input
			that.input(function afterInput() {
				callback({
					id: 'AdminField-' + that.fieldName,
					fullPath: that.fullPath,
					field: that.fieldName,
					value: that.value,
					view: that.fieldView
				});
			});
		});
	};

	/**
	 * The function that prepares the view value for the index
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.index = function index(callback) {
		callback();
	};

	/**
	 * The function that actually modifies the input value
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.input = function input(callback) {
		callback();
	};

	/**
	 * Get the list options (for selects)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.options = function options(callback) {
		callback();
	};

	/**
	 * The function that modifies the value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback
	 */
	this.save = function save(callback) {
		callback();
	};

	/**
	 * Process data before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}     options
	 * @param    {Function}   callback
	 */
	this.prepareSave = function prepareSave(options, callback) {

		var that = this;

		// Prepare the field info
		this.prepareInfo(options, function afterPrepareInfo() {

			var objectPath = options.fieldConfig.field;

			if (options.fieldConfig.path) {
				objectPath += '.' + options.fieldConfig.path;
			}

			// The processed data should be stored in here
			that.processedData = alchemy.objectPath(options.processedData, objectPath, null, true);

			// The originalData as found in the database goes here
			that.originalData = options.originalData;

			// The data from the view goes in here
			that.data = options.data;

			// Set the current value
			that.value = that.data[that.fieldKey];

			if (options.fieldConfig.array) {
				if (!Array.isArray(that.value)) {
					that.value = [that.value];
				}
			}

			that.save(function afterSave() {

				// If the value is still in the object, add it to the data
				// This way there's a difference between an 'undefined' value
				// and no value at all
				if ('value' in that) {
					// Do object path again, but this time with the value
					that.processedData = alchemy.objectPath(options.processedData, objectPath, that.value);
				}

				callback();
			});
		});
	};

	/**
	 * Get an augmented model, but skip certain properties
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getModel = function getModel(modelName, autoCreate, options) {

		if (typeof autoCreate == 'object') {
			options = autoCreate;
			autoCreate = undefined;
		}

		if (typeof options != 'object') {
			options = {};
		}

		if (typeof options.skip != 'object') {
			options.skip = {};
		}

		// Certain keys should not be augmented further, they will screw up the model
		options.skip.model = true;
		options.skip.modelName = true;

		return this.parent('getModel', null, modelName, autoCreate, options);
	};

});