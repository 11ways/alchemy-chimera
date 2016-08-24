var cf_map = new WeakMap();

/**
 * Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var ChimeraField = Function.inherits('Alchemy.Base', function ChimeraField(fieldType, options) {

	if (options == null) {
		options = {};
	}

	this.fieldType = fieldType;

	/**
	 * Optional script file(s) to require
	 *
	 * @type     {String|Array}
	 */
	this.script_file = '';

	/**
	 * Optional style file(s) to require
	 *
	 * @type     {String|Array}
	 */
	this.style_file = '';

	/**
	 * The `view` part in `chimera/fields/{view}_{action}.ejs` template to use
	 *
	 * @type     {String}
	 */
	this.viewname = 'default';

	/**
	 * The `wrapper` part in `chimera/field_wrappers/{wrapper}_{action}.ejs` template to use
	 *
	 * @type     {String}
	 */
	this.viewwrapper = 'default';

	/**
	 * The `action` part in `chimera/fields/{view}_{action}.ejs` template to use
	 *
	 * @type     {String}
	 */
	this.viewaction = options.action || 'list';

	// Store the options
	this.options = options;

	// If there is a custom action value function,
	// add a `super` property link
	if (options.actionValue) {
		options.actionValue.super = this.actionValue;
	}

	if (fieldType.schema) {
		if (fieldType.schema.parent) {
			this.in_sub_schema = true;
			this.path = fieldType.name;
		} else {
			this.path = fieldType.schema.name + '.' + fieldType.name;
		}
	} else {
		this.path = fieldType.name;
	}
});

/**
 * Allow the field instance to be cached
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
ChimeraField.setProperty('allow_cache', true);

/**
 * Get the database value from the given record
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Object}   record
 *
 * @return   {Mixed}
 */
ChimeraField.setMethod(function getRecordValue(record) {
	return Object.path(record, this.path);
});

/**
 * Get the value to use in the action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {String}   actionType
 * @param    {Object}   record
 * @param    {Function} callback
 */
ChimeraField.setMethod(function actionValue(actionType, record, callback) {

	var value;

	// Use custom method if set in the options
	if (this.options.actionValue) {
		return this.options.actionValue.call(this, actionType, record, callback);
	}

	value = this.getRecordValue(record);

	setImmediate(function() {
		callback(null, value);
	});
});

/**
 * Respond with related data values for this field
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraField.setMethod(function sendRelatedData(conduit) {
	conduit.end('[]');
});

/**
 * Extend the FieldType model:
 * return a correct new associated Chimera Field instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
FieldType.setMethod(function getChimeraField(options) {

	var className,
	    CfClass,
	    serial,
	    cache;

	if (!options) {
		options = {};
	}

	// See if a modified type has been given
	if (options.type) {
		className = options.type + 'ChimeraField';

		if (Classes.Alchemy[className] == null) {
			className = null;
		}
	}

	// If no classname is yet set, get the default one for this field
	if (className == null) {
		className = this.typename + 'ChimeraField';

		if (Classes.Alchemy[className] == null) {
			className = 'ChimeraField';
		}
	}

	// Get the CF class constructor
	CfClass = Classes.Alchemy[className];

	if (CfClass.prototype.allow_cache) {

		serial = Object.checksum(options);

		// Get the CF cache
		cache = cf_map.get(this);

		if (!cache) {
			cache = {};
			cf_map.set(this, cache);
		}

		if (!cache[serial]) {
			cache[serial] = new CfClass(this, options);
		}

		return cache[serial];
	} else {
		return new CfClass(this, options);
	}
});