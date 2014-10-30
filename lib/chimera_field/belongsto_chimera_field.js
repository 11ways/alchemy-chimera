/**
 * Belongsto Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var BelongsTo = Function.inherits('ChimeraField', function BelongsToChimeraField(fieldType, options) {

	BelongsToChimeraField.super.call(this, fieldType, options);

	this.viewname = 'belongsto';
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
BelongsTo.setMethod(function sendRelatedData(conduit) {

	var fieldType = this.fieldType,
	    model = Model.get(fieldType.options.modelName);

	model.find('all', {fields: ['_id', 'title', 'name']}, function gotData(err, results) {

		if (err) {
			return conduit.error(err);
		}

		conduit.end(results);
	});
});
