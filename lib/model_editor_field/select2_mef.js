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

		
		if (body.q) {
			if (!options.conditions) {
				options.conditions = {};
			}

			options.conditions[assocModel.displayField] = RegExp(body.q, 'i');
		}

		// Find all the records of the associated model
		// @todo: we should only get the id & title fields
		assocModel.find('all', options, function (err, items) {

			var displayField = [],
			    mname = assocModel.name.modelName(),
			    list  = [],
			    display,
			    formatted,
			    temp,
			    item,
			    more,
			    i,
			    j;

			displayField = displayField.concat(assocModel.displayField);
			displayField = displayField.concat(['title', 'name', '_id']);

			for (i = 0; i < items.length; i++) {

				item = items[i][mname];
				formatted = false;

				for (j = 0; j < displayField.length; j++) {
					display = item[displayField[j]];
					if (display) {
						break;
					}
				}

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

});