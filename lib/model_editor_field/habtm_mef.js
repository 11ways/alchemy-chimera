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
		    modelName  = that.model.modelName.underscore(),
		    id;

		if (record) {
			id = record._id;
		}

		this.fieldView = 'select2';

		that.value = {
			select: 'multiple',
			value: that.value,
			modalUrl: that.module.getActionUrl('add', {model: this.fieldConfig.assoc.modelName}),
			url: that.module.getActionUrl('assocOptions', {
				model: modelName,
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
				this.value[i] = alchemy.castObjectId(this.value[i]);
			}
		}

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
		assocModel.find('all', {conditions: {_id: this.value}, recursive: -1}, function(err, result) {
			
			var record,
			    value = {},
			    i;
				
			value.hasMany = [];

			for (i = 0; i < result.length; i++) {
				record = result[i][assoc.modelName];

				if (record[assocModel.displayField]) {
					var recordInfo = {};
					recordInfo.displayName = assocModel.getDisplayTitle(record);
					recordInfo._id = record['_id'];
					value.hasMany.push(recordInfo);
				}
			}

			if (value) {
				that.value = value;
			}

			callback();
		});
	};

});