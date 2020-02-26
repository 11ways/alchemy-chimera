/**
 * Enum Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var Enum = Function.inherits('Alchemy.ChimeraField', function EnumChimeraField(fieldType, options) {

	EnumChimeraField.super.call(this, fieldType, options);

	this.script_file = [{name: 'jquery', path: '//code.jquery.com/jquery-1.11.3.min.js'}, 'selectize/0.11/selectize', 'chimera/assoc_field'];
	//this.style_file = 'selectize/0.11/selectize';

	this.viewname = 'enum';
	this.viewwrapper = 'default';
});

/**
 * Respond with related data values for this field
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Conduit}   conduit
 */
Enum.setMethod(function sendRelatedData(conduit) {

	var fieldType = this.fieldType,
	    results = [],
	    schema = fieldType.schema,
	    values,
	    title,
	    entry,
	    key;

	// Get the enum values
	values = fieldType.getValues();

	// Iterate over the values and get the correct id & title
	for (key in values) {

		entry = values[key];

		title = this.getDisplayValue(entry);

		results.push({_id: key, title: title+''});
	}

	conduit.end(results);
});

/**
 * Get the display value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Object}   entry
 */
Enum.setMethod(function getDisplayValue(entry, default_value) {

	var display_value;

	if (entry == null) {
		return default_value;
	} else if (Object.isPrimitive(entry)) {
		display_value = entry;
	} else if (Classes.Alchemy.I18n && entry instanceof Classes.Alchemy.I18n) {
		// We're aware of the I18n class, even though it's an alchemy plugin
		display_value = entry;
	} else {
		display_value = entry.title || entry.name;
	}

	if (!display_value) {
		display_value = default_value;
	}

	return display_value;
});

/**
 * Get the value to use in the action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.6.0
 *
 * @param    {String}   action_type
 * @param    {Object}   main_record
 * @param    {Function} callback
 */
Enum.setMethod(function actionValue(action_type, record, cb) {

	var display_value,
	    pledge = new Pledge(),
	    values,
	    value;

	pledge.done(cb);

	function callback(err, result) {
		if (err) {
			pledge.reject(err);
		} else {
			pledge.resolve(result);
		}
	}

	// Use custom method if set in the options
	if (this.options.actionValue) {
		this.options.actionValue.call(this, actionType, record, callback);
		return pledge;
	}

	value = this.getRecordValue(record);

	// Return the identifier when it's not a peek or a list
	if (action_type != 'list' && action_type != 'peek') {
		display_value = value;
	} else {
		// Get all the possible values
		values = this.fieldType.getValues();

		if (!values || !values[value]) {
			display_value = value;
		} else {
			display_value = this.getDisplayValue(values[value]);
		}
	}

	pledge.resolve(display_value);

	return pledge;
});