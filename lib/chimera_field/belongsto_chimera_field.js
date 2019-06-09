/**
 * Belongsto Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var BelongsTo = Function.inherits('Alchemy.ChimeraField', function BelongsToChimeraField(fieldType, options) {

	BelongsToChimeraField.super.call(this, fieldType, options);

	this.script_file = [{name: 'jquery', path: '//code.jquery.com/jquery-1.11.3.min.js'}, 'selectize/0.12/selectize', 'chimera/assoc_field'];
	//this.style_file = 'selectize/0.12/selectize';

	this.viewname = 'belongsto';
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
BelongsTo.setMethod(function sendRelatedData(conduit, item, options) {

	var that = this,
	    fieldType = this.fieldType,
	    model = Model.get(fieldType.options.modelName),
	    find_options,
	    fields,
	    type,
	    id;

	if (typeof options != 'object') {
		options = {};
	}

	fields = ['_id', 'title', 'name'].concat(model.displayField);
	find_options = {};

	if (options.display_field_only) {

		// This means we only want the title of the selected value
		// So if there IS NO selected value, we should return nothing
		id = Object.path(item, this.path);

		if (!id) {
			return conduit.end('');
		}

		find_options.conditions = {_id: Object.path(item, this.path)};
		type = 'list';
	} else {
		type = 'all';
	}

	if (model.display_field_select) {
		find_options.select = model.display_field_select.slice(0);
	}

	model.find(type, find_options, function gotData(err, results) {

		var response,
		    item;

		if (err) {
			return conduit.error(err);
		}

		if (options.display_field_only) {
			item = results[0];

			if (item) {
				response = item[model.displayField] || item.title || item.name || item._id;
			} else {
				response = '';
			}
		} else {
			response = {
				items: results.toSimpleArray(fields),
				displayField: model.displayField
			};
		}

		conduit.end(response);
	});
});

/**
 * Get the value to use in the action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.6.0
 *
 * @param    {String}   actionType
 * @param    {Object}   main_record
 * @param    {Function} callback
 */
BelongsTo.setMethod(function actionValue(actionType, record, callback) {

	var find_options,
	    assoc_id,
	    result,
	    model;

	// Get the associated ObjectId
	assoc_id = this.getRecordValue(record);

	// Prepare the result object
	result = {assoc_id: assoc_id};

	// If no id is set, nothing needs to be fetched anyway
	if (!assoc_id || (actionType != 'list' && actionType != 'peek')) {
		return setImmediate(function() {
			callback(null, result);
		});
	}

	model = this.getModel(this.fieldType.options.modelName);

	find_options = {
		fields: ['_id', 'title', 'name'].concat(model.displayField),
		conditions: {_id: assoc_id}
	};

	if (model.display_field_select) {
		find_options.fields = model.display_field_select.slice(0);
	}

	model.find('all', find_options, function gotData(err, results) {

		var response,
		    item;

		if (err) {
			return callback(err);
		}

		item = results[0];

		if (item) {
			response = item[model.displayField] || item.title || item.name || item._id;
		} else {
			response = '';
		}

		result.display_value = String(response);

		callback(null, result);
	});
});