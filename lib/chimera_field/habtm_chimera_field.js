/**
 * HasAndBelongstoMany Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var HABTM = Function.inherits('ChimeraField', function HasAndBelongsToManyChimeraField(fieldType, options) {

	HasAndBelongsToManyChimeraField.super.call(this, fieldType, options);

	this.viewname = 'habtm';
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
HABTM.setMethod(function sendRelatedData(conduit) {

	var fieldType = this.fieldType,
	    model = Model.get(fieldType.options.modelName);

	model.find('all', {fields: ['_id', 'title', 'name']}, function gotData(err, results) {

		if (err) {
			return conduit.error(err);
		}

		conduit.end(results);
	});
});
