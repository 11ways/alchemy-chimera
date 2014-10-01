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
		    record     = that.item[that.model.modelName],
		    modelName  = that.model.modelName.underscore();

		this.fieldView = 'select2';

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
	 * Get the value for the excel export
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.export = function exprt(callback) {

		var that = this;

		this.index(function() {

			if (that.value && that.value.displayName) {
				that.value = String(that.value.displayName).stripTags();
			} else {
				that.value = '';
			}

			callback();
		});
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
		    id,
		    assoc,
		    options,
		    assocModel,
		    conditions = {};

		if (this.fieldConfig.assoc) {
			assoc = this.fieldConfig.assoc;
		} else {
			assoc = this.model.foreignKeys[this.fieldKey];
		}

		assocModel = this.getModel(assoc.modelName);

		if (!this.value) {
			return callback();
		}

		id = alchemy.castObjectId(this.value);

		options = {conditions: {_id: id}, recursive: -1};

		// Get the associated data
		assocModel.find('first', options, function(err, result) {

			var record,
				value = {};

			if (result.length) {
				record = result[0][assoc.modelName];

				if (options.debug) {
					pr(record, true);
				}

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

	/**
	 * Cast the string value to an objectid
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.save = function save(callback) {
		if (typeof this.value === 'string' && this.value.isObjectId()) {
			this.value = alchemy.castObjectId(this.value);
		}

		callback();
	};

});