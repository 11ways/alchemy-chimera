/**
 * The Has Many field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.1.0
 * @version  0.1.0
 */
alchemy.create('Select2MEF', function HasManyMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {},
		    record     = that.item[that.model.modelName],
		    modelName  = that.model.modelName.underscore();

		this.fieldView = 'has_many';

		console.log(this);
		this.title = 'rr';

		that.value = {
			select: 'single',
			value: that.value,
			modalUrl: that.module.getActionUrl('add', {model: this.fieldConfig.assoc.modelName}),
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

				value.displayName = assocModel.getDisplayTitle(record);
				
				value._id = record['_id'];
				
				that.value = value;
				
			}

			callback();
		});
	};

});