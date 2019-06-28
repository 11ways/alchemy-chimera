/**
 * HasAndBelongstoMany Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var HABTM = Function.inherits('Alchemy.ChimeraField', function HasAndBelongsToManyChimeraField(fieldType, options) {

	HasAndBelongsToManyChimeraField.super.call(this, fieldType, options);

	this.script_file = [{name: 'jquery', path: '//code.jquery.com/jquery-1.11.3.min.js'}, 'selectize/0.11/selectize', 'chimera/assoc_field'];
	//this.style_file = ['selectize/0.11/selectize'];

	this.viewname = 'habtm';
	this.viewwrapper = 'default';
});

/**
 * Respond with related data values for this field
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.0
 *
 * @param    {Conduit}   conduit
 */
HABTM.setMethod(function sendRelatedData(conduit) {

	var fieldType = this.fieldType,
	    model = Model.get(fieldType.options.modelName),
	    fields;

	fields = ['_id', 'title', 'name'].concat(model.displayField);

	let find_options = {};

	if (model.display_field_select) {
		find_options.select = model.display_field_select.slice(0);
	}

	model.find('all', find_options, function gotData(err, results) {

		var response;

		if (err) {
			return conduit.error(err);
		}

		response = {
			items: results.toSimpleArray(fields),
			displayField: model.displayField
		};

		conduit.end(response);
	});
});
