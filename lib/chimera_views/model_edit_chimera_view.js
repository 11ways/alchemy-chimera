var async = alchemy.use('async');

/**
 * The basic index page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function ModelEditorChimeraView() {

	/**
	 * Get the model and set certain view variables
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareModel = function prepareModel(render, module, options) {

		var model;

		// Get the model instance
		if (typeof options.model === 'object') {
			model = options.model;
		} else if (typeof options.model === 'string') {
			model = this.getModel(options.model);
		} else {
			model = this.getModel(render.req.params.model);
		}

		// Make sure the translation behaviour gets disabled
		model.disableTranslations = true;

		// Add the model name to the routeVars
		render.viewVars.routeVars.model = model.modelName.underscore();
		render.viewVars.modelName = model.modelName;

		render.viewVars.showActions = ['paginate', 'record'];

		return model;
	};

	/**
	 * Build the edit view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.add = function add(render, module, options) {

		var that       = this,
		    urlParams  = render.req.route.params,
		    fields,
		    groups,
		    model;

		if (typeof options !== 'object') {
			options = {};
		}

		// Get the model
		model = this.prepareModel(render, module, options);

		// Set the view file
		render.view = 'chimera/model_edit';
		render.viewVars.saveButton = __('chimera', 'Add record');
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);
		render.viewVars.editTitle = __('chimera', 'Add record');

		// Get a (cloned) groups object
		groups = this.getModelGroups(model);

		// Prepare the fields object
		fields = this.getGroupFields(groups);

		if (render.get) {

			render.viewVars.__groups = groups;
			render.viewVars.__current__ = null;
			render.viewVars.item = null;
			render.viewVars.originalItem = null;
			render.viewVars.blueprint = model.blueprint;

			this.prepareFields(module, model, null, fields, function afterPrepareFields() {
				render();
			});
		} else {

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data,
			    fieldType,
			    fieldName,
			    item;

			modelData = modelData[model.modelName];

			// Clean up the data
			for (fieldName in modelData) {

				// Get this fieldType
				fieldType = model.fieldType(fieldName);

				// Remove empty string fields if the field type is not a string
				// This is because an empty input field is always interpreted as a string
				// All other faults deserve to get an error thrown
				if (fieldType !== 'string') {

					if (modelData[fieldName] === '') {
						delete modelData[fieldName];
						continue;
					}

					// Convert date strings back to a real date
					if (fieldType === 'date') {
						modelData[fieldName] = new Date(modelData[fieldName]);
					}
				}
			}

			item = modelData;
			modelData = {};
			modelData[model.modelName] = item;

			// Save the data. Allow any data through the json edit
			model.save(modelData, function(err, result) {

				var url,
				    params;

				params = alchemy.objectify(urlParams);
				params.id = result[0].item._id;

				pr(params, true);

				if (err) {
					// @todo: Redirect to an error
					log.error(err);
				} else {

					url = module.getActionUrl('edit', params);
					render.redirect(url);
				}

			});

		}

	};

	/**
	 * Build the edit view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.edit = function edit(render, module, options) {

		var that       = this,
		    conditions = {},
		    urlParams  = render.req.route.params,
		    groupName,
		    fieldName,
		    fields,
		    groups,
		    model,
		    group,
		    field,
		    temp,
		    i;

		if (typeof options !== 'object') {
			options = {};
		}

		// Get the model
		model = this.prepareModel(render, module, options);

		// Set the view file
		render.view = 'chimera/model_edit';
		
		render.viewVars.saveButton = __('chimera', 'Save record');
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);

		if (options.onlyView) {
			render.viewVars.showSaveButton = false;
			render.viewVars.editTitle = __('chimera', 'View record');
		} else {
			render.viewVars.editTitle = __('chimera', 'Edit record');
		}

		// Get a (cloned) groups object
		groups = this.getModelGroups(model);

		// Extract all the fields by reference
		fields = this.getGroupFields(groups);

		conditions['_id'] = render.req.params.id;

		// Handle GET requests
		// Also use this when onlyView is enabled (it allows no post requests);
		if (render.get || options.onlyView) {
			
			// Get the record we want to edit
			model.find('first', {conditions: conditions}, function (err, item) {

				var original   = model.name.modelName(),
				    editItem   = [],
				    fieldName,
				    editor;
				
				render.viewVars.__groups = groups;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.originalItem = item;
				render.viewVars.blueprint = model.blueprint;
				render.viewVars.routeVars.id = item[original]._id;

				that.prepareFields(module, model, item, fields, function afterPrepareFields() {
					render();
				});
			});
		} else if (render.post) {

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data,
			    fieldType,
			    fieldName;

			// Get the original record
			model.find('first', {conditions: conditions}, function(err, item) {

				item = item[model.modelName];
				modelData = modelData[model.modelName];

				// Clean up the data
				for (fieldName in modelData) {

					// Get this fieldType
					fieldType = model.fieldType(fieldName);

					// Remove empty string fields if the field type is not a string
					// This is because an empty input field is always interpreted as a string
					// All other faults deserve to get an error thrown
					if (fieldType !== 'string') {

						if (modelData[fieldName] === '') {
							delete modelData[fieldName];
							continue;
						}

						// Convert date strings back to a real date
						if (fieldType === 'date') {
							modelData[fieldName] = new Date(modelData[fieldName]);
						}
					}
				}

				// Merge the data (a recursive inject)
				alchemy.merge(item, modelData);

				modelData = {};
				modelData[model.modelName] = item;

				// Save the data. Allow any data through the json edit
				model.save(modelData, function(err, result) {

					var url;

					if (err) {
						// @todo: Redirect to an error
						log.error(err);
					} else {

						url = module.getActionUrl('edit', urlParams);
						render.redirect(url);
					}

				});
			});
		}
	};

	/**
	 * Extract all the fields from the groups
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   groups
	 */
	this.getGroupFields = function getGroupFields(groups) {

		var fields = {},
		    tempName;

		// Extract all the fields
		for (groupName in groups) {
			group = groups[groupName];

			for (i = 0; i < group.fields.length; i++) {
				field = group.fields[i];

				tempName = field.field;

				if (field.path) {
					tempName += '__path-' + field.path;
				}

				fields[tempName] = field;
			}
		}

		return fields;
	};

	/**
	 * Prepare all the given fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareFields = function prepareFields(module, model, item, fields, callback) {

		var fieldName,
		    fieldKey,
		    tasks;

		// Async tasks go here
		tasks = {};

		for (fieldKey in fields) {

			// Queue this function
			(function(fieldKey){
				var Field = module.getField(fields[fieldKey].type);

				tasks[fieldKey] = function asyncWaiter(async_callback) {

					// Call the prepareInput method of the field
					Field.prepareInput({
						model: model,
						item: item,
						fieldConfig: fields[fieldKey],
						fieldKey: fieldKey,
						fieldName: fields[fieldKey].name}, function afterInput(temp) {

							// Inject the result into the field
							alchemy.inject(fields[fieldKey], temp);

							// Make sure the value is present if not defined
							if (typeof fields[fieldKey].value === 'undefined') {
								fields[fieldKey].value = null;
							}

						async_callback();
					});
				};
			}(fieldKey));
		}

		// Execute all the tasks in parallel and call the callback when done
		async.parallel(tasks, function asyncDone(err) {
			callback();
		});
	};

	/**
	 * Get all the editor groups of this model and its field data
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}   model
	 */
	this.getModelGroups = function getModelGroups(model) {

		var translationFields,
		    translationGroups,
		    tempFields,
		    fieldName,
		    assoc,
		    alias,
		    field,
		    temp;

		// Get the data types
		if (!model._modelEditorGroups) {
			model._modelEditorGroups = {};

			// If the model has no specific settings for the Model Edit module
			if (!model.modelEdit) {

				tempFields = [];
				translationFields = [];

				for (fieldName in model.blueprint) {

					// Get the current field
					field = model.blueprint[fieldName];

					// Create a temporary object
					temp = {};

					// Store the fieldname
					temp.field = fieldName;

					// Store the original datatype
					temp.dataType = field.type;

					// If a fieldType has been defined, use it
					if (field.fieldType) {
						temp.type = field.fieldType;
					} else {

						// See if this is an associated item
						for (alias in model.hasOneParent) {
							assoc = model.hasOneParent[alias];

							if (assoc.foreignKey == fieldName) {
								temp.type = 'hasOne';
								temp.assoc = alchemy.cloneSafe(assoc);
							}
						}

						for (alias in model.belongsTo) {
							assoc = model.belongsTo[alias];

							if (assoc.foreignKey == fieldName) {
								temp.type = 'hasOne';
								temp.assoc = alchemy.cloneSafe(assoc);
							}
						}

						if (!temp.type) {
							temp.type = field.type;
						}
					}

					temp.title = fieldName.humanize();
					temp.name = fieldName;

					// Store the new data in the object
					if (field.translatable) {
						translationFields.push(temp);
					} else {
						tempFields.push(temp);
					}
				}

				// Add the general fields
				model._modelEditorGroups = {
					general: {
						title: __('chimera', 'General'),
						fields: tempFields
					}
				};

				// Add translatable groups
				translationGroups = this.convertTranslationGroup(translationFields);
				this.finalizeGroups(translationGroups, model.blueprint, model._modelEditorGroups);

			} else {

				// Convert the user given configuration to something useable
				model._modelEditorGroups = this.convertSettings(model.modelEdit, model.blueprint);
			}
		}

		return alchemy.cloneSafe(model._modelEditorGroups);
	};

	/**
	 * Convert a translation group blueprint into multiple prefix groups
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   fields        The fields to use for the translations
	 * @param    {Object}   resultGroups  The object to to put the results in
	 *
	 * @return   {Object}                 The resultGroups object
	 */
	this.convertTranslationGroup = function convertTranslationGroup(fields, resultGroups) {

		var tempFields,
		    prefixName,
		    prefixes,
		    prefix,
		    i;

		// If no resultGroups are given, create a new object
		if (!resultGroups) {
			resultGroups = {};
		}

		// Do nothing if no valid fields were given
		if (!fields || !fields.length) {
			return resultGroups;
		}

		// Get all the set prefixes.
		// Only those will be shown to the user, even if there are other
		// set in the data
		prefixes = Prefix.all();

		for (prefixName in prefixes) {

			// Create an alias to the current prefix
			prefix = prefixes[prefixName];

			// Clone the fields array (for every prefix)
			tempFields = alchemy.cloneSafe(fields);

			// Go over every translatable field in the new clone
			// and add the prefix info
			for (i = 0; i < tempFields.length; i++) {
				tempFields[i].path = prefixName;
			}

			// Turn this prefix into a group
			resultGroups[prefixName] = {
				title: __('languages', prefix.title),
				group: {
					title: prefix.title,
					fields: tempFields
				}
			};
		}

		return resultGroups;
	};

	/**
	 * Convert Model Editor group settings
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   groups      The Model Editor configuration
	 * @param    {Object}   blueprint   The optional blueprint for the fields
	 *
	 * @return   {Object}               Converted configuration
	 */
	this.convertSettings = function convertSettings(groups, blueprint) {

		var tempGroups,
		    groupName,
		    result;

		if (!blueprint) {
			blueprint = {};
		}

		tempGroups = {};

		// Process every user defined group
		for (groupName in groups) {

			// Groups with the name 'translations' should be handled differently
			if (groupName === 'translations') {

				this.convertTranslationGroup(groups.translations.fields, tempGroups);

			} else {

				// It's not the translations group,
				// so we don't need to do anything special
				tempGroups[groupName] = {
					group: groups[groupName]
				};

				tempGroups[groupName].title = tempGroups[groupName].group.title;
			}
		}

		result = this.finalizeGroups(tempGroups, blueprint);

		return result;
	};

	/**
	 * Finalize group settings
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   groups      The groups object
	 * @param    {Object}   blueprint   The optional blueprint for the fields
	 * @param    {Object}   result      The result object to modify by reference
	 *
	 * @return   {Object}               The result
	 */
	this.finalizeGroups = function finalizeGroups(groups, blueprint, result) {

		var groupName,
		    group,
		    field,
		    temp,
		    i;

		if (!result) {
			result = {};
		}

		for (groupName in groups) {

			group = groups[groupName].group;

			tempGroup = {};
			tempGroup.title = groups[groupName].title;
			tempGroup.fields = [];

			for (i = 0; i < group.fields.length; i++) {

				entry = group.fields[i];
				field = blueprint[entry.field];

				// Clone the entry into a new object
				temp = alchemy.inject({}, entry);

				// If no type is given, get it from the field
				if (!temp.type) {
					if (field && field.type) {
						temp.type = field.type;
					}
				}

				// If not title is given, use the fieldname
				if (!temp.title) {
					temp.title = temp.field.humanize();
				}

				// Make sure the path is valid or false
				temp.path = temp.path || false;
				temp.name = temp.field;

				if (field && field.type) {
					temp.dataType = field.type;
				}

				// Add this field to this group's fields
				tempGroup.fields.push(temp);
			}

			// Store this group in the model
			result[groupName] = tempGroup;
		}

		return result;
	};

});