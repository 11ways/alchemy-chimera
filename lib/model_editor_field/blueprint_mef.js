/**
 * The Blueprint field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function BlueprintMEF() {

	this.input = function input(callback) {
		this.doField(callback);
	};


	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {
		this.doField(callback, true);
	};

	this.doField = function doField(callback, save) {

		var ME,
		    module,
		    instance,
		    instances,
		    instanceName,
		    originalValue = this.value,
		    that = this,
		    tasks = [],
		    piece;

		// Use the default view in case we don't find any valid settings
		this.fieldView = 'default';

		// Don't do anything if no valid origin instance name was given
		if (!this.fieldConfig.origin || !this.record || !this.record[this.fieldConfig.origin]) {
			return callback();
		}

		// Get all the available instances
		instances = this.model[this.fieldConfig.origin.pluralize()];

		// Get the instance name to get
		instanceName = this.record[this.fieldConfig.origin];

		instance = instances[instanceName];

		if (!instance) {
			return callback();
		}

		// Augment the instance
		instance = alchemy.augment(instance, this.__augment__);

		// Get the Model Editor view
		ME = this.module.getView('ModelEditor');

		module = this.module.getModule('ModelEditor');

		// If we're saving the data ...
		if (save) {

			// Construct a new object
			piece = {};

			// Store the blueprint values under the fieldname
			piece[this.fieldName] = this.value;
		} else {
			piece = this.record;
		}

		ME.getModelGroups(instance, piece, function(groups) {
			var fields;

			fields = ME.getGroupFields(groups, piece);

			if (save) {
				ME.prepareSave(piece[that.fieldName], {
					module: module,
					model: instance,
					originalData: that.originalData[that.fieldName] || {},
					fields: fields
				}, function (err, newdata) {
					that.value = newdata;
					callback();
				});
			} else {

				ME.prepareFields({
					module: module,
					model: that.model,
					item: originalValue,
					fields: fields,
					context: instance,
					addToPath: '[' + that.fieldName + ']'
				}, function afterPrepareFields() {

					that.fieldView = 'blueprint';

					that.value = {
						variables: {
							options: {
								groups: groups,
								showSaveButton: false
							},
						}
					};

					callback();
				});
			}
		});

	};

});