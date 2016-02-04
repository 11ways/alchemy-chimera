/**
 * Enum Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var Enum = Function.inherits('ChimeraField', function EnumChimeraField(fieldType, options) {

	EnumChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/assoc_field';

	this.viewname = 'enum';
	this.viewwrapper = 'default';
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
Enum.setMethod(function sendRelatedData(conduit) {

	var fieldType = this.fieldType,
	    results = [],
	    schema = fieldType.schema,
	    values,
	    title,
	    entry,
	    key;

	// Try getting the values for the enum field by the original field name
	values = schema.enumValues[fieldType.name];

	// If none were found, pluralize the name and try again
	if (values == null) {
		values = schema.enumValues[fieldType.name.pluralize()];
	}

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
