var async = alchemy.use('async');

/**
 * The basic index page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function ModelEditChimeraView() {

	/**
	 * Build the view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.build = function build(render, module, options) {

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

		// Already set the view file
		render.view = 'chimera/model_edit';

		if (typeof options !== 'object') {
			options = {};
		}

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
		render.viewVars.saveButton = __('chimera', 'Save record');
		render.viewVars.showActions = ['paginate', 'record'];
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);

		if (options.onlyView) {
			render.viewVars.showSaveButton = false;
			render.viewVars.editTitle = __('chimera', 'View record');
		} else {
			render.viewVars.editTitle = __('chimera', 'Edit record');
		}

		// Get a (cloned) groups object
		groups = this.getModelGroups(model);

		pr(groups, true)

		// Prepare the fields object
		fields = {};

		// Extract all the fields
		for (groupName in groups) {
			group = groups[groupName];

			for (i = 0; i < group.fields.length; i++) {
				field = group.fields[i];

				fields[field.field] = field;
			}
		}

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

				// Go over all the fieldnames in the original and
				// remove deleted fields
				for (fieldName in item[model.modelName]) {

					if (!(fieldName in modelData)) {
						modelData[fieldName] = undefined;
					}
				}

				// Save the data. Allow any data through the json edit
				model.save(modelData, {fieldList: false}, function(err, result) {

					var url;

					log.error(err);
					log.verbose(result);
					
					if (err) {
						// Redirect to an error
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
	 * Prepare all the given fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.prepareFields = function prepareFields(module, model, item, fields, callback) {

		var fieldName,
		    tasks;

		// Async tasks go here
		tasks = {};

		for (fieldName in fields) {

			// Queue this function
			(function(fieldName){
				var Field = module.getField(fields[fieldName].type);

				tasks[fieldName] = function asyncWaiter(async_callback) {
					Field.prepareInput(model, item, fields[fieldName], fieldName, function afterInput(temp) {

						fields[temp.field].view = temp.view;
						fields[temp.field].value = temp.value || null;

						async_callback();
					});
				};
			}(fieldName));
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
		    tempGroup,
		    fieldName,
		    assoc,
		    alias,
		    entry,
		    group,
		    field,
		    temp;

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
				for (groupName in model.modelEdit) {
					group = model.modelEdit[groupName];

					tempGroup = {};
					tempGroup.title = group.title;
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

		return alchemy.cloneSafe(model._modelEditorGroups);
	}
});