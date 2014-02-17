var async = alchemy.use('async');

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
		if ((!this.fieldConfig.origin && !this.blueprintEntry.blueprint)) {
			return callback();
		}

		// If the blueprint is inside the field configuration, use that
		if (this.blueprintEntry.blueprint) {
			instance = this.blueprintEntry;
		} else {

			// If there is no originaldata yet, this blueprint field won't be set
			if (!this.record) {
				return callback();
			}

			// Get all the available instances
			instances = this.model[this.fieldConfig.origin.pluralize()];

			// Get the instance name to get
			instanceName = this.record[this.fieldConfig.origin];

			instance = instances[instanceName];
		}

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

			var fields,
			    originalData,
			    tasks = [],
			    inputVal,
			    prepFnc,
			    saveFnc;

			// Try getting the originalData for this field only
			if (that.originalData) {
				originalData = that.originalData[that.fieldName];
			}

			inputVal = piece[that.fieldName];

			if (save) {

				saveFnc = function(value, index, next) {

					var fields = ME.getGroupFields(groups, piece),
					    original;

					if (typeof index == 'function') {
						next = index;
						index = false;
					}

					if (index !== false) {
						if (Array.isArray(originalData)) {
							original = originalData[index];
						}
					}

					ME.prepareSave(value, {
						module: module,
						model: instance,
						originalData: original || {},
						fields: fields
					}, function (err, newdata) {
						next(null, newdata);
					});
				};

				if (Array.isArray(inputVal)) {

					inputVal.filter(function(value, index) {
						
						tasks[tasks.length] = function(next_task) {
							saveFnc(value, next_task);
						};
					});

					async.parallel(tasks, function(err, results) {
						that.value = results;
						callback();
					});

				} else {
					saveFnc(inputVal, function(err, result) {
						that.value = result;
						callback();
					});
				}

			} else {

				// Create the function to prepare the field
				prepFnc = function(value, extraPath, next) {

					if (typeof extraPath == 'function') {
						next = extraPath;
						extraPath = false;
					}

					var groupsClone = alchemy.cloneSafe(groups),
					    fieldsClone = ME.getGroupFields(groupsClone, piece),
					    addToPath   = '[' + that.fieldName + ']';

					if (extraPath) {
						addToPath += extraPath;
					}

					ME.prepareFields({
						module: module,
						model: that.model,
						item: value,
						fields: fieldsClone,
						context: instance,
						addToPath: addToPath
					}, function afterPrepareFields() {

						that.fieldView = 'blueprint';

						next(null, {
							variables: {
								options: {
									groups: groupsClone,
									showSaveButton: false
								}
							}
						});
					});
				};

				// Make sure we have at least an empty object as original value
				if (typeof originalValue == 'undefined') {
					originalValue = {};
				}

				// Array-able blueprint fields need some tweaking
				if (that.fieldConfig.array) {
					if (!Array.isArray(originalValue)) {
						originalValue = [originalValue];
					}

					// Go over very value in the array
					originalValue.filter(function(value, index) {
						tasks[tasks.length] = function(next_task) {
							prepFnc(value, '[' + index + ']', next_task);
						};
					});

					async.parallel(tasks, function(err, results) {

						prepFnc({}, '[%INCREMENT%]', function(err, emptyResult) {
							that.value = results;
							that.emptyResult = emptyResult;
							
							callback();
						});
					});
				} else {
					// Prepare the value for a single, non-array field
					prepFnc(originalValue, function(err, result) {
						that.value = result;
						callback();
					});
				}
			}
		});

	};

});