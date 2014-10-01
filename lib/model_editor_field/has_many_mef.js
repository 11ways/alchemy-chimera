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
		    modelName  = that.model.modelName.underscore(),
		    i;

		this.fieldView = 'has_many';

		for (i = 0; i < that.value.length; i++) {
			that.value[i].modalUrl = that.module.getActionUrl('edit', {model: this.fieldConfig.assoc.modelName, id: that.value[i]._id});
		}

		that.value = {
			select: 'single',
			value: that.value,
			modalUrl: that.module.getActionUrl('add', {model: this.fieldConfig.assoc.modelName})
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
		    conditions = {},
		    id;

		id = alchemy.castObjectId(this.value);

		if (!id) {
			return callback();
		}

		// Get the associated data
		assocModel.find('first', {conditions: {_id: id}, recursive: -1}, function(err, result) {
			
			var record,
				value = {};

			if (result.length) {
				record = result[0][assoc.modelName];

				value.displayName = assocModel.getDisplayTitle(record);
				
				if(typeof value.displayName === 'object'){
					if(record.name){
						value.displayName = record.name;
					}
				}
				
				value._id = record['_id'];
				
				that.value = value;
			}

			callback();
		});
	};

});