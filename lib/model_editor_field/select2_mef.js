/**
 * The basis for Select 2 field types
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function Select2MEF() {

	/**
	 * Get the list options (for selects)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}     value     A specific value to search on, optional
	 * @param    {Function}   callback
	 */
	this.options = function options(value, callback) {

		var body = this.render.req.body,
		    get  = this.render.req.query,
		    conditionFields,
		    orconditions,
		    condition,
		    i;

		if (typeof value == 'function') {
			callback = value;
			value = null;
		}

		var assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    options    = {};

		if (value) {
			options.conditions = {_id: value};
		} else {
			if (body.id) {
				options.conditions = {_id: body.id};
			}
		}

		if (options.conditions && Array.isArray(options.conditions._id)) {
			for (i = 0; i < options.conditions._id.length; i++) {
				if (String(options.conditions._id[i]).isObjectId()) {
					options.conditions._id[i] = alchemy._mongoose.mongo.BSONPure.ObjectID(options.conditions._id[i]);
				}
			}
		}

		// Set the page size to 10 by default
		if (!body.page_limit) {
			body.page_limit = 10;
		}

		// Set the page to 1 by default
		if (!body.page) {
			body.page = 1;
		}

		// offset limit
		options.limit = body.page_limit;
		options.offset = (body.page-1) * body.page_limit;

		// Init requests should not be limited
		if (body.init) {
			delete options.limit;
			delete options.offset;
		}
		
		if (body.q) {

			if (!options.conditions) {
				options.conditions = {};
			}

			// Create the regex condition
			condition = new RegExp('.*?' + String(body.q).diacriticPattern(true) + '.*?', 'i');

			// Get an array of fields to filter on
			conditionFields = Array.cast(assocModel.filterField || assocModel.displayField);

			// If multiple fields have been given, look in all of them
			if (conditionFields.length > 1) {

				orconditions = {};

				conditionFields.forEach(function(fieldname) {
					orconditions[fieldname] = condition;
				});

				options.conditions['$or'] = orconditions;
			} else {
				options.conditions[conditionFields[0]] = condition;
			}
		}

		// Find all the records of the associated model
		// @todo: we should only get the id & title fields
		assocModel.find('all', options, function (err, items) {

			var displayField = [],
			    mname = assocModel.name.modelName(),
			    list  = [],
			    display,
			    fallbacks,
			    formatted,
			    temp,
			    item,
			    more,
			    i,
			    j;

			// Fallback fields to use as displayfield
			fallbacks = ['title', 'name', '_id'];

			for (i = 0; i < items.length; i++) {

				item = items[i][mname];
				formatted = false;

				display = assocModel.getDisplayTitle(item, fallbacks);

				if (assocModel.formatResult) {
					formatted = assocModel.formatResult(item, items[i]);
				}

				list.push({id: item._id, text: display, formatted: formatted});
			}

			// If an array of ids has been given as a condition,
			// make sure we return the values in the same order!
			if (Array.isArray(body.id)) {
				temp = [];

				for (i = 0; i < body.id.length; i++) {
					for (j = 0; j < list.length; j++) {
						if ((''+list[j].id) == body.id[i]) {
							temp.push(list[j]);
							break;
						}
					}
				}

				list = temp;
			}

			// See if there are more items available
			more = (body.page * body.page_limit) < items.available;
			callback({results: list, available: items.available, more: more});
		});
	};

	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {

		// Treat empty strings as undefined
		if (this.value === '') {
			this.value = undefined;
		}

		callback();
	};

	/**
	 * Prepare the filter input field
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function} callback    The function to pass the new result to
	 */
	this.filterInput = function filterInput(callback) {
		this.filterFieldName = 'select2';
		callback();
	};

	/**
	 * The filter method to convert a user input value into a good condition
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   condition   What type of condition it is (like, is, notlike, isnot)
	 * @param    {String}   value       The value to check agains
	 * @param    {Function} callback    The function to pass the new result to
	 */
	this.filter = function filter(condition, value, callback) {

		var result,
		    that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(assoc.modelName),
		    conditions = {},
		    conditionFields,
		    tempCondition = [];

		if (typeof value == 'string') {
			value = value.split(',');
		}

		// Get all the names of the fields to filter on
		conditionFields = Array.cast(assocModel.filterField || assocModel.displayField);

		// Go over every given conditional value
		value.forEach(function(val) {

			var tempValue;

			// If the given value is an objectId, look for it in _id
			if (String(val).isObjectId) {
				tempValue = alchemy.castObjectId(val);

				if (!conditions._id) {
					conditions._id = [];
				}

				conditions._id.push(tempValue);
				return;
			}

			switch (condition) {

				case 'notlike':
				case 'like':
					tempValue = this.anyWord(value);
					break;

				default:
					tempValue = new RegExp(String(value).diacriticPattern());
			}

			// If multiple fields have been given, look in all of them
			if (conditionFields.length > 1) {

				var orconditions = {};

				conditionFields.filter(function(fieldname) {
					orconditions[fieldname] = tempValue;
				});

				conditions['$or'] = orconditions;
			} else {
				conditions[conditionFields[0]] = tempValue;
			}

		});

		// Look up the ids in the associated model
		assocModel.find('all', {conditions: conditions}, function(err, results) {
			
			var ids = [],
			    item,
			    i;

			if (results.length) {
				for (i = 0; i < results.length; i++) {
					item = results[i][assocModel.modelName];
					
					// @todo: remove the string representation of the id,
					// it should work fine without it
					ids.push(String(item._id));

					// Add the objectId
					ids.push(alchemy.castObjectId(item._id));
				}

				result = ids;
			} else {
				result = 'notpossible!';
			}

			callback(result);
		});
	};

});