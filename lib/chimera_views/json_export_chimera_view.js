var async = alchemy.use('async'),
    AclDataTypes = alchemy.shared('Acl.dataTypes');


/**
 * The export page
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonExportChimeraView() {

	var nodeExcel = alchemy.use('excel-export');

	/**
	 * Get the model and set certain view variables
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
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
			
			//console.log(groups);
			//console.log(fieldInfo.field);
			
			// Get the field we need
			fields = that.getGroupFields(groups, fieldInfo.field);
			
			//console.log(fields);

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
	 * Build the export view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.build = function build(render, module, options) {

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
			search = false,
		    allfields = [],
			export_fields = [],
			languages = [];

		if (typeof options !== 'object') {
			options = {};
		}
		
		var languages_get = Prefix.all();
		for(var language in languages_get){
			languages.push(language);
		}
		render.viewVars.languages = languages;
				
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
				export_fields.push(value);
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
			
			//GLOBAL SEARCH
			if(Object.exists(render, 'req.body.data.'+modelName+'.search')){
				search = render.req.body.data[modelName]['search'];
			}
			render.viewVars.search = search;
			
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
			
			// Prepare tasks array for async functions
			var filterTasks = [],
			    filters;
				

			if(typeof filtersRaw != 'object'){
				filtersRaw = JSON.parse(filtersRaw);
			}
			
			if ((filtersRaw && typeof filtersRaw == 'object' && andorRaw) || search){

				filters = filtersRaw;
				render.viewVars.filters = filters;

				var andor = render.viewVars.andor = andorRaw,
				    baseFields = model._modelEditorSettings.fields.edit.base,
				    baseFieldObject = {};

				// Convert the baseFields array to an object
				baseFields.forEach(function(fieldInfo, index) {
					baseFieldObject[fieldInfo.field] = fieldInfo;
				});
				
				// If a search query has been given, search through all the fields in the model
				if (search) {
					andor = render.viewVars.andor = 'or';

					if(!filters) filters = [];

					filters = filters.concat(that.searchAllFields(search, model));
				}
				
				for (var i = 0; i < filters.length; i++) {
					(function(filter, index) {
						var fieldInfo = that.getFieldInfo(filter.fieldPath, model),
						    fieldConfig,
						    fieldType,
						    condition = filter.condition,
						    target,
						    temp,
						    j;

						if (!fieldInfo.model) {
							return;
						}

						if (fieldInfo.field == '__all') {
							
							temp = that.searchAllFields(filter.value, fieldInfo.model);

							for (j = 0; j < temp.length; j++) {
								filters.push(temp[j]);
							}
							
							return;
						}

						if (condition === 'like' || condition == 'is') {
							if (andor == 'or') {
								target = or;
							} else if (andor == 'and') {
								target = conditions;
							}
						} else if (condition === 'notlike' || condition == 'isnot') {
							target = not;
						}
						
						// Get the correct MEF instance associated with this field
						fieldConfig = that.getFieldConfig(fieldInfo, model);

						if (fieldConfig) {
							fieldType = module.getField(fieldConfig.fieldType || fieldConfig.type);
						} else {
							target['impossible'] = 'not_possible_value';
							return;
						}

						filterTasks[filterTasks.length] = function(next_task) {

							fieldType.getFilterValue({
								filter: filter,
								module: module,
								fieldName: fieldInfo.field,
								fieldConfig: fieldConfig,
								model: model
							}, function(match_value) {

								var key;


								if (match_value && typeof match_value === 'object' && match_value.__deep) {

									if (!target['$or']) {
										target['$or'] = {};
									}

									for (key in match_value.__deep) {
										target['$or'][fieldInfo.alias + '.' + key] = match_value.__deep[key];
									}

								} else {

									if(!target[fieldInfo.fieldPath]){
										target[fieldInfo.fieldPath] = [];
									}

									// Add the value to the array (merge arrays if an array is given)
									target[fieldInfo.fieldPath] = target[fieldInfo.fieldPath].concat(match_value);
								}
								
								next_task();
							});
						};
					}(filters[i], i));
				}
			}
			/****************************
			 * END FILTER, BEGIN RENDER *
			 ****************************/

			async.series(filterTasks, function() {

				render.res.cookie(lowerModelName + '_filters', filtersRaw);
				render.res.cookie(lowerModelName + '_andor', andorRaw);

				if (!Object.isEmpty(or)) {
					conditions['$or'] = or;
				}
				if (!Object.isEmpty(not)) {
					conditions['$not'] = not;
				}
				if (!Object.isEmpty(and)) {
					conditions['$and'] = and;
				}

				if (render.get) {
					// Render the default view
					render('chimera/json_export');
				} else if (render.post) {
					if(render.req.body.data[modelName]['language']){
						language = render.req.body.data[modelName]['language'];
					}
					if(render.req.body.data[modelName]['fields'] !== '[]'){
						export_fields = JSON.parse(render.req.body.data[modelName]['fields']);
					}

					log.verbose('Going to look for records for Excel generation');

					model.find('all', {fields: export_fields, conditions: conditions}, function(err, results) {

						log.verbose('Got records for Excel generation, nr of records: ' + (results || []).length);

						if (!err) {
							var columns = [];
							var result_rows = [];
							var caption_arr = [];
							var caption = "";
							for (var i in export_fields){
								caption_arr = export_fields[i].split('.');
								caption = caption_arr[1].humanize() +' | '+caption_arr[0];
								var obj = {caption: caption, type:'string'};
								columns.push(obj);
							}

							delete(results['available']);

							for( var i in results){
								var result = results[i];
								var row = [];
								var model_field = [];
								var result_field;
								for (var e in export_fields){
									model_field = export_fields[e].split('.');
									if(result[model_field[0]]){
										result_field = result[model_field[0]][model_field[1]];
										if(result_field=='undefined' || result_field==undefined){
											row.push('');
										} else if(result_field[language] || result_field[language] == '') {
											row.push(result_field[language]);
										} else {
											row.push(result_field);
										}
									} else {
										row.push('');
									}
								}
								result_rows.push(row);
							}

							var conf = {};
							//conf.stylesXmlFile = "styles.xml";
							conf.cols = columns;
							conf.rows = result_rows;

							log.verbose('Going to render Excel file');

							var result = nodeExcel.execute(conf);

							log.verbose('Excel file has been rendered');

							// @todo: integrate this in alchemy
							if (render.req.query._hawkejsAjaxFormTracker) {
								// Set a temporary cookie for tracking the download progress of this form submit
								render.res.cookie(render.req.query._hawkejsAjaxFormTracker, true, {maxAge: 1000*60*5});
							}

							// @todo: make it easier to do this in alchemy itself
							render.res.writeHead(200, {'Content-Type': 'application/vnd.openxmlformats', 'Content-Disposition':"attachment; filename=" + modelName + "_export.xlsx"});
							render.res.end(result, 'binary');

						} else {
							render('chimera/json_export');
						}
					});
				}
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

				if (!Field) return;

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

					if (model.translatableTitles) {
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
						temp.title = temp.field.humanize();
					}

					if (model.translatableTitles) {
						temp.title = __('fieldTitles', temp.field.humanize());
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