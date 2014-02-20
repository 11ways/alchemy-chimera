/**
 * The Has One field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Select2MEF', function HasOneMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {},
		    record     = that.item[that.model.modelName];

		this.fieldView = 'select2';

		that.value = {
			select: 'single',
			value: that.value,
			url: that.module.getActionUrl('assocOptions', {
				model: that.model.modelName.underscore(),
				fieldName: that.fieldName
			})
		};

		callback();
	};

	/**
	 * Get the title value for the index view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(assoc.modelName),
		    conditions = {};

		if (!this.value) {
			return callback();
		}

		// Get the associated data
		assocModel.find('first', {conditions: {_id: this.value}, recursive: -1}, function(err, result) {
			
			var record,
				value = {};

			if (result.length) {
				record = result[0][assoc.modelName];

				if (record[assocModel.displayField]) {
					value.displayName = record[assocModel.displayField];
				}
				
				value._id = record['_id'];
				
				that.value = value;
				
			}

			callback();
		});
	};

});