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
	this.path = fieldType.schema.parent.prototype.name + '.' + fieldType.name;
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

	var value;

	value = Object.path(record, this.path);

	setImmediate(function() {
		callback(null, value);
	});
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

	className = this.typename + 'ChimeraField';

	if (alchemy.classes[className] == null) {
		className = 'ChimeraField';
	}

	return new alchemy.classes[className](this, options);

});