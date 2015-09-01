/**
 * Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var ChimeraField = Function.inherits(function ChimeraField(fieldType, options) {

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

	// @todo: add real path
	this.path = fieldType.schema.name + '.' + fieldType.name;
});

/**
 * Get the database value from the given record
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   actionType
 * @param    {Object}   record
 * @param    {Function} callback
 */
ChimeraField.setMethod(function actionValue(actionType, record, callback) {

	var value = this.getRecordValue(record);

	setImmediate(function() {
		callback(null, value);
	});
});

/**
 * Respond with related data values for this field
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 */
FieldType.setMethod(function getChimeraField(options) {

	var className;

	// See if a modified type has been given
	if (options.type) {
		className = options.type + 'ChimeraField';

		if (alchemy.classes[className] == null) {
			className = null;
		}
	}

	// If no classname is yet set, get the default one for this field
	if (className == null) {
		className = this.typename + 'ChimeraField';

		if (alchemy.classes[className] == null) {
			className = 'ChimeraField';
		}
	}

	return new alchemy.classes[className](this, options);
});