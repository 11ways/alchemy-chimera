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
	    plural = fieldType.name.pluralize(),
	    values,
	    title,
	    entry,
	    key;

	values = schema.enumValues[plural];

	for (key in values) {

		entry = values[key];

		if (entry == null) {
			title = key;
		} else if (Object.isPrimitive(entry)) {
			title = entry;
		} else if (entry instanceof alchemy.classes.I18n) {
			title = entry;
		} else {
			title = entry.title || entry.name || key;
		}

		results.push({_id: key, title: title+''});
	}

	conduit.end(results);
});
