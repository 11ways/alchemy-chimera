var async = alchemy.use('async');

/**
 * The Blueprint field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function BlueprintMEF() {

	/**
	 * Prepare field information for input
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.input = function input(callback) {

		// If the instance wasn't found, do nothing
		if (!this.instance) {
			return callback();
		}

		var that     = this,
		    ME       = this.ModelEditor,
		    module   = this.MEmodule,
		    piece    = this.piece,
		    instance = this.instance,
		    originalValue = this.value,
		    originalData,
		    inputVal;

		ME.getModelGroups(instance, piece, function(err, groups) {

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

				if (that.nestedPath) {
					addToPath = that.nestedPath + addToPath;
				}

				ME.prepareFields({
					nestedBlueprint: true,
					nestedPath: addToPath,
					module: module,
					model: that.model,
					item: value,
					fields: fieldsClone,
					context: instance,
					addToPath: addToPath
				}, function afterPrepareFields(instances, basePath) {

					that.fieldView = 'blueprint';

					next(null, {
						variables: {
							options: {
								groups: groupsClone,
								showSaveButton: false,
								basePath: basePath,
								id: value._id
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

		// If the instance wasn't found (the object containing the blueprint)
		// do nothing
		if (!this.instance) {
			return callback();
		}

		var that     = this,
		    ME       = this.ModelEditor,
		    module   = this.MEmodule,
		    piece    = this.piece,
		    instance = this.instance,
		    inputVal = this.value,
		    originalData;

		ME.getModelGroups(instance, piece, function(err, groups) {

			var fields,
			    originalData,
			    tasks = [],
			    saveFnc,
			    isArray = Array.isArray(inputVal);

			// Try getting the originalData for this field only
			if (that.originalData) {
				originalData = that.originalData[that.fieldName];
			}

			saveFnc = function(value, index, next) {

				var fields = ME.getGroupFields(groups, piece),
				    original;

				if (typeof index == 'function') {
					next = index;
					index = false;
				}

				if (isArray) {
					if (Array.isArray(originalData)) {

						// If the value has an id specified, try getting the original based on that id
						if (value._id) {
							original = alchemy.queryArray({_id: String(value._id)}, originalData);
						}
					}
				}

				ME.prepareSave(value, {
					// module: module,
					// model: instance,
					// originalData: original || {},
					// fields: fields
					originalData: original || {},
					nestedBlueprint: true,
					module: module,
					model: that.model,
					item: value,
					fields: fields,
					context: instance
				}, function (err, newdata) {

					// If the given value has an _id entry, save it even though
					// it's not inside the blueprint
					if (value._id) {
						newdata._id = value._id;
					}

					next(null, newdata);
				});
			};

			if (isArray) {

				inputVal.filter(function(value, index) {

					// Array items should always get their own _id
					// If there is an _id entry, and it's a valid object id string,
					// turn it into an object id
					if (value._id && String(value._id).isObjectId()) {
						value._id = alchemy.ObjectId(value._id);
					} else {
						value._id = alchemy.ObjectId();
					}
					
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
		});
	};

	/**
	 * Prepare field information for input or saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareInfo = function prepareInfo(options, callback) {

		var that = this;

		this.parent('prepareInfo', null, options, function() {

			var instance,
			    piece;

			// Use the default view in case we don't find any valid settings
			that.fieldView = 'default';

			// Don't do anything if no valid origin instance name was given
			if ((!that.fieldConfig.origin && !that.blueprintEntry.blueprint)) {
				return callback();
			}

			// If the blueprint is inside the field configuration, use that
			if (that.blueprintEntry.blueprint) {
				instance = that.blueprintEntry;
			} else {

				// @todo: the quality of this code is quite bad.
				// A blueprint field inside a blueprint field should work,
				// but a blueprint field inside a blueprint field inside a 
				// blueprint field probably won't.
				// The recursiveness of the settings should be checked

				// Set the current record as the top record
				that.topRecord = that.record;

				// If originalData has been given as an option, this is probably
				// a nested blueprint field
				if (options.originalData && options.originalData[that.fieldName]) {

					// The record this blueprint field is in
					that.topRecord = options.originalData;

					that.record = options.originalData[that.fieldName];
					that.originalData = that.record;
				}

				// If there is no originaldata yet, this blueprint field won't be set
				if (!that.record) {
					return callback();
				}

				// Get all the available instances,
				// instances are objects containing the blueprint property to use
				instances = that.model[that.fieldConfig.origin.pluralize()];

				// Get the instance name to get
				instanceName = that.topRecord[that.fieldConfig.origin];

				instance = instances[instanceName];
			}

			if (!instance) {
				return callback();
			}

			// Augment the instance
			instance = alchemy.augment(instance, that.__augment__);

			// Store the instance here
			that.instance = instance;

			if (that.module) {
				that.ModelEditor = that.module.getView('ModelEditor');
				that.MEmodule = that.module.getModule('ModelEditor');
			}

			if (that._saving) {
				piece = {};
				piece[that.fieldName] = that.value;
			} else {
				piece = that.record;
			}

			that.piece = piece;
			that.pieceValue = piece[that.fieldName];

			callback();
		});
	};
});