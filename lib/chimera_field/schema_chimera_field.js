/**
 * Schema Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var SchemaChimeraField = Function.inherits('ChimeraField', function SchemaChimeraField(fieldType, options) {

	SchemaChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/schema_field';

	this.viewname = 'schema';
	this.viewwrapper = 'schema';
});

/**
 * Get the value to use in the action
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   actionType
 * @param    {Object}   main_record
 * @param    {Function} callback
 */
SchemaChimeraField.setMethod(function actionValue(actionType, main_record, callback) {

	var that = this,
	    actionFields,
	    subRecord,
	    is_array,
	    results,
	    schema,
	    field,
	    temp;

	schema = this.fieldType.getSubschema(main_record);

	if (typeof schema != 'object' || schema == null) {
		return callback(null);
	}

	actionFields = new alchemy.classes.ChimeraActionFields(schema, 'edit');
	subRecord = Object.path(main_record, this.path);
	is_array = Array.isArray(subRecord);
	results = [];

	// Always turn the element into an array
	if (!is_array) {
		subRecord = [subRecord];
	}

	Function.forEach.parallel(subRecord, function eachRecord(record, index, next) {

		actionFields.processRecord(schema, record, function gotResults(err, result) {

			if (err != null) {
				return next(err);
			}

			// Make sure the requirement files are arrays
			that.script_file = Array.cast(that.script_file);
			that.style_file = Array.cast(that.style_file);

			// Add the script files of the sub fields to the schema field requirements
			result.fields.forEach(function eachSubField(entry) {
				if (entry.field.script_file) {
					that.script_file.include(entry.field.script_file);
				}

				if (entry.field.style_file) {
					that.style_file.include(entry.field.style_file);
				}
			});

			// Remove any empty strings
			that.script_file.clean('');
			that.style_file.clean('');

			results[index] = result;
			next();
		});
	}, function done(err) {

		if (err) {
			return callback(err);
		}

		callback(null, results);
	});
});