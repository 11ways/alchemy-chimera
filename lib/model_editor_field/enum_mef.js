/**
 * The Enum field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Select2MEF', function EnumMEF() {

	/**
	 * Get the list options (for selects)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}     value     A specific value to search on, optional
	 * @param    {Function}   callback
	 */
	this.options = function options(value, callback) {

		var query,
		    list,
		    body = this.render.req.body || {},
		    r;

		query = body.q;
		if (query) {
			r = query.diacriticRegex(true);
		}

		if (typeof value == 'function') {
			callback = value;
			value = null;
		}

		list = this.getValues();

		list = list.filter(function eachEntry(entry, index) {

			entry.text = entry.title || entry.id;

			if (query && entry.text.search(r) == -1) {
				return false;
			}

			return true;
		});

		callback({results: list, available: list.length, more: false});
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
		    stopwords = ['van', 'de'];

		switch (condition) {

			case 'isempty':
				result = {$in: [{$exists: false}, '', {$size: 0}]};
				break;

			case 'isnotempty':
				result = {$exists: true, $ne: ''};
				break;

			case 'notlike':
			case 'like':
			default:
				result = value;
		}

		callback(result);
	};

	/**
	 * Get the values
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {String}   value   Existing value
	 *
	 * @return   {Array}
	 */
	this.getValues = function getValues(value) {

		var context = this.context || this.model,
		    values,
		    found,
		    entry,
		    list,
		    name;

		if (!context) {
			return [];
		}

		found = false;
		list = [];

		if (context) {
			values = context[this.fieldName.pluralize()];

			if (values) {
				for (name in values) {

					if (name == value) {
						found = true;
					}

					entry = values[name];

					// Use the name as the id
					temp = {id: name};

					if (entry.title) {
						temp.title = entry.title;
					} else if (entry.name) {
						temp.title = entry.name;
					} else if (entry.toString) {
						temp.title = entry.toString();
					} else {
						temp.title = name;
					}

					// Add this value to the list
					list.push(temp);
				}
			}
		}

		if (!found && value) {
			list.push({id: value, title: 'Illegal value: ' + value.toLowerCase()});
		}

		return list;
	};

	this.input = function input(callback) {

		var that  = this,
		    value = this.value,
		    list  = [],
		    context,
		    values,
		    entry,
		    temp,
		    name;

		this.fieldView = 'select';

		context = this.model;

		if (this.context) {
			context = this.context;
		}

		list = this.getValues(value);

		this.value = {
			value: value,
			options: list
		};

		if (this.blueprintEntry.unique && context.find) {

			context.find('all', {fields: [this.fieldKey]}, function(err, results) {

				var exists = {},
				    i;

				// Get all the used values
				for (i = 0; i < results.length; i++) {
					exists[results[i][context.modelName][that.fieldKey]] = true;
				}

				// And remove them from the list
				for (i = 0; i < list.length; i++) {

					// Don't remove the current value, though
					if (exists[list[i].id] && list[i].id !== value) {
						list.splice(i, 1);
						i--;
					}
				}

				callback();
			});
		} else {
			callback();
		}
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