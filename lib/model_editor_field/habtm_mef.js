/**
 * The Habtm field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Select2MEF', function HabtmMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {},
		    record     = that.item[that.model.modelName],
		    id;

		if (record) {
			id = record._id;
		}

		this.fieldView = 'select2';

		that.value = {
			select: 'multiple',
			value: that.value,
			url: that.module.getActionUrl('assocOptions', {
				model: that.model.modelName.underscore(),
				id: id,
				fieldName: that.fieldName
			})
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

		var i;

		// Treat empty strings as undefined
		if (this.value == '') {
			this.value = undefined;
		} else {
			if (!Array.isArray(this.value)) {
				this.value = this.value.split(',');
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