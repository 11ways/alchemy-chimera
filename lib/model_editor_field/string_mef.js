/**
 * The String field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function StringMEF() {

	this.input = function input(callback) {

		var that       = this,
		    conditions = {},
		    record     = that.item[that.model.modelName];

		if (this.fieldConfig.autocomplete) {

			// Autocomplete fields use select2
			this.fieldView = 'select2';

			this.value = {
				string: true,
				select: 'single',
				value: this.value,
				url: this.module.getActionUrl('assocOptions', {
					model: this.model.modelName.underscore(),
					fieldName: this.fieldName
				})
			};
		}
		
		callback();
	};

	/**
	 * Options for dropdown fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	this.options = function options(callback) {

		var body = this.render.req.body,
		    that = this,
		    conditions = {},
		    list = [],
		    exists;

		if (body.q) {
			// Create the regex condition
			conditions[this.fieldName] = new RegExp('.*?' + String(body.q).diacriticPattern(true) + '.*?', 'i');

			// Add the query to the result, as it could be a new entry
			list.push({id: body.q, text: body.q, formatted: body.q});
		}

		// Make sure the field exists and is not an empty string
		exists = {};
		exists[this.fieldName] = {$exists: true, $nin: ['']};
		exists = {$match: exists};

		// @todo: integrate aggregation into DbQuery
		this.model.getCollection(function(err, collection) {

			collection.aggregate(
				// Apply the query to the field
				{$match: conditions},
				// Only existing, non empty fields
				exists,
				{$group: {_id: "$" + that.fieldName, totalUse: {$sum: 1}}},
				{$project: {lower: {$toLower: ["$_id"]}}},
				{$sort: {lower: 1}}, function(err, summary) {

					summary.forEach(function(entry) {
						list.push({id: entry._id, text: entry._id, formatted: entry._id});
					});

				// @todo: add pagination
				callback({results: list, available: summary.length, more: false});
			});
		});
	};

});