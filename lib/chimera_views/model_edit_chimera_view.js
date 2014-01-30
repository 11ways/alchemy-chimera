var async = alchemy.use('async'),
    AclDataTypes = alchemy.shared('Acl.dataTypes');

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
	 * Associated model option data
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.assocOptions = function assocOptions(render, module) {

		var that       = this,
		    conditions = {},
		    urlParams  = render.req.route.params,
		    fieldName  = render.req.params.fieldName,
		    groupName,
		    fields,
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

		// Get a (cloned) groups object
		this.getModelGroups(model, function(groups) {

			// Get the field we need
			fields = that.getGroupFields(groups, fieldName);

			conditions['_id'] = render.req.params.id;

			// Get the record we want to edit
			model.find('first', {conditions: conditions}, function (err, item) {

				var original   = model.name.modelName(),
				    editItem   = [],
				    editor;

				item = item[0];
				
				render.viewVars.__groups = groups;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.originalItem = item;
				render.viewVars.blueprint = model.blueprint;

				if (item && item[original]) {
					render.viewVars.routeVars.id = item[original]._id;
				}

				// If no valid field is found, return nothing
				if (!fields[fieldName]) {
					render.res.send({});
					return;
				}

				that.prepareFields(module, model, item, fields, function(instances) {

					field = instances[fieldName];

					field.options(function(list) {
						render.res.send(list);
					});

				});
			});
		});
	};

	/**
	 * Build the index view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(render, module, options) {
		
		var that      = this,
		    paginate  = Component.get('Paginate'),
		    fieldConfigs = {},
		    fields    = {},
		    fieldList = false,
		    newList   = [],
		    excludeFields,
		    fieldName,
		    model,
		    field,
		    i;

		if (typeof options !== 'object') {
			options = {};
		}

		// Get the model
		model = this.prepareModel(render, module, options);

		// Prepare the field info
		this.getModelIndexFields(model, function(fieldInfo) {

			if (model.modelIndex && model.modelIndex.fields) {
				fieldList = model.modelIndex.fields.slice(0);
			}

			// Get all the field instances for every field
			for (i = 0; i < fieldInfo.length; i++) {
				
				field = fieldInfo[i];
				fieldName = fieldInfo[i].field;
				fieldConfigs[fieldName] = field;

				if (!fieldList || fieldList.indexOf(fieldName) > -1) {
					fields[fieldName] = module.getField(field.type);

					if (!fieldList) {
						newList.push(fieldName);
					}
				}
			}

			if (!fieldList) {
				fieldList = newList;
			}

			render.viewVars.blueprint = model.blueprint;
			render.viewVars.fieldInfo = fieldInfo;
			render.viewVars.fields = fieldList;

			render.view = 'chimera/model_editor_index';
			
			paginate.find(model, function(err, items) {

				var tasks = [],
				    i;

				for (i = 0; i < items.length; i++) {

					(function(item) {
						tasks[tasks.length] = function processItem(next) {

							var fieldName,
							    fieldConfig,
							    itemTasks = {};

							for (fieldName in item[model.modelName]) {

								fieldConfig = fieldInfo[fieldName];

								// Skip fields that should not be processed
								if (!fields[fieldName]) {
									continue;
								}

								(function(fieldName) {
									itemTasks[fieldName] = function processField(next_field) {

										// Call the prepareIndex method of the field
										fields[fieldName].prepareIndex({
											model: model,
											item: item,
											fieldConfig: fieldConfigs[fieldName],
											fieldKey: fieldName,
											fieldName: fieldName}, function afterIndex(temp) {
												temp = alchemy.inject({}, fieldInfo[fieldName], temp);
												next_field(null, temp);
										});
									};
								}(fieldName));
							}

							async.parallel(itemTasks, function afterItemFields(err, result) {

								var id;

								id = item._id;

								if (!id && item[model.modelName]) {
									id = item[model.modelName]._id;
								}

								result = {
									_id: id,
									fields: result
								};

								next(err, result);
							});
						};
					}(items[i]));
				}

				async.parallel(tasks, function(err, result) {
					render.viewVars.items = result;
					render();
				});
			});
		});
	};

	/**
	 * Build the add view
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
		this.getModelGroups(model, function(groups) {

			// Prepare the fields object
			fields = that.getGroupFields(groups);

			if (render.get) {

				render.viewVars.__groups = groups;
				render.viewVars.__current__ = null;
				render.viewVars.item = null;
				render.viewVars.originalItem = null;
				render.viewVars.blueprint = model.blueprint;

				that.prepareFields(module, model, null, fields, function afterPrepareFields() {
					render();
				});
			} else {

				// Create references to the data
				var data       = render.req.body.data,
				    modelData  = data,
				    fieldType,
				    fieldName;

				modelData = modelData[model.modelName];

				// Test the preparesave
				that.prepareSave(modelData, {
					module: module,
					model: model,
					fields: fields,
					id: render.req.params.id}, function (err, newData) {

						var modelData = {};
						modelData[model.modelName] = newData;

						pr('Going to save:', true)
						pr(modelData, true);

						// Save the data. Allow any data through the json edit
						model.save(modelData, function(err, result) {

							var url,
							    params;

							params = alchemy.objectify(urlParams);
							params.id = result[0].item._id;

							if (err) {
								// @todo: Redirect to an error
								log.error(err);
							} else {

								url = module.getActionUrl('edit', params);
								render.redirect(url);
							}

						});
				});
			}
		});
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
		this.getModelGroups(model, function(groups) {

			// Extract all the fields by reference
			fields = that.getGroupFields(groups);

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

					item = item[0];

					if (!item) {
						// @todo: some error thing
						render.res.end();
						return;
					}
					
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

					if (item.length) {
						item = item[0][model.modelName];
					} else {
						item = {};
					}

					modelData = modelData[model.modelName];

					// Test the preparesave
					that.prepareSave(modelData, {
						module: module,
						model: model,
						fields: fields,
						id: render.req.params.id}, function (err, newData) {

							pr(newData, true)

							var modelData = {};
							modelData[model.modelName] = newData;

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
				});
			}
		});
	};

	/**
	 * Prepare all field values for saving
	 */
	this.prepareSave = function prepareSave(data, options, callback) {

		var that = this,
		    tasks = {},
		    prep  = {};

		// Get the blueprint
		if (typeof options.blueprint == 'undefined') {
			
			if (typeof options.model == 'string') {
				options.model = this.getModel(options.model);
			}

			if (typeof options.model == 'object') {
				options.blueprint = options.model.blueprint;
			}
		}

		if (typeof options.model != 'undefined') {
			if (!options.subName) {
				options.subName = options.model.modelName;
			}

			if (!options.dataInfo) {
				options.dataInfo = options.model;
			}
		}

		// If a subname is given and it's available in the data, use that
		if (options.subName && data[options.subName]) {
			data = data[options.subName];
		}

		options.data = data;

		prep.group = function prepareGroups(next) {

			if (!options.fields && options.dataInfo) {

				if (!options.groups) {
					that.getModelGroups(options.dataInfo, function(groups) {
						options.groups = groups;
						next();
					});
					return;
				}
			}

			next();
		};

		prep.fields = function prepareFields(next) {

			if (!options.fields && options.dataInfo) {

				// Extract all the fields by reference
				that.getGroupFields(options.groups, function(fields) {
					options.fields = fields;
					next();
				});

				return;
			}

			next();
		};

		async.series(prep, function() {

			// If we still don't have fields, use the blueprint
			if (!options.fields && options.blueprint) {
				options.fields = options.blueprint;
			}

			// Get the original data
			if (!options.originalData && options.model) {

				if (!options.conditions) {

					if (options.id) {
						options.conditions = {_id: options.id};
					} else if (data._id) {
						options.conditions = {_id: data._id};
					}
				}

				if (options.conditions) {
					(function(model, conditions) {
						tasks.getOriginalData = function getOriginalData(done) {

							model.find('first', {conditions: conditions}, function(err, item) {

								if (item.length) {
									options.originalData = item[0][model.modelName];
								} else {
									options.originalData = {};
								}

								done();
							});
						};
					}(options.model, options.conditions));
				}
			}

			// The processed data will be stored in here
			options.processedData = {};

			async.parallel(tasks, function(err, result) {

				var fieldName,
				    tasks = {};

				for (fieldName in data) {

					(function prepareSaveIIFE(fieldName){

						var fieldValue  = data[fieldName],
						    fieldConfig = options.fields[fieldName],
						    field;

						// Don't process this field if the config doesn't exist
						if (!fieldConfig) {
							return;
						}

						field = options.module.getField(fieldConfig.type)
						
						tasks[fieldName] = function asyncWaiterFieldSave(async_callback) {

							var fieldOptions = alchemy.inject({}, options);
							fieldOptions.fieldConfig = fieldConfig;
							fieldOptions.fieldKey = fieldName;
							fieldOptions.fieldName = fieldName;


							field.prepareSave(fieldOptions, function savePrepared(temp) {
								async_callback();
							});

						};
					}(fieldName));
				}

				async.parallel(tasks, function savePrepared() {

					// Now we need to merge the processedData into the original date for saving
					var mergedData = alchemy.merge(options.originalData, options.processedData);

					callback(null, mergedData);

				});
				
			});
		});
	};

	/**
	 * Extract all the fields from the groups
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   groups
	 * @param    {String}   fieldName   The specific fieldName if we only want one
	 */
	this.getGroupFields = function getGroupFields(groups, fieldName) {

		var fields = {},
		    tempName;

		// Extract all the fields
		for (groupName in groups) {
			group = groups[groupName];

			for (i = 0; i < group.fields.length; i++) {
				field = group.fields[i];

				tempName = field.field;

				// If a specific fieldName has been given, and it doesn't
				// match the current field, skip it
				if (fieldName && tempName != fieldName) {
					continue;
				}

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

		var fieldOptions,
		    instances,
		    fieldName,
		    fieldKey,
		    options,
		    tasks;

		instances = {};

		if (typeof module == 'object' && typeof model == 'function') {
			options = module;
			callback = model;
			module = options.module;
			model = options.model;
			item = options.item;
			fields = options.fields;
		} else {
			options = {
				model: model,
				item: item,
				fields: fields,
				module: module
			};
		}

		// Async tasks go here
		tasks = {};

		for (fieldKey in fields) {

			// Queue this function
			(function prepareFieldsIIFE(fieldKey){

				var Field = module.getField(fields[fieldKey].type);

				instances[fieldKey] = Field;

				tasks[fieldKey] = function asyncWaiter(async_callback) {

					fieldOptions = alchemy.inject({}, options);
					fieldOptions.fieldConfig = fields[fieldKey];
					fieldOptions.fieldKey = fieldKey;
					fieldOptions.fieldName = fields[fieldKey].name;

					// Call the prepareInput method of the field
					Field.prepareInput(fieldOptions, function afterInput(temp) {

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
			callback(instances);
		});
	};

	/**
	 * Prepare all the field settings
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}   model
	 */
	this.preloadEditorSettings = function preloadEditorSettings(model, piece, callback) {

		var translationFields,
		    translationGroups,
		    tempFields,
		    Permission,
		    fieldName,
		    indexList,
		    aclgroup,
		    baseList,
		    session,
		    baseObj,
		    clone,
		    assoc,
		    alias,
		    field,
		    temp,
		    i;

		if (!model) {
			log.error('Tried to get model groups for invalid model');
			return {};
		}

		if (typeof piece == 'function') {
			callback = piece;
			piece = undefined;
		}

		session = model.render.req.session;

		// Preload the data if we haven't done so yet
		if (!model._modelEditorSettings) {

			model._modelEditorSettings = {};

			// Set the target objects
			model._modelEditorSettings.groups = {};
			model._modelEditorSettings.fields = {
				index: {
					fields: []
				},
				edit: {
					base: [],
					fields: []
				}
			};

			// Use the blueprint if no specific settings are given
			if (!model.modelEdit) {

				tempFields = [];
				translationFields = [];

				for (fieldName in model.blueprint) {

					field = model.blueprint[fieldName];
					temp = this.convertBlueprintField(model, fieldName);

					// Store the new data in the object
					if (field.translatable) {
						translationFields.push(temp);
					} else {
						tempFields.push(temp);
					}
				}

				// Add the general fields
				model._modelEditorSettings.groups = {
					general: {
						title: __('chimera', 'General'),
						fields: tempFields
					}
				};

				// Add translatable groups
				translationGroups = this.convertTranslationGroup(model, translationFields);
				this.finalizeGroups(translationGroups, model, model._modelEditorSettings.groups);
			} else {

				// Convert the user given configuration to something useable
				model._modelEditorSettings.groups = this.convertSettings(model.modelEdit, model);
			}
		}

		indexList = model._modelEditorSettings.fields.index.fields;
		baseList = model._modelEditorSettings.fields.edit.base;

		baseObj = {};

		for (i = 0; i < baseList.length; i++) {
			baseObj[baseList[i].field] = baseList[i];
		}

		if (model.modelIndex && model.modelIndex.fields && model.modelIndex.fields.length) {

			for (i = 0; i < model.modelIndex.fields.length; i++) {
				temp = model.modelIndex.fields[i];

				if (baseObj[temp]) {
					indexList.push(baseObj[temp]);
				}
			}
		} else {
			for (temp in baseObj) {
				indexList.push(baseObj[temp]);
			}
		}

		Permission = Model.get('AclDataPermission');
		clone = alchemy.cloneSafe(model._modelEditorSettings);

		Permission.getUserPermissions(session.user, model, function(rules) {

			var tasks = [],
			    type,
			    i;

			for (i = 0; i < rules.length; i++) {

				type = Permission.getDataType(rules[i].type);

				if (type) {

					(function(type, rule) {
						tasks[tasks.length] = function(next_task) {
							// Prepare the type data
							type.prepare({
								rule: rule,
								model: model
							}, function afterPrepare() {
								
								type.chimeraGroups(function() {

									type.chimeraIndexFields(function() {

										type.chimeraEditFields(function() {
											next_task();
										}, clone.fields.edit.base);

									}, clone.fields.index.fields);

								}, clone.groups);
							});
						};
					}(type, rules[i]));
				}
			}

			async.parallel(tasks, function() {
				callback(clone.groups, clone.fields);
			});

		});
	};

	/**
	 * Get all the editor fields of this model
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}   model
	 */
	this.getModelIndexFields = function getModelIndexFields(model, piece, callback) {

		var data,
		    context;

		if (typeof piece == 'function') {
			callback = piece;
			piece = undefined;
		}

		if (typeof model.preloadEditorSettings == 'function') {
			context = this;
		} else {
			context = model;
		}

		this.preloadEditorSettings(context, piece, function(groups, fields) {
			callback(alchemy.cloneSafe(fields.index.fields));
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
	this.getModelGroups = function getModelGroups(model, piece, callback) {

		var data,
		    context;

		if (typeof model.preloadEditorSettings == 'function') {
			context = this;
		} else {
			context = model;
		}

		this.preloadEditorSettings(context, piece, function(groups, fields) {
			callback(alchemy.cloneSafe(groups));
		});
	};

	/**
	 * Get the Model Editor settings for a certain field from the blueprint
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   model         The model containing the blueprint
	 * @param    {Object}   fieldName     The name of the field to process
	 *
	 * @return   {Object}                 The result object
	 */
	this.convertBlueprintField = function convertBlueprintField(model, fieldName) {

		var alias,
		    assoc,
		    field,
		    temp;

		// Get the current field
		field = model.blueprint[fieldName];

		// Create a temporary object
		temp = {};

		// Store the fieldname
		temp.field = fieldName;

		// Store the original datatype
		temp.dataType = field.type;

		temp.array = field.array || field.arrayOf;
		temp.object = field.object || field.objectOf;

		// If a fieldType has been defined, use it
		if (field.fieldType) {
			temp.type = field.fieldType;
		} else {

			// Process hasOneParent assocations
			for (alias in model.hasOneParent) {
				assoc = model.hasOneParent[alias];

				if (assoc.foreignKey == fieldName) {
					temp.type = 'hasOne';
					temp.assoc = alchemy.cloneSafe(assoc);
				}
			}

			// Process belongsTo associations
			for (alias in model.belongsTo) {
				assoc = model.belongsTo[alias];

				if (assoc.foreignKey == fieldName) {
					temp.type = 'hasOne';
					temp.assoc = alchemy.cloneSafe(assoc);
				}
			}

			// Process habtm associations
			for (alias in model.hasAndBelongsToMany) {
				assoc = model.hasAndBelongsToMany[alias];

				if (assoc.foreignKey == fieldName) {
					temp.type = 'habtm';
					temp.assoc = alchemy.cloneSafe(assoc);

					// habtm fields are arrays by default
					temp.array = false;
				}
			}

			if (!temp.type) {
				temp.type = field.type;
			}
		}

		temp.title = fieldName.humanize();
		temp.name = fieldName;

		return temp;
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
	this.convertTranslationGroup = function convertTranslationGroup(model, fields, resultGroups) {

		var tempFields,
		    prefixName,
		    prefixes,
		    prefix,
		    clone,
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
	 * @param    {Object}   model       The model containing the blueprint
	 *
	 * @return   {Object}               Converted configuration
	 */
	this.convertSettings = function convertSettings(groups, model) {

		var tempGroups,
		    groupName,
		    result,
		    field,
		    i;

		if (!model.blueprint) {
			model.blueprint = {};
		}

		tempGroups = {};

		// Process every user defined group
		for (groupName in groups) {

			// Groups with the name 'translations' should be handled differently
			if (groupName === 'translations') {

				this.convertTranslationGroup(model, groups.translations.fields, tempGroups);

			} else {

				// It's not the translations group,
				// so we don't need to do anything special
				tempGroups[groupName] = {
					group: groups[groupName]
				};

				tempGroups[groupName].title = tempGroups[groupName].group.title;
			}
		}

		result = this.finalizeGroups(tempGroups, model);

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
	 * @param    {Object}   model       The model containing the blueprint
	 * @param    {Object}   result      The result object to modify by reference
	 *
	 * @return   {Object}               The result
	 */
	this.finalizeGroups = function finalizeGroups(groups, model, result) {

		var blueprint   = model.blueprint,
		    duplicates  = {},
		    groupName,
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

				if (typeof entry == 'string') {
					entry = this.convertBlueprintField(model, entry);
					group.fields[i] = entry;
				}

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

		// Add the fields to the base edit field list
		for (groupName in result) {
			for (i = 0; i < result[groupName].fields.length; i++) {
				entry = result[groupName].fields[i];
				if (!duplicates[entry.field]) {
					model._modelEditorSettings.fields.edit.base.push(entry);
					duplicates[entry.field] = true;
				}
			}
		}

		return result;
	};

});