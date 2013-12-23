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
		    assoc      = this.field.assoc,
		    assocModel = this.getModel(this.field.assoc.modelName),
		    conditions = {};

		this.fieldView = 'select';

		// Find all the records of the associated model
		// @todo: we should only get the id & title fields
		assocModel.find('all', function (err, items) {

			var list = [],
			    mname = assocModel.name.modelName(),
			    item,
			    display,
			    i;

			for (i = 0; i < items.length; i++) {

				item = items[i][mname];

				if (item.title) {
					display = item.title;
				} else if (item.name) {
					display = item.name;
				} else {
					display = item._id;
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

});