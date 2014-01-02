/**
 * The Habtm field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function HabtmMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {};

		this.fieldView = 'listbox';

		// Find all the records of the associated model
		// @todo: we should only get the id & title fields
		assocModel.find('all', function (err, items) {

			var list = [],
			    mname = assocModel.name.modelName(),
			    displayField = [],
			    item,
			    display,
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
				selected: that.value,
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

		var i;

		// Treat empty strings as undefined
		if (this.value == '') {
			this.value = undefined;
		} else {
			if (!Array.isArray(this.value)) {
				this.value = [this.value];
			}
		
			// Remove the default empty value
			this.value = this.value.filter(function(entry) {
				return entry != '_empty_';
			});

			// Cast all the values to objectid
			for (i = 0; i < this.value.length; i++) {
				this.value[i] = alchemy._mongoose.mongo.BSONPure.ObjectID(this.value[i]);
			}
		}

		callback();
	};

});