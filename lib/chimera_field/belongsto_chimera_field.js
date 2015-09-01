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

	this.script_file = 'chimera/assoc_field';

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
BelongsTo.setMethod(function sendRelatedData(conduit, item, options) {

	var that = this,
	    fieldType = this.fieldType,
	    model = Model.get(fieldType.options.modelName),
	    find_options,
	    type;

	if (typeof options != 'object') {
		options = {};
	}

	find_options = {
		fields: ['_id', 'title', 'name'].concat(model.displayField),
		document: false
	};

	if (options.display_field_only) {
		find_options.conditions = {_id: Object.path(item, this.path)};
		type = 'list';
	} else {
		type = 'all';
	}

	if (!options.display_field_only) {
		find_options.debug = true;
		console.log('');
		console.log('>>> Finding related data!', find_options)
	}

	model.find(type, find_options, function gotData(err, results) {

		if (!options.display_field_only) {
			console.log('<<< Found related data', type, find_options, results);
			console.log('');
		}

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
				items: results,
				displayField: model.displayField
			};
		}

		conduit.end(response);
	});
});
