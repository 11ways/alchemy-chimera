/**
 * The Enum field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function EnumMEF() {

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

		if (context) {
			values = context[this.fieldName.pluralize()];

			if (values) {
				for (name in values) {
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

		this.value = {
			value: value,
			options: list
		};

		callback();
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
		if (this.value == '') {
			this.value = undefined;
		}

		callback();
	};

});