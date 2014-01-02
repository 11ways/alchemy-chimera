/**
 * The String field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function HasOneMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {};

		this.fieldView = 'select';

		// Find all the records of the associated model
		// @todo: we should only get the id & title fields
		assocModel.find('all', function (err, items) {

			var displayField = [],
			    mname = assocModel.name.modelName(),
			    list  = [],
			    display,
			    item,
			    i,
			    j;

			displayField = displayField.concat(assocModel.displayField);
			displayField = displayField.concat(['title', 'name', '_id']);

			for (i = 0; i < items.length; i++) {

				item = items[i][mname];

				for (j = 0; j < displayField.length; j++) {
					display = item[displayField[j]];
					if (display) {
						break;
					}
				}

				list.push({id: item._id, title: display});
			}

			that.value = {
				value: that.value,
				options: list
			};

			callback();
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
		if (this.value == '') {
			this.value = undefined;
		}

		callback();
	};

});