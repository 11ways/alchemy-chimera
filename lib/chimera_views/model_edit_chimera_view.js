var async = alchemy.use('async'),
    AclDataTypes = alchemy.shared('Acl.dataTypes'),
    excelBuilder = alchemy.use('msexcel-builder');

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
	 * @version  0.1.0
	 */
	this.prepareModel = function prepareModel(render, module, options) {

		var model;

		if (!options) {
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
		render.viewVars.modelTitle = model.title || model.modelName.titleize();
		render.viewVars.newItemName = model.newItemName || model.title || model.modelName.humanize().toLowerCase();
		render.viewVars.titleContent = '';

		render.viewVars.showActions = ['paginate', 'record'];

		if (model && model.actionLists) {
			render.viewVars.chimeraModuleActionLists = model.actionLists;
		}

		return model;
	};

	/**
	 * Execute a custom action inside the model
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.custom = function custom(render, module) {

		var action = render.req.param('action'),
		    model  = this.prepareModel(render, module, {});

		if (action && typeof model['chimera_' + action] == 'function') {
			model['chimera_' + action](render, module);
		} else {
			render.res.end();
		}
	};

	/**
	 * Return data as if it were for other fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.modelAssocOptions = function modelAssocOptions(render, module) {

		var that = this,
		    model,
		    field;

		model = this.prepareModel(render, module);
		field = module.getField('habtm');

		field.fieldConfig = {assoc: {}};
		field.fieldConfig.assoc.modelName = model.modelName;

		field.options(function(list) {
			render.res.send(list);
		});
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
		    options    = {},
		    groupName,
		    fields,
		    model,
		    group,
		    field,
		    temp,
		    i;

		// Get the model
		model = this.prepareModel(render, module, options);

		// Get a (cloned) groups object
		this.getModelGroups(model, function(err, groups) {

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
	 * Return info on how to render the filter input field
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.filterInput = function filterInput(render, module) {

		var that       = this,
		    urlParams  = render.req.route.params,
		    fieldPath  = render.req.params.fieldPath,
		    options    = {},
		    fieldInfo,
		    groupName,
		    fields,
		    model,
		    group,
		    field;

		// Get the model
		model = this.prepareModel(render, module, options);

		// Get field info
		fieldInfo = this.getFieldInfo(fieldPath, model);

		// Get a (cloned) groups object
		this.getModelGroups(fieldInfo.model, function(err, groups) {

			// Get the field we need
			fields = that.getGroupFields(groups, fieldInfo.field);

			render.viewVars.__groups = groups;
			render.viewVars.blueprint = fieldInfo.blueprint;

			// If no valid field is found, return nothing
			if (!fields[fieldInfo.field]) {
				render.res.send({});
				return;
			}

			that.prepareFields({module: module, model: fieldInfo.model, fields: fields}, function(instances) {

				field = instances[fieldInfo.field];
				
				field.filterInput(function(data) {

					var response = {};

					response.modelName = fieldInfo.model.modelName;
					response.fieldName = fieldInfo.field;
					response.fieldPath = fieldInfo.fieldPath;

					response.filterFieldName = field.filterFieldName || 'default';
					response.data = data;

					render.res.send(response);
				});
			});
		});
	};

	/**
	 * Get the filter conditions from the
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.1
	 * @version  0.1.1
	 */
	this.getFilterConditions = function getFilterConditions(render, model, module, callback) {

		var that = this,
		    logicalOperator,
		    fieldConditions,
		    cookieSearch,
		    cookieName,
		    fromCookie,
		    searchData,
		    processed,
		    compiled,
		    filters,
		    result,
		    tasks,
		    cpath,
		    data,
		    old;

		// The result object to pass to the callback
		result = {};

		// The compiled conditions
		compiled = {
			'$or': {},
			'$and': {},
			'$not': {}
		};

		// The cookiename for the conditions
		cookieName = model.modelName + '_cfilters';
		cookieSearch = model.modelName + '_csearch';

		// Global search settings
		if (Object.exists(render, 'req.body.data.search')) {
			searchData = render.req.body.data.search;
		} else {
			searchData = Object.path(render, 'req.cookies.' + cookieSearch);
		}

		searchData = searchData || '';

		render.viewVars.search = searchData;

		// Get the cookie data
		old = Object.path(render, 'req.cookies.' + cookieName) || {};

		// Get the data from the POST BODY or GET REQUEST
		data = Object.path(render, 'req.body.data') || Object.path(render, 'req.query.filter');

		// If no data is found still, find it in the cookies
		if (!data) {
			data = Object.assign({}, old);
			fromCookie = true;
		} else {
			data = Object.assign({}, old, data);
		}

		cpath = render.req.originalUrl.beforeLast('/');

		// Set the cookies for this path only
		render.res.cookie(cookieSearch, searchData, {path: cpath});
		render.res.cookie(cookieName, data, {path: cpath});

		// If there still is no valid data, callback with nothing
		if (Object.isEmpty(data)) {
			render.viewVars.fieldConditions = false;
			return callback(null, result);
		}

		// Get the filter configuration
		filters = Object.path(data, 'filters');

		// Get the field conditions
		fieldConditions = Array.cast(filters);

		if (searchData) {
			fieldConditions = fieldConditions.concat(that.searchAllFields(searchData, model));
			logicalOperator = 'or';
		} else {
			// Get the logical operator
			logicalOperator = (Object.path(data, 'logicalOperator') || 'OR').toLowerCase();
		}

		render.viewVars.fieldConditions = fieldConditions;

		tasks = [];
		processed = [];

		// Iterate over every condition the user has given us
		fieldConditions.forEach(function(field, index) {

			var fieldType,
			    config,
			    target,
			    temp,
			    info;

			info = that.getFieldInfo(field.fieldPath, model);

			if (!info.model) {
				return;
			}


			if (data.andor == 'and') {
				target = '$and';
			} else {
				target = '$or';
			}

			if (field.condition === 'notlike' || field.condition === 'isnot') {
				target = '$not';
			}

			if (!config) {
				compiled[target]['impossible'] = 'not_possible_value';
				return;
			}

			// Get the correct MEF instance associated with this field
			fieldType = module.getField(config.fieldType || config.type);

			tasks[tasks.length] = function(next) {

				var options = {};

				options.filter = field;
				options.module = module;
				options.fieldName = info.field,
				options.fieldConfig = config;
				options.model = model;

				fieldType.getFilterValue(options, function(match_value) {

					var key;

					if (match_value && typeof match_value === 'object' && match_value.__deep) {

						if (!compiled[target]['$or']) {
							compiled[target]['$or'] = {};
						}

						for (key in match_value.__deep) {
							compiled[target]['$or'][info.alias + '.' + key] = match_value.__deep[key];
						}

					} else {

						if(!compiled[target][info.fieldPath]){
							compiled[target][info.fieldPath] = [];
						}

						// Add the value to the array (merge arrays if an array is given)
						compiled[target][info.fieldPath] = compiled[target][info.fieldPath].concat(match_value);
					}

					next();
				});
			};
		});

		async.series(tasks, function() {

			var conditions = {};

			if (!Object.isEmpty(compiled.$or)) {
				conditions.$or = compiled.$or;
			}

			if (!Object.isEmpty(compiled.$and)) {
				conditions.$and = compiled.$and;
			}

			if (!Object.isEmpty(compiled.$not)) {
				conditions.$not = compiled.$not;
			}

			result.logicalOperator = logicalOperator;
			result.activeFilters = !Object.isEmpty(conditions);
			result.conditions = conditions;
			result.fromCookie = true;
			result.pageSize = data.show;
			result.data = data;

			callback(null, result);
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
		    modelName,
		    lowerModelName,
		    i,
			search = false,
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

			var allFieldTitles = [];

			if (model.modelIndex && model.modelIndex.fields) {
				fieldList = [];
				
				model.modelIndex.fields.forEach(function(value) {
					fieldList.push(value.field);
				});
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

			// Now get the titles of all the fields
			allfields.forEach(function(value) {

				var title = value.humanize();

				if (model.translatableTitles) {
					title = __('fieldTitles', title);
				}

				allFieldTitles.push({name: value, title: title});
			});
			
			var modelEditFilterSettings = {};
			
			if(model.useModelEditAsFilter){
				for (var group in model.modelEdit) {
					var group_data = model.modelEdit[group];
					var modelEditFilterFields = {};
					for(var i=0; i<group_data.fields.length; i++){
						var field = group_data.fields[i];
						var title = '';
						if(field['title']){
							title = field['title'];
						} else {
							title = field['field'].humanize();
						}
						modelEditFilterFields[field['field']] = {};
						modelEditFilterFields[field['field']]['domain'] = 'fieldTitles';
						modelEditFilterFields[field['field']]['params'] = undefined;
						modelEditFilterFields[field['field']]['key'] = title;
						modelEditFilterFields[field['field']]['model'] = field['modelName'];
						modelEditFilterFields[field['field']]['alias'] = field['modelAlias'];
					}
					if(group_data.title){
						modelEditFilterSettings[group_data.title.key] = {};
						modelEditFilterSettings[group_data.title.key]['fields'] = modelEditFilterFields;
					} else {
						modelEditFilterSettings['Translation'] = {};
						modelEditFilterSettings['Translation']['fields'] = modelEditFilterFields;
					}
				}
			} else {
				modelEditFilterSettings = model._modelFilterSettings;
			}
			
			render.viewVars.useSeparateFilterPage = false;
			if(model.useSeparateFilterPage){
				render.viewVars.useSeparateFilterPage = true;
			}
			
			render.viewVars.blueprint = model.blueprint;
			render.viewVars.fieldInfo = fieldInfo;
			render.viewVars.fields = fieldList;
			render.viewVars.allFieldTitles = allFieldTitles;
			//render.viewVars.allGroupedFields = model._modelFilterSettings;
			render.viewVars.allGroupedFields = modelEditFilterSettings;

			// Extract filter settings from GET, POST or COOKIEs
			that.getFilterConditions(render, model, module, function(err, result) {

				var findOptions = {},
				    pageSizeOptions,
				    pageSize;

				if(typeof model.pageSizes != 'undefined'){
					pageSizeOptions = model.pageSizes;
				} else {
					pageSizeOptions = [20, 50, 100];
				}

				// Set the page size
				pageSize = result.pageSize || pageSizeOptions[0];

				// Pass the page size options to the view
				render.viewVars.show = pageSize;
				render.viewVars.pageSizes = pageSizeOptions;

				// Also set the pageSize in the find options
				findOptions.pageSize = pageSize;
				findOptions.conditions = result.conditions;

				// Indicate the filters are active
				that.render.viewVars.activeFilters = result.activeFilters || false;

				// Tell which logical operator is active
				that.render.viewVars.logicalOperator = result.logicalOperator || 'or';

				if (typeof model.indexContain !== 'undefined') {
					findOptions.contain = model.indexContain;
				}

				//findOptions.debug = true;

				paginate.find(model, findOptions, function(err, items) {

					if (model.indexView == 'card') {
						that.indexCard(render, model, items);
					} else {
						that.indexTable(render, model, items, fields, fieldConfigs, fieldInfo);
					}
				});

			});
		});
	};

	/**
	 * Export the current query
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.export = function exprt(render, module) {

		var that = this,
		    model,
		    field,
		    modelName,
		    excelFields = {'_id': '_id', 'created': 'created', 'updated': 'updated'},
		    lowerModelName;

		// Get the model
		model = this.prepareModel(render, module);
		modelName = model.name.modelName();
		lowerModelName = modelName.despace().toLowerCase();

		this.getFilterConditions(render, model, module, function(err, result) {

			var findOptions = {};

			if (!result.conditions || Object.isEmpty(result.conditions)) {
				render.setFlash(__('chimera', 'Please set filters before exporting'), 'error');
				url = module.getActionUrl('index', render.req.route.params);
				render.redirect(url);
				return;
			}

			findOptions.conditions = result.conditions;

			if (model.exportContain && model.exportContain.length) {
				findOptions.contain = model.exportContain;
			} else {
				findOptions.recursive = -1;
			}

			model.find('all', findOptions, function(err, items) {

				var tasks = [];

				items.forEach(function(item, index) {

					tasks[index] = function(next) {

						var itemTasks = {},
						    todo = Object.assign({}, item[model.modelName]),
						    i;

						if (model.exportExtraFields) {
							for (i = 0; i < model.exportExtraFields.length; i++) {
								todo[model.exportExtraFields[i]] = Object.path(item, model.exportExtraFields[i]);
							}
						}

						Object.each(todo, function(value, fieldKey) {

							var field = model.getModelEditorField(fieldKey),
							    options;

							options = {
								model: field.model,
								modelAlias: field.info.alias,
								item: item,
								fieldKey: field.info.field,
								fieldName: field.info.field,
								fieldConfig: field.config
							};

							// Skip certain fields
							if (model.exportSkipFields && model.exportSkipFields.indexOf(fieldKey) > -1) {
								return;
							}

							excelFields[fieldKey] = field.info.field;

							itemTasks[fieldKey] = function(next_task) {
								field.prepareExport(options, next_task);
							};
						});

						async.parallelLimit(itemTasks, 9, next);
					};
				});

				async.parallelLimit(tasks, 4, function(err, result) {

					var fileName = 'export-' + Date.now() + '.xlsx',
					    filePath = PATH_TEMP + '/' + fileName,
					    columns,
					    colCount,
					    rowCount,
					    workbook,
					    general,
					    row,
					    val,
					    key;

					columns = Array.cast(model.exportOrder).concat(Object.keys(excelFields)).unique();

					colCount = columns.length;
					rowCount = result.length;
					workbook = excelBuilder.createWorkbook(PATH_TEMP, fileName);
					general  = workbook.createSheet('Export', colCount+1, rowCount+1);
					row = 1;

					// Create the headings
					columns.forEach(function(key, index) {

						var name  = excelFields[key],
						    title = Model.get('StaticString').domains['fieldTitles'][name.humanize()];

						if (title) {
							title = alchemy.pickTranslation(render, title);
						}

						if (!title) {
							title = name.humanize();
						}

						general.set(index+1, row, title);
						general.font(index+1, row, {sz: 12, bold: true});
					});

					result.forEach(function(data) {

						row++;

						columns.forEach(function(name, index) {
							val = data[name];
							general.set(index+1, row, val);
						});
					});

					workbook.save(function(err) {

						if (!err) {
							render.serveFile(filePath, 'export-' + model.modelName + '.xlsx', true);
						} else {
							return render.res.end();
						}
					});
				});
			});
		});

	};

	/**
	 * Build a card index view out of the found records
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.indexCard = function indexCard(render, model, items) {

		var tasks = [];

		render.view = 'chimera/card_index';

		if (model.indexCardCount) {
			render.viewVars.cardCount = model.indexCardCount;
		} else {
			render.viewVars.cardCount = 3;
		}

		render.viewVars.cardGrid = 12 / render.viewVars.cardCount;

		if (render.viewVars.cardGrid !== ~~(render.viewVars.cardGrid)) {
			render.viewVars.cardCount = 3;
			render.viewVars.cardGrid = 4;
		}

		if (model.indexCardElement) {
			render.viewVars.cardElement = model.indexCardElement;
		} else {
			render.viewVars.cardElement = 'chimera/card_index_element';
		}

		if (typeof model.prepareIndexCard === 'function') {
			items.forEach(function(item) {
				tasks[tasks.length] = function(next) {
					model.prepareIndexCard(item, next);
				};
			});

			async.parallel(tasks, function(err, result) {
				render.viewVars.items = result;
				render();
			});
		} else {
			render.viewVars.items = items;
			render();
		}
	};

	/**
	 * Build a table index view out of the found records
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.indexTable = function indexTable(render, model, items, fields, fieldConfigs, fieldInfo) {

		var tasks = [],
		    i;

		render.view = 'chimera/model_editor_index';

		items.forEach(function(item, index) {

			tasks[tasks.length] = function processItem(next) {

				var itemTasks = {};

				Object.each(fields, function(field, fieldName) {

					itemTasks[fieldName] = function processField(next_field) {

						// Call the prepareIndex method
						field.prepareIndex({
							model: model,
							item: item,
							fieldConfig: fieldConfigs[fieldName],
							fieldKey: fieldName,
							fieldName: fieldName
						}, function afterIndex(temp) {
							temp = alchemy.inject({}, fieldInfo[fieldName], temp);

							if (fieldInfo[fieldName] != null && temp.title != null) {
								fieldInfo[fieldName].title = temp.title;
							}

							next_field(null, temp);
						});
					};
				});

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

		});
		
		async.parallel(tasks, function(err, result) {
			render.viewVars.items = result;
			render();
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

		render.viewVars.foreignData = {};

		// Set the view file
		if (render.req.param('modal')) {
			render.view = 'chimera/model_edit_modal';

			render.viewVars.foreignData = {
				key: render.req.param('foreignKey'),
				id: render.req.param('foreignId')
			};
		} else {
			render.view = 'chimera/model_edit';
		}

		render.viewVars.saveButton = __('chimera', 'Add record');
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);
		render.viewVars.editTitle = __('chimera', 'Add record');
		render.viewVars.actionType = 'create';

		// Get a (cloned) groups object
		this.getModelGroups(model, function(err, groups) {

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
						model.save(modelData, {allowedIndexes: []}, function(err, result) {

							var url,
							    params;

							if (err) {
								// @todo: Redirect to an error
								log.error(err);
								render();
							} else {

								// @todo: these resultsets should be returned better!
								if (Array.isArray(result)) {
									item = result[0].item;
								} else {
									item = result[model.modelName];
								}

								params = alchemy.objectify(urlParams);
								params.id = item._id;

								render.setFlash(__('chimera', 'Item has been added'), 'success');

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
		if (render.req.param('modal')) {
			render.view = 'chimera/model_edit_modal';
		} else {
			render.view = 'chimera/model_edit';
		}

		render.viewVars.saveButton = __('chimera', 'Save record');
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);

		if (options.onlyView) {
			render.viewVars.actionType = 'view';
		} else {
			render.viewVars.actionType = 'write';
		}

		render.viewVars.foreignData = false;

		if (options.onlyView) {
			render.viewVars.showSaveButton = false;
			render.viewVars.editTitle = __('chimera', 'View record');
		} else {
			render.viewVars.editTitle = __('chimera', 'Edit record');
		}

		// Get a (cloned) groups object
		this.getModelGroups(model, function(err, groups) {

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

					render.viewVars.titleContent = model.getDisplayTitle(item);

					if (render.viewVars.titleContent) {
						render.viewVars.titleContent = '"' + render.viewVars.titleContent + '"';
					}

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
						id: render.req.params.id
					}, function (err, newData) {

						var modelData = {};
						modelData[model.modelName] = newData;

						// Save the data. Allow any data through the json edit
						model.save(modelData, function(err, result) {

							var url;

							if (err) {
								// @todo: Redirect to an error
								log.error(err);

								render.setFlash(__('chimera', 'Item has not been saved'), 'error');

							} else {

								render.setFlash(__('chimera', 'Item has been saved'), 'success');

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
		this.getModelGroups(model, function(err, groups) {

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
						render.setFlash(__('chimera', 'Could not remove item!'), 'error');
					} else {

						render.setFlash(__('chimera', 'Item has been removed!'), 'success');

						url = module.getActionUrl('index', {model: modelName});
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
					that.getModelGroups(options.dataInfo, function(err, groups) {
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

		var instances,
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

				if (!Field) return;

				instances[fieldKey] = Field;

				tasks[fieldKey] = function asyncWaiter(async_callback) {

					var fieldOptions;

					fieldOptions = alchemy.inject({}, options);
					fieldOptions.fieldConfig = fields[fieldKey];
					fieldOptions.fieldKey = fieldKey;
					fieldOptions.fieldName = fields[fieldKey].name;

					// If this is a field found in another model, disable the input
					if (fields[fieldKey].modelAlias != model.modelName) {
						fields[fieldKey].readonly = true;
					}

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
	 * Preload the filter settings
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}   model
	 *
	 * @return   {Object}
	 */
	this.preloadFilterSettings = function preloadFilterSettings(model) {

		var editorSettings = model._modelEditorSettings,
		    filterSettings,
		    associations,
		    fields;

		if (!model._modelFilterSettings) {

			model._modelFilterSettings = filterSettings = {};

			associations = Model.getAssociationsMap(model);

			fields = Object.map(associations, function(modelName, alias) {
				
				var model = Model.get(modelName);

				return {
					model: modelName,
					alias: alias,
					fields: Object.map(model.blueprint, function(info, fieldname) {

						var title = fieldname.humanize();

						if (model.translatableTitles) {
							title = __('fieldTitles', title);
						}

						return title;
					})
				};
			});

			alchemy.inject(filterSettings, fields);
		}

		return model._modelFilterSettings;
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

		var that = this,
		    translationFields,
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
		    render,
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

		render = model.render;
		session = render.req.session;

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
					temp = this.convertBlueprintField(fieldName, model);

					// If the blueprint has a title, use that
					if (field.title) {
						temp.title = field.title;
					} else if (model.translatableTitles) {
						temp.title = __('fieldTitles', fieldName.humanize());
					}

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

		if (model.modelIndex && model.modelIndex.fields && model.modelIndex.fields.length) {
			indexList.push.apply(indexList, model.modelIndex.fields);
		} else {
			indexList.push.apply(indexList, baseList);
		}

		this.preloadFilterSettings(model);

		// Remove the disallowed fields
		this.getAllowedFields(model, function(err, groups, fields, fieldFlags) {

			that.setAllowedActions(render, model, fieldFlags);

			callback(err, groups, fields, fieldFlags);
		});
	};

	/**
	 * Set the allowed actions
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {RenderCallback}      render
	 * @param    {Object}              fieldFlags
	 */
	this.setAllowedActions = function setAllowedActions(render, model, fieldFlags) {

		var modelFlags = fieldFlags[model.modelName],
		    actions    = alchemy.cloneSafe(render.viewVars.chimeraModuleActions),
		    lists      = alchemy.cloneSafe(render.viewVars.chimeraModuleActionLists);

		if (fieldFlags[model.modelName]) {
			modelFlags = fieldFlags[model.modelName].__modelFlags;
		} else {
			modelFlags = false;
		}

		if (modelFlags) {
			Object.each(lists, function(entries, name) {

				entries.forEach(function(name, index) {

					var granted = true,
					    action,
					    flags,
					    i;

					if (typeof name === 'string') {
						action = actions[name];
					} else {
						action = name;
					}

					flags = Array.cast(action.flags).clean(undefined);

					// If flags have been requested, see if they're set
					if (flags.length) {
						for (i = 0; i < flags.length; i++) {

							if (flags[i] === undefined) {
								continue;
							}

							granted = granted && modelFlags[flags[i]];

							if (!granted) {
								break;
							}
						}
					}

					if (!granted) {
						delete entries[index];
					}
				});

				entries.clean(undefined);
			});
		} else {
			modelFlags = {delete: true, write: true, create: true, read: true};
		}

		render.viewVars.chimeraModuleActions = actions;
		render.viewVars.chimeraModuleActionLists = lists;
		render.viewVars.modelFlags = modelFlags;
	};

	/**
	 * Return the allowed fields as a clone
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}      model
	 * @param    {Function}   callback
	 */
	this.getAllowedFields = function getAllowedFields(model, callback) {

		var that        = this,
		    AclRule     = this.getModel('AclRule'),
		    clone       = alchemy.cloneSafe(model._modelEditorSettings);

		// Get all the field flags for this model and its associations
		AclRule.getAllFields(model, function(err, fieldFlags) {

			var groupName;

			if (err) {
				return callback(err);
			}

			// Only apply to model objects
			if (Model.isModel(model)) {

				// Apply to group fields
				for (groupName in clone.groups) {
					that.applyAclFlags(clone.groups[groupName].fields, fieldFlags);
				}

				// Apply to index fields
				that.applyAclFlags(clone.fields.index.fields, fieldFlags);

				// Apply to edit fields
				that.applyAclFlags(clone.fields.edit.base, fieldFlags);
			}

			// Callback with the groups and fields
			callback(null, clone.groups, clone.fields, fieldFlags);
		});
	};

	/**
	 * Apply acl field flags to given array of fields.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Array}    fields
	 * @param    {Object}   fieldFlags
	 */
	this.applyAclFlags = function applyAclFlags(fields, fieldFlags) {

		// Create the function to use in the iteration
		var applier = this.createAclApplier(fieldFlags);

		// Iterate over every field, this will remove disallowed ones
		fields.forEach(applier);

		// Remove the empty entries (because we used delete, not splice)
		fields.clean(undefined);
	};

	/**
	 * Create a function that can be used to apply acl settings to fields.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 *
	 * @param    {Object}   fieldFlags
	 *
	 * @return   {Function}
	 */
	this.createAclApplier = function createAclApplier(fieldFlags) {

		return function applyAclSettings(field, index, arr) {

			var setting = Object.path(fieldFlags, field.fieldPath || field.field);

			if (field.chimeraType == 'association') {
				if (setting) {
					setting = setting.__modelFlags;
				}
			}

			if (!setting || !setting.read) {
				delete arr[index];
			} else {
				if (!setting.write) {
					field.disabled = true;
				}
			}
		};
	};
	
	/**
	 * Return all the fields from the given editorSettings object.
	 * This returns the original reference and does not clone anything.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   editorSettings
	 *
	 * @return   {Array}
	 */
	this.getAllFields = function getAllFields(editorSettings) {

		var allFields = [],
		    groupName,
		    setting,
		    fields,
		    field,
		    group,
		    i;

		// Iterate over every defined group
		for (groupName in editorSettings.groups) {

			group = editorSettings.groups[groupName];

			for (i = 0; i < group.fields.length; i++) {
				allFields.push(group.fields[i]);
			}
		}

		// Iterate over index fields
		fields = editorSettings.fields.index.fields;

		for (i = 0; i < fields.length; i++) {
			allFields.push(fields[i]);
		}

		// Iterate over edit fields
		fields = editorSettings.fields.edit.base;

		for (i = 0; i < fields.length; i++) {
			allFields.push(fields[i]);
		}

		return allFields;
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

		origin.preloadEditorSettings(context, piece, function(err, groups, fields, fieldFlags) {
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

		origin.preloadEditorSettings(context, piece, function(err, groups, fields, fieldFlags) {
			callback(err, alchemy.cloneSafe(groups));
		});
	};

	/**
	 * Get the model editor settings for a certain field
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   fieldName     The name of the field to process
	 * @param    {Object}   defaultObj    The optional object containing the blueprint
	 *
	 * @return   {Object}                 The result object
	 */
	this.convertBlueprintField = function convertBlueprintField(fieldName, defaultObj) {

		var fieldInfo = alchemy.getFieldInfo(fieldName, defaultObj);

		// If no modelname was found, or it matches the given object,
		// return the blueprint info using that object
		if (!fieldInfo.modelName || fieldInfo.modelName == defaultObj.modelName) {
			return this._convertBlueprintField(defaultObj, fieldInfo.field);
		}

		return this._convertBlueprintField(Model.get(fieldInfo.modelName), fieldInfo.field);
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
	this._convertBlueprintField = function convertBlueprintField(model, fieldName) {

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
						groups.translations.fields[i] = this.convertBlueprintField(temp, model);
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
		    tempGroups  = {},
		    fieldInfo,
		    groupName,
		    useModel,
		    group,
		    field,
		    temp,
		    i;

		if (!result) {
			result = {};
		}

		// Inject the groups into the temporary object
		alchemy.inject(tempGroups, groups);

		// Also add the index fields as a temporary group
		if (Object.path(model, 'modelIndex.fields.length')) {
			tempGroups.__index__ = {group: model.modelIndex};
		}

		for (groupName in tempGroups) {

			group = tempGroups[groupName].group;

			tempGroup = {};
			tempGroup.title = tempGroups[groupName].title;
			tempGroup.fields = [];

			for (i = 0; i < group.fields.length; i++) {

				entry = group.fields[i];

				if (typeof entry == 'string') {

					if (model.aliasAssociations[entry]) {

						entry = {
							chimeraType: 'association',
							field: entry,
							type: 'hasMany',
							assoc: alchemy.cloneSafe(model.aliasAssociations[entry])
						};

					} else {

						// Get the model & field name
						fieldInfo = this.getFieldInfo(entry, model);

						// Use this model for reference
						useModel = fieldInfo.model;

						// Convert the blueprint setting
						entry = this._convertBlueprintField(useModel, fieldInfo.field);

						// Store the alias
						entry.modelAlias = fieldInfo.alias;

						// Store the field path
						if (fieldInfo.alias) {
							entry.fieldPath = fieldInfo.alias + '.' + fieldInfo.field;
						} else {
							entry.fieldPath = fieldInfo.field;
						}

						entry.chimeraType = 'field';
					}

					group.fields[i] = entry;
				} else {

					if (!entry.modelAlias) {
						entry.modelAlias = model.modelName;
					}

					if (!entry.fieldPath) {
						if (entry.chimeraType == 'association') {
							entry.fieldPath = entry.field;
						} else {
							if (entry.modelAlias) {
								entry.fieldPath = entry.modelAlias + '.' + entry.field;
							} else {
								entry.fieldPath = entry.field;
							}
						}
					}

					if (!entry.chimeraType) {
						entry.chimeraType = 'field';
					}

					// @todo: set correct usemodel
					useModel = model;
				}

				if (entry.chimeraType == 'field') {
					entry.modelName = useModel.modelName;

					// Get the correct blueprint
					blueprint = useModel.blueprint;

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
						if (field && field.title) {
							temp.title = field.title;
						} else if (model.translatableTitles) {
							temp.title = __('fieldTitles', temp.field.humanize());
						} else {
							temp.title = temp.field.humanize();
						}
					}

					// Make sure the path is valid or false
					temp.path = temp.path || false;
					temp.name = temp.field;

					if (field && field.type) {
						temp.dataType = field.type;
					}
				} else {
					// Clone the entry into a new object
					temp = alchemy.inject({}, entry);
				}

				// Add this field to this group's fields
				tempGroup.fields.push(temp);
			}

			// Store this group in the model
			if (groupName !== '__index__') {
				result[groupName] = tempGroup;
			}
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

	/**
	 * Return the FieldType name of the given field
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|Object}   field
	 * @param    {Model}           model
	 *
	 * @return   {Object}
	 */
	this.getFieldConfig = function getFieldConfig(field, model) {

		var fieldEntry,
		    groupName,
		    fieldInfo,
		    blueprint,
		    result,
		    group,
		    name,
		    i;

		// Get the complete field information
		if (typeof field == 'string') {
			fieldInfo = this.getFieldInfo(field, model);
		} else {
			fieldInfo = field;
		}

		if (fieldInfo.model.modelEdit) {
			for (groupName in fieldInfo.model.modelEdit) {
				group = fieldInfo.model.modelEdit[groupName];

				if (!Array.isArray(group.fields)) {
					continue;
				}

				for (i = 0; i < group.fields.length; i++) {

					fieldEntry = group.fields[i];

					if (fieldEntry && typeof fieldEntry == 'object') {

						if (fieldEntry.field == fieldInfo.field || fieldEntry.field == fieldInfo.fieldPath) {
							result = fieldEntry;
							if (result) break;
						}
					}
				}

				if (result) break;
			}
		}

		if (!result && fieldInfo.model.modelIndex && Array.isArray(fieldInfo.model.modelIndex.fields)) {
			for (i = 0; i < fieldInfo.model.modelIndex.fields.length; i++) {
				fieldEntry = fieldInfo.model.modelIndex.fields[i];

				if (fieldEntry && typeof fieldEntry == 'object') {

					if (fieldEntry.field == fieldInfo.field || fieldEntry.field == fieldInfo.fieldPath) {
						result = fieldEntry;
						
						if (result) break;
					}
				}
			}
		}

		if (!result && fieldInfo.model.blueprint) {
			blueprint = fieldInfo.model.blueprint;
			
			for (name in blueprint) {
				fieldEntry = blueprint[name];
				
				if (name == fieldInfo.field) {
					result = fieldEntry;
				}
			}
		}

		if (typeof result == 'string') {
			result = {
				field: fieldInfo.field,
				type: result,
				name: fieldInfo.field,
				dataType: result
			};
		}
		
		return result;
	};

	/**
	 * Generate an array containing conditions for all the fields
	 * in the given model
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   query
	 * @param    {Model}    model
	 *
	 * @return   {Array}
	 */
	this.searchAllFields = function searchAllFields(query, model) {

		var fieldName,
		    filters,
		    filter,
		    fields,
		    field;

		if (typeof model == 'string') {
			model = Model.get(model);
		}

		if (model.modelSearch) {
			fields = model.modelSearch;
		} else {
			fields = Object.keys(model.blueprint);
		}

		filters = [];

		fields.forEach(function(fieldName) {

			field = alchemy.getFieldInfo(fieldName, model);

			filter = {
				fieldPath: field.alias + '.' + field.field,
				condition: 'like',
				value: query
			};

			filters.push(filter);
		});

		return filters;
	};

	/**
	 * Get field information
	 */
	this.getFieldInfo = function getFieldInfo(field, model) {

		var fieldInfo = alchemy.getFieldInfo(field, model),
		    modelName,
		    assoc,
		    field;

		field = fieldInfo.field;

		if (fieldInfo.alias && fieldInfo.alias != model.modelName) {

			assoc = model.aliasAssociations[fieldInfo.alias];

			if (assoc) {
				modelName = assoc.modelName;
			} else {
				modelName = fieldInfo.alias;
			}

			// @todo: get the model for the alias! 
			model = model.getModel(modelName);
		}

		return {
			alias: fieldInfo.alias,
			model: model,
			field: field,
			fieldPath: fieldInfo.alias + '.' + field
		};
	};
});