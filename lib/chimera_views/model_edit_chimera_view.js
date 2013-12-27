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

		// Prepare the fields object
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

		var tempFields,
		    prefixName,
		    tempGroups,
		    tempGroup,
		    fieldName,
		    groupName,
		    tempName,
		    prefixes,
		    tempObj,
		    prefix,
		    assoc,
		    alias,
		    entry,
		    group,
		    field,
		    temp,
		    i,
		    j;

		// Get the data types
		if (!model._modelEditorGroups) {
			model._modelEditorGroups = {};

			// If the model has no specific settings for the Model Edit module
			if (!model.modelEdit) {

				tempFields = [];

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
					tempFields.push(temp);
				}

				model._modelEditorGroups = {
					general: {
						title: __('chimera', 'General'),
						fields: tempFields
					}
				};

			} else {

				// Go over every defined group
				for (tempName in model.modelEdit) {

					// Groups or prefixes will be kept here
					tempGroups = {};

					if (tempName == 'translations') {
						prefixes = Prefix.all();

						for (prefixName in prefixes) {

							// Create an alias to the current prefix
							prefix = prefixes[prefixName];

							// Clone the fields array (for every prefix)
							tempFields = alchemy.cloneSafe(model.modelEdit.translations.fields);

							// Go over every translatable field in the new clone
							// and add the prefix info
							for (i = 0; i < tempFields.length; i++) {
								tempFields[i].path = prefixName;
							}

							// Turn this prefix into a group
							tempGroups[prefixName] = {
								title: __('languages', prefix.title),
								group: {
									title: prefix.title,
									fields: tempFields
								}
							};
						}

					} else {

						// It's not the translations group, so we don't need to do anything special
						tempGroups[tempName] = {
							group: model.modelEdit[tempName]
						};

						tempGroups[tempName].title = tempGroups[tempName].group.title;
					}

					for (groupName in tempGroups) {

						group = tempGroups[groupName].group;

						tempGroup = {};
						tempGroup.title = tempGroups[groupName].title;
						tempGroup.fields = [];

						for (i = 0; i < group.fields.length; i++) {

							entry = group.fields[i];
							field = model.blueprint[entry.field];

							temp = {};

							temp.field = entry.field;

							if (entry.type) {
								temp.type = entry.type;
							} else {
								if (field && field.type) {
									temp.type = field.type;
								}
							}

							if (entry.title) {
								temp.title = entry.title;
							} else {
								temp.title = entry.field.humanize();
							}

							temp.path = entry.path || false;
							
							temp.name = temp.field;

							if (field && field.type) {
								temp.dataType = field.type;
							}

							// Add this field to this group's fields
							tempGroup.fields.push(temp);
						}

						// Store this group in the model
						model._modelEditorGroups[groupName] = tempGroup;
					}
				}
			}
		}

		return alchemy.cloneSafe(model._modelEditorGroups);
	}
});