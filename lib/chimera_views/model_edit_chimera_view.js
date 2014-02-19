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
		render.viewVars.modelTitle = model.title || model.modelName.titleize();

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
		    excludeFields = [],
		    fieldName,
		    model,
		    field,
			pageSize,
			modelName,
			lowerModelName,
		    i,
			allfields = [];

		if (typeof options !== 'object') {
			options = {};
		}

		// Get the model
		model = this.prepareModel(render, module, options);
		modelName = model.name.modelName();
		lowerModelName = modelName.despace().toLowerCase();
		
		excludeFields.push('_id');
		
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
			
			allfields = fieldList;
			for (fieldName in model.blueprint) {
				// Only add this field if it doesn't exist yet
				if (allfields.indexOf(fieldName) == -1 && excludeFields.indexOf(fieldName) == -1) {
					allfields.push(fieldName);
				}
			}
			
			

			render.viewVars.blueprint = model.blueprint;
			render.viewVars.fieldInfo = fieldInfo;
			render.viewVars.fields = fieldList;
			render.viewVars.allfields = allfields;

			render.view = 'chimera/model_editor_index';
						
			//PAGE SIZE
			if(model.pageSizes === undefined){
				model.pageSizes = [20, 50, 100];
			}
			render.viewVars.pageSizes = model.pageSizes;
			pageSize = model.pageSizes[0];
			if(render.req.cookies && render.req.cookies[lowerModelName+'_show']){
				pageSize = render.req.cookies[lowerModelName+'_show'];
			}
			if(Object.exists(render, 'req.body.data.'+modelName+'.show')){
				pageSize = render.req.body.data[modelName]['show'];
				if(~model.pageSizes.indexOf(pageSize)){ //in case user tried to edit html and request 9000 items
					pageSize = model.pageSizes[0];
				}
				render.res.cookie(lowerModelName+'_show', render.req.body.data[modelName]['show']);
			}
			render.viewVars.show = pageSize;
			
			/*********************
			 * BEGIN FILTER PART *
			 *********************/
			var conditions = {},
			    or = {},
			    not = {},
			    and = {},
				filtersRaw = false,
				andorRaw = false;

			render.viewVars.filters = render.viewVars.andor = false;
				
			//load filters from cookies
			if(render.req.cookies && render.req.cookies[lowerModelName+'_filters'] && render.req.cookies[lowerModelName+'_andor']){
				filtersRaw = render.req.cookies[lowerModelName+'_filters'];
				andorRaw = render.req.cookies[lowerModelName+'_andor'];
			}
			//override in case new filters were submitted
			if (render.req.body.data && render.req.body.data[modelName]['filters']) {
				if(render.req.body.data[modelName]['filters']!=='[]'){
					filtersRaw = render.req.body.data[modelName]['filters'];
					andorRaw = render.req.body.data[modelName]['andor'];
				} else {
					filtersRaw = andorRaw = false;
					render.res.clearCookie(lowerModelName + '_filters');
					render.res.clearCookie(lowerModelName + '_andor');
				}
			}
			
			var tasks=[];
			if(filtersRaw && andorRaw){
				render.viewVars.filters = filtersRaw;
				var filters = JSON.parse(filtersRaw);
				var andor = render.viewVars.andor = andorRaw;

				//add selected fields and values to conditions
				for(var i in filters){
					var filter = filters[i];

					var like = new RegExp('.*?' + filter.value + '.*?', 'i');
					var field = filter.name;
					var value = filter.value;
					var condition = filter.condition;
					
					fieldInst = model.blueprint[field];
					foreignInst = model.foreignKeys[field];

					if (!fieldInst) continue;
					
					if (foreignInst) {
							(function(foreignInst, field, value, like, andor, condition) {
								
								tasks[tasks.length] = function foreignFinder(next) {
									
									var assocModel = that.getModel(foreignInst.modelName),
										foreignConditions = {},
										foreignOr = {},
										foreignNot = {},
										foreignAnd = {};
								
									if (condition === 'like') {
										if(andor == 'or'){
											//IF: IND001 ONLY :
											if(foreignInst.modelName === 'User'){
												foreignOr['username'] = like;
												foreignOr['first_name'] = like;
												foreignOr['last_name'] = like;
											} else {
												foreignOr[assocModel.displayField] = like;
											}
										} else if(andor == 'and') {
											//IF: IND001 ONLY :
											if(foreignInst.modelName === 'User'){
												foreignOr['username'] = like;
												foreignOr['first_name'] = like;
												foreignOr['last_name'] = like;
											} else {
												foreignConditions[assocModel.displayField] = like;
											}
										}
									} else if (condition === 'is') {
										if(andor == 'or'){
											//IF: IND001 ONLY :
											if(foreignInst.modelName === 'User'){
												foreignOr['username'] = value;
												foreignOr['first_name'] = value;
												foreignOr['last_name'] = value;
											} else {
												foreignOr[assocModel.displayField] = value;
											}
										} else if(andor == 'and') {
											//IF: IND001 ONLY :
											if(foreignInst.modelName === 'User'){
												foreignOr['username'] = value;
												foreignOr['first_name'] = value;
												foreignOr['last_name'] = value;
											} else {
												foreignConditions[assocModel.displayField] = value;
											}
										}
									} else if (condition === 'notlike') {
										foreignNot[assocModel.displayField] = like;
									} else if (condition === 'isnot') {
										foreignNot[assocModel.displayField] = value;
									}
									if (!empty(foreignOr)) {
										foreignConditions['$or'] = foreignOr;
									}
									if (!empty(foreignNot)) {
										foreignConditions['$not'] = foreignNot;
									}
									if (!empty(foreignAnd)) {
										foreignConditions['$and'] = foreignAnd;
									}
									
									assocModel.find('all', {conditions: foreignConditions}, function(err, results) {
										var ids = [],
											item,
											i;

										if (results.length) {
											for (i = 0; i < results.length; i++) {
												item = results[i][assocModel.modelName];
												//ids.push(item._id);
												ids.push(String(item._id));
												ids.push(alchemy.ObjectId(String(item._id)));
											}

											// If we found valid ids, add them to the condition
											if (ids.length) {
												if (condition === 'like' || condition === 'is') {
													if(andor == 'or'){
														or[field] = ids;
													} else if(andor == 'and') {
														conditions[field] = ids;
													}
												} else if (condition === 'notlike' || condition === 'isnot') {
													not[field] = ids;
												}
												
											}
										} else {
											//did not find anything, insert a false condition because it will show EVERYTHING otherwise
											or[field] = 'somtingimpossibru';
										}
										
										next();
									});
								};
							}(foreignInst, field, value, like, andor, condition));

					} else {
						
						if (condition === 'like') {
							if(andor == 'or'){
								or[field] = like;
							} else if(andor == 'and') {
								conditions[field] = like;
							}
						} else if (condition === 'is') {
							if(andor == 'or'){
								or[field] = value;
							} else if(andor == 'and') {
								conditions[field] = value;
							}
						} else if (condition === 'notlike') {
							not[field] = like;
						} else if (condition === 'isnot') {
							not[field] = value;
						}
					}
					
					
				}//END FOR FILTERS LOOP
				
				render.res.cookie(lowerModelName + '_filters', filtersRaw);
				render.res.cookie(lowerModelName + '_andor', andorRaw);
			}
			/******************************
			 * END FILTER, BEGIN PAGINATE *
			 ******************************/

			async.series(tasks, function() {
				if (!empty(or)) {
					conditions['$or'] = or;
				}
				if (!empty(not)) {
					conditions['$not'] = not;
				}
				if (!empty(and)) {
					conditions['$and'] = and;
				}
				
				paginate.find(model, {pageSize: pageSize, conditions:conditions}, function(err, items) {

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
	 * Build the delete view
	 *
	 * @author   Kjell Keisse   <kjell@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.remove = function remove(render, module, options) {

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
		render.view = 'chimera/model_delete';
		
		render.viewVars.deleteButton = __('chimera', 'Delete record');
		render.viewVars.postUrl = module.getActionUrl('delete', urlParams);

		render.viewVars.deleteTitle = __('chimera', 'Delete record');

		// Get a (cloned) groups object
		this.getModelGroups(model, function(groups) {

			// Extract all the fields by reference
			fields = that.getGroupFields(groups);

			conditions['_id'] = render.req.params.id;

			// Handle GET requests
			// Also use this when onlyView is enabled (it allows no post requests);
			if (render.get) {

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
					render.viewVars.displayField = model.displayField;

					that.prepareFields(module, model, item, fields, function afterPrepareFields() {
						render();
					});
				});
			} else if (render.post) {

				// Create references to the data
				var data       = render.req.body.data,
				    modelData  = data,
					modelName  = model.name.modelName();

				// Remove the record
				model.remove(modelData[modelName]['_id'], function(err) {

					if (err) {
						// @todo: Redirect to an error
						log.error(err);
					} else {
						url = module.getActionUrl('index').replace(':model', modelName);
						render.redirect(url);
					}

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
				options.fields = that.getGroupFields(options.groups);
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

					// Make sure the mergedData is not an array when it shouldn't be
					if (Array.isArray(mergedData) && !Array.isArray(options.processedData)) {
						mergedData = options.processedData;
					}

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
	 * @param    {Object}   piece       The optional piece record
	 * @param    {String}   fieldName   The specific fieldName if we only want one
	 */
	this.getGroupFields = function getGroupFields(groups, piece, fieldName) {

		var fields = {},
		    tempName;

		if (typeof piece == 'string') {
			fieldName = piece;
			piece = undefined;
		}

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
		    basePath,
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

						// If the basepath isn't set yet, do it now
						if (!basePath) {
							basePath = Field.basePath;
						}

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
			callback(instances, basePath);
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
		    skipFields,
		    tempFields,
		    Permission,
		    fieldName,
		    indexList,
		    aclgroup,
		    baseList,
		    AclRule,
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

				skipFields = {
					'_id': true,
					'created': true,
					'updated': true
				};

				tempFields = [];
				translationFields = [];

				for (fieldName in model.blueprint) {

					if (fieldName in skipFields) {
						continue;
					}

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

		AclRule = this.getModel('AclRule');

		Permission = Model.get('AclDataPermission');
		clone = alchemy.cloneSafe(model._modelEditorSettings);

		AclRule.getModelFields(model, function(fieldSettings) {

			var groupName,
			    setting,
			    fields,
			    field,
			    group,
			    i;

			for (groupName in clone.groups) {
				group = clone.groups[groupName];

				for (i = 0; i < group.fields.length; i++) {

					field = group.fields[i];
					setting = fieldSettings[field.field];

					if (!setting || !setting.read) {
						delete group.fields[i];
					} else {
						if (!setting.write) {
							setting.disabled = true;
						}
					}
				}

				// Remove undefined entries
				group.fields.clean(undefined);
			}

			// Modify index fields
			fields = clone.fields.index.fields;

			for (i = 0; i < fields.length; i++) {
				field = fields[i];
				setting = fieldSettings[field.field];

				if (!setting || !setting.read) {
					delete fields[i];
				} else {
					if (!setting.write) {
						setting.disabled = true;
					}
				}
			}

			fields.clean(undefined);

			// Modify edit fields
			fields = clone.fields.edit.base;

			for (i = 0; i < fields.length; i++) {
				field = fields[i];
				setting = fieldSettings[field.field];

				if (!setting || !setting.read) {
					delete fields[i];
				} else {
					if (!setting.write) {
						setting.disabled = true;
					}
				}
			}

			fields.clean(undefined);

			callback(clone.groups, clone.fields);
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
		    context,
		    origin = this;

		if (typeof piece == 'function') {
			callback = piece;
			piece = undefined;
		}

		if (typeof model.preloadEditorSettings == 'function') {
			context = this;
			origin = model;
		} else {
			context = model;
		}

		origin.preloadEditorSettings(context, piece, function(groups, fields) {
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
		    context,
		    origin = this;

		context = model;

		if (typeof model.preloadEditorSettings == 'function') {
			context = this;
			origin = model;
		} else {
			context = model;
		}

		origin.preloadEditorSettings(context, piece, function(groups, fields) {
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

		if (!field) {
			log.error('Could not find field "' + fieldName + '" inside blueprint');
			return temp;
		}

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

		// Chimera field settings can also be stored in the blueprint itself,
		// if it really is required.
		// This is the case when blueprint fields are used inside other classes
		// than models
		if (field.field && typeof field.field == 'object') {
			alchemy.inject(temp, field.field);
		}

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
		    temp,
		    i;

		if (!model.blueprint) {
			model.blueprint = {};
		}

		tempGroups = {};

		// Process every user defined group
		for (groupName in groups) {

			// Groups with the name 'translations' should be handled differently
			if (groupName === 'translations') {

				// Go over every entry in this group
				// @todo: this should probably be fixed somewhere else!
				for (i = 0; i < groups.translations.fields.length; i++) {
					temp = groups.translations.fields[i];

					// Get the blueprint info if it's just a string
					if (typeof temp == 'string') {
						groups.translations.fields[i] = this.convertBlueprintField(model, temp);
					}
				}

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

	function empty(object) {
		for (var property in object) {
			if (object.hasOwnProperty(property))
				return false;
		}

		return true;
	}

});