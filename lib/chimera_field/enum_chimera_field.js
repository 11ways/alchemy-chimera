/**
 * Enum Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {FieldType}
 */
var Enum = Function.inherits('ChimeraField', function EnumChimeraField(fieldType, options) {

	EnumChimeraField.super.call(this, fieldType, options);

	this.script_file = [{name: 'jquery', path: '//code.jquery.com/jquery-1.11.3.min.js'}, 'selectize/0.11/selectize', 'chimera/assoc_field'];
	this.style_file = 'selectize/0.11/selectize';

	this.viewname = 'enum';
	this.viewwrapper = 'default';
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

		if (entry == null) {
			title = key;
		} else if (Object.isPrimitive(entry)) {
			title = entry;
		} else if (alchemy.classes.I18n && entry instanceof alchemy.classes.I18n) {
			// We're aware of the I18n class, even though it's an alchemy plugin
			title = entry;
		} else {
			title = entry.title || entry.name || key;
		}

		results.push({_id: key, title: title+''});
	}

	conduit.end(results);
});
