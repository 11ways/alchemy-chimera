var excel;

/**
 * The Chimera Editor Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.5.1
 */
var Editor = Function.inherits('Alchemy.Controller.Chimera', function Editor(conduit, options) {

	Editor.super.call(this, conduit, options);

	this.addComponent('paginate');

	this.addAction('model', 'index', {title: 'Index', icon: '<x-svg data-src="chimera/list"></x-svg>'});
	this.addAction('model', 'add', {title: 'Add', icon: '<x-svg data-src="chimera/plus"></x-svg>'});

	this.addAction('model-list', 'add', {
		title: 'Add',
		icon: '<x-svg data-src="chimera/plus"></x-svg>',
		route_name: 'ModelAction'
	});

	this.addAction('model-list', 'export', {
		title: 'Export',
		route_name: 'ModelAction'
	});

	this.addAction('draft', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true});

	this.addAction('record', 'edit', {title: 'Edit', icon: '<x-svg data-src="chimera/edit"></x-svg>'});
	this.addAction('record', 'view', {title: 'View', icon: '<x-svg data-src="chimera/eye"></x-svg>'});
	this.addAction('record', 'remove', {title: 'Remove', icon: '<x-svg data-src="chimera/garbage"></x-svg>'});

	this.addAction('record-edit', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});
	this.addAction('record-edit', 'saveClose', {title: 'Save and close', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});

	this.addAction('record-draft', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});
	this.addAction('record-draft', 'saveClose', {title: 'Save and close', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});
});

/**
 * The index action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Conduit}   conduit
 */
Editor.setAction(function index(conduit) {
	return this.doAction('listing', [conduit, 'list', 'index']);
});

/**
 * The export action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Conduit}   conduit
 */
Editor.setAction('export', async function _export(conduit) {

	var that = this,
	    model_plural,
	    model_title,
	    model_name,
	    chimera,
	    model;

	// Get the name of the model
	model_name = conduit.routeParam('subject');

	if (!model_name) {
		return conduit.error(new Error('No model name was given, nothing to list'));
	}

	// Get the actual model
	model = this.getModel(model_name);

	// And get the chimera instance
	chimera = model.constructor.chimera;

	if (chimera == null) {
		return conduit.error(new Error('Model "' + model_name + '" has no chimera configuration'));
	}

	if (!excel) {
		excel = alchemy.use('msexcel-builder');
	}

	if (model.constructor.title) {
		model_title = model.constructor.title;
	} else {
		// Get the model title
		model_title = model_name.titleize();
	}

	// And the plural form
	model_plural = model_title.pluralize();

	let action_fields = chimera.getActionFields('export');

	// Fallback to the "edit" one
	if (!action_fields || !(action_fields.length > 0)) {
		action_fields = chimera.getActionFields('edit');
	}

	let general       = action_fields.getGroup('general'),
	    fields        = general.getSorted(false),
	    i;

	let records = await model.find('all');

	if (!records.length) {
		return conduit.end('No records to export');
	}

	let filename = model_name + '_' + Date.now() + '.xlsx',
	    filepath = PATH_TEMP + '/' + filename,
	    workbook = excel.createWorkbook(PATH_TEMP, filename),
	    heading  = [],
	    config,
	    record,
	    field,
	    row = 1,
	    col = 0,
	    val;

	let sheet = workbook.createSheet('records', fields.length, records.length + 1);

	for (config of fields) {
		field = config.fieldType;
		col++;

		sheet.set(col, row, field.title.trim());
	}

	for (record of records) {
		col = 0;
		row++;

		for (config of fields) {

			field = config.fieldType;
			col++;

			val = await (new Pledge(function getVal(resolve, reject) {
				config.actionValue('list', record, function done(err, res) {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				})
			}));

			if (val == null) {
				val = '';
			}

			if (!Object.isPrimitive(val)) {
				if (Date.isDate(val)) {
					val = val.format('Y-m-d H:i:s');
				} else {
					val = String(val);
				}
			}

			if (typeof val == 'string') {
				val = val.trim();
			} else if (typeof val == 'boolean') {
				if (val === true) {
					val = 'Yes';
				} else if (val === false) {
					val = 'No';
				} else {
					val = '';
				}
			}

			sheet.set(col, row, val);
		}
	}

	workbook.save(function(ok) {

		// Ok is always false, whatever
		conduit.serveFile(filepath, {filename: filename});

	});
});

/**
 * The generic listing method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.6.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    type
 * @param    {String}    view
 */
Editor.setAction(function listing(conduit, type, view) {

	var that = this,
	    model_plural,
	    model_title,
	    model_name,
	    chimera,
	    model;

	// Get the name of the model
	model_name = conduit.routeParam('subject');

	if (!model_name) {
		return conduit.error(new Error('No model name was given, nothing to list'));
	}

	// Get the actual model
	model = this.getModel(model_name);

	// And get the chimera instance
	chimera = model.constructor.chimera;

	if (chimera == null) {
		return conduit.error(new Error('Model "' + model_name + '" has no chimera configuration'));
	}

	if (model.constructor.title) {
		model_title = model.constructor.title;
	} else {
		// Get the model title
		model_title = model_name.titleize();
	}

	// And the plural form
	model_plural = model_title.pluralize();

	// Disable translation behaviour of the model
	model.disableTranslations();

	// Set the page title
	this.setTitle(model_plural);

	if (view == null) {
		view = type;
	}

	let action_fields = chimera.getActionFields(type),
	    general       = action_fields.getGroup('general'),
	    sorted        = general.getSorted(false),
	    fields        = [],
	    i;

	for (i = 0; i < sorted.length; i++) {
		fields.push(sorted[i].path);
	}


	let options = {
		fields    : fields,
		pageSize  : action_fields.options.page_size || alchemy.plugins.chimera.page_size || 10
	};

	// Hacky way of stopping pagination
	if (action_fields.options.paginate === false) {
		options.pageSize = 999;
	}

	// Find the paginated records
	that.components.paginate.find(model, options, function gotRecords(err, items) {

		if (err) {
			return conduit.error(err);
		}

		that.conduit.set('available_records', items.available || 0);

		action_fields.processRecords('general', model, items, function groupedRecords(err, results) {

			if (err) {
				return conduit.error(err);
			}

			that.set('prefixes',           Prefix.getPrefixList());
			that.set('fields',             general);
			that.set('records',            results.general);
			that.set('actions',            that.getActions());
			that.set('show_index_filters', model.chimera.show_index_filters);

			that.set('model_title',        model_title);
			that.set('model_name',         model_name);
			that.set('model_plural',       model_plural);
			that.internal('model_name',    model_name);

			// Deprecated modelName
			that.set('modelName',          model_name);
			that.internal('modelName',     model_name);

			that.render('chimera/editor/' + view);
		});
	});
});

/**
 * Create a field value
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function create_field_value(conduit, controller, subject, action) {

	var that = this,
	    model = this.getModel(subject),
	    data = {name: conduit.body.text, title: conduit.body.text};

	model.save(data, function saved(err, doc) {

		if (err) {
			return conduit.error(err);
		}

		conduit.end({_id: doc._id});
	});
});

/**
 * The add action
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function add(conduit) {

	var that = this,
	    model_plural,
	    model_title,
	    model_name,
	    chimera,
	    model;

	// Get the name of the model
	model_name = conduit.routeParam('subject');

	if (!model_name) {
		return conduit.error(new Error('No model name was given, nothing to list'));
	}

	// Get the actual model
	model = this.getModel(model_name);

	// And get the chimera instance
	chimera = model.constructor.chimera;

	if (chimera == null) {
		return conduit.error(new Error('Model "' + model_name + '" has no chimera configuration'));
	}

	if (model.constructor.title) {
		model_title = model.constructor.title;
	} else {
		// Get the model title
		model_title = model_name.titleize();
	}

	// And the plural form
	model_plural = model_title.pluralize();

	// Disable translation behaviour of the model
	model.disableTranslations();

	this.set('referer', conduit.headers.referer);

	this.setTitle(model_title + ': Add');

	let action_fields = chimera.getActionFields('edit'),
	    groups        = action_fields.groups.clone(),
	    item          = model.compose(),
	    id            = item._id;

	action_fields.processRecords(model, [item], function groupedRecords(err, groups) {

		if (err) {
			throw err;
		}

		that.set('editor_action',      'add');
		that.set('prefixes',           Prefix.getPrefixList());
		that.set('groups',             groups);
		that.set('actions',            that.getActions());

		that.set('model_title',        model_title);
		that.set('model_name',         model_name);
		that.set('model_plural',       model_plural);
		that.internal('model_name',    model_name);
		that.internal('record_id',     id);

		// Deprecated variable names
		that.set('modelName',          model_name);
		that.internal('modelName',     model_name);
		that.internal('recordId',      id);

		that.render('chimera/editor/add');
	});
});

/**
 * The edit action
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function edit(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model_name = modelName,
	    model_plural,
	    model_title,
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    id = conduit.routeParam('id');

	model.disableTranslations();

	var actionFields = chimera.getActionFields('edit'),
	    groups = actionFields.groups.clone();

	let find_options = {
		conditions: {}
	};

	if (model.constructor.title) {
		model_title = model.constructor.title;
	} else {
		// Get the model title
		model_title = modelName.titleize();
	}

	// And the plural form
	model_plural = model_title.pluralize();

	find_options.conditions[model.primary_key] = id;

	if (model.display_field_select) {
		find_options.select = model.display_field_select.slice(0);
	}

	this.set('referer', conduit.headers.referer);

	model.find('first', find_options, function(err, item) {

		if (err) {
			return conduit.error(err);
		}

		if (!item) {
			return conduit.notFound();
		}

		actionFields.processRecords(model, [item], function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('editor_action', 'edit');
			that.set('prefixes', Prefix.getPrefixList());
			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('display_field_value', item.getDisplayFieldValue({prefer: 'name'}));
			that.set('pagetitle', modelName.humanize() + ': Edit');
			that.set('model_title',        model_title);
			that.set('model_name',         model_name);
			that.set('model_plural',       model_plural);
			that.internal('modelName', modelName);
			that.internal('recordId', id);

			that.render('chimera/editor/edit');
		});
	});
});

/**
 * The "peek" method
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function peek(conduit) {

	var that = this,
	    action_fields,
	    model_name,
	    chimera,
	    groups,
	    model,
	    id;

	model_name = conduit.routeParam('subject');
	model = this.getModel(model_name);
	chimera = model.constructor.chimera;
	id = conduit.routeParam('id');

	// Disable translations in the CMS
	model.disableTranslations();

	// Get the "peek" fields
	action_fields = chimera.getActionFields('peek');
	groups = action_fields.groups.clone();

	// Get the wanted record
	model.find('first', {conditions: {_id: id}}, function gotRecord(err, item) {

		if (err) {
			return conduit.error(err);
		}

		if (!item) {
			return conduit.notFound();
		}

		action_fields.processRecords(model, [item], function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('editor_action', 'peek');
			that.set('prefixes', Prefix.getPrefixList());
			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', model_name);
			that.set('display_field_value', item.getDisplayFieldValue({prefer: 'name'}));
			that.internal('modelName', model_name);
			that.internal('recordId', id);

			that.render('chimera/editor/peek');
		});
	});
});


/**
 * Reorder an array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.1
 * @version  0.5.1
 *
 * @param    {Array}    arr        The array to reorder
 * @param    {Object}   query      The query that should match the entries
 * @param    {Number}   new_index  The new index this should be moved to
 */
function reorderByQuery(arr, query, new_index, path) {

	let entry = arr.findByPath(query);

	if (!entry) {
		return;
	}

	arr.move(entry, new_index);

	let i;

	for (i = 0; i < arr.length; i++) {
		Object.setPath(arr[i], path, i);
	}
};

/**
 * The "reorder" method
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(async function reorder(conduit) {

	var that = this,
	    model_name,
	    new_index,
	    model,
	    id;

	new_index = Number(conduit.param('new_index'));
	model_name = conduit.routeParam('subject');
	model = this.getModel(model_name);
	id = conduit.routeParam('id');

	let record = await model.findById(id);
	let records = await model.find('all', {fields: ['_id', 'order']});

	records = Array.cast(records);

	reorderByQuery(records, {_id: String(id)}, new_index, 'order');

	for (let i = 0; i < records.length; i++) {
		if (!records[i].hasChanged()) {
			continue;
		}

		await records[i].save();
	}

	conduit.end({saved: true});
});

/**
 * Associated model data
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(async function model_assoc_data(conduit) {

	var options,
	    model = Model.get(conduit.routeParam('subject'));

	let criteria = model.find(),
	    pagination,
	    is_select2 = false,
	    page_limit = conduit.param('page_limit'),
	    page = conduit.param('page');

	if (page_limit) {
		criteria.limit(page_limit);

		if (page) {
			is_select2 = true;
		}

		if (page > 1) {
			criteria.skip(page_limit * (page - 1));
		}
	}

	let q = conduit.param('q');

	if (q) {
		let or = criteria.or();

		q = '/' + q + '/i';

		if (model.schema.has('name')) {
			criteria.where('name').contains(q);
		}

		if (model.schema.has('title')) {
			criteria.where('name').contains(q);
		}

		if (model.schema.has('description')) {
			criteria.where('description').contains(q);
		}

		if (model.schema.has('body')) {
			criteria.where('body').contains(q);
		}

		if (model.schema.has('slug')) {
			criteria.where('slug').contains(q);
		}
	}

	let records  = await model.find('all', criteria),
	    results  = [],
	    response = {};

	if (is_select2 && records.available > records.length) {
		pagination = {
			more: true
		};
	}

	for (let i = 0; i < records.length; i++) {
		let record = records[i];

		let entry = {
			_id : record._id
		};

		if (record[model.displayField]) {
			entry[model.displayField] = record[model.displayField];
		} else {
			entry.title = record.title;
			entry.name = record.name;
		}

		results.push(entry);
	}

	conduit.end({
		items        : results,
		displayField : model.displayField,
		pagination   : pagination
	});
});

/**
 * The related_data action for a certain field
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function related_data(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    options = {},
	    id = conduit.routeParam('id'),
	    field;

	if (conduit.param('display_field_only')) {
		options.display_field_only = true;
	}

	model.disableTranslations();

	// Some fields (like subschemas) require record info for related data
	model.find('first', {conditions: {_id: id}, document: false}, function gotResult(err, items) {

		var nested_in = conduit.param('nested_in'),
		    fieldpath = conduit.param('fieldpath');

		if (nested_in) {
			fieldpath = nested_in + '.' + fieldpath;
		}

		field = chimera.getField(fieldpath, items[0]);

		if (!field) {
			conduit.notFound(new Error('Could not find field "' + fieldpath + '"'));
		} else {
			field.sendRelatedData(conduit, items[0], options);
		}
	});
});

/**
 * The view action
 *
 * @todo: code is mostly alike to edit, merge together
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(async function view(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    id = conduit.routeParam('id');

	model.disableTranslations();

	var actionFields = chimera.getActionFields('edit'),
	    groups = actionFields.groups.clone();

	let item = await model.findById(id);

	if (!item) {
		return conduit.notFound();
	}

	actionFields.processRecords(model, [item], function groupedRecords(err, groups) {

		if (err) {
			return conduit.error(err);
		}

		that.set('editor_action', 'view');
		that.set('prefixes', Prefix.getPrefixList());
		that.set('groups', groups);
		that.set('actions', that.getActions());
		that.set('modelName', modelName);
		that.set('pageTitle', modelName.humanize());
		that.set('display_field_value', item.getDisplayFieldValue({prefer: 'name'}));
		that.internal('modelName', modelName);
		that.internal('recordId', id);
		that.internal('chimeraReadOnly', true);

		that.render('chimera/editor/view');
	});
});

/**
 * The save action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.5.1
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function save(conduit) {
	this.save(conduit, false);
});

/**
 * The save & close action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.1
 * @version  0.5.1
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(function saveClose(conduit) {
	this.save(conduit, true);
});

/**
 * Save a record
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.1
 * @version  0.6.0
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(async function save(conduit, go_to_index) {

	var that = this,
	    actionFields,
	    modelName,
	    chimera,
	    options,
	    groups,
	    record,
	    model,
	    data,
	    doc,
	    id;

	if (conduit.method != 'post') {
		return conduit.error('Use POST method to apply changes');
	}

	modelName = conduit.routeParam('subject');
	model = this.getModel(modelName);
	model.disableTranslations();

	chimera = model.constructor.chimera;
	data = conduit.body.data;

	if (!data) {
		return conduit.error('Data was not found in POST body');
	}

	id = conduit.routeParam('id');

	actionFields = chimera.getActionFields('edit');
	groups = actionFields.groups.clone();

	record = data[modelName.classify()];

	options = {};

	// Force create, even though an _id could be given
	if (conduit.body.create === true) {
		doc = model.createDocument(record);
		options.create = true;
	} else {
		doc = await model.findById(id);
		Object.assign(doc, record);
	}

	doc.save(null, options, function afterSave(err, result) {

		if (err != null) {
			conduit.flash('Could not save record: ' + err, {className: 'chimera-fail'});
			return conduit.error(err);
		}

		let route_params = Object.assign({}, conduit.params);

		conduit.flash('Record has been saved', {className: 'chimera-success'});

		if (go_to_index) {
			route_params.action = 'index';

			return conduit.redirect({
				headers : conduit.headers,
				url     : Router.getUrl('ModelAction', route_params)
			});
		}

		route_params.action = 'edit';
		route_params.id = result.$pk;

		// When creating a new record we need to supply a new url,
		// because the 'history' will be activated
		// The redirect does remain internal, though!
		if (options.create) {

			return conduit.redirect({
				headers : conduit.headers,
				url     : Router.getUrl('RecordAction', route_params)
			});
		}

		that.doAction('edit', [conduit]);
	});
});

/**
 * The remove action
 *
 * @param   {Conduit}   conduit
 */
Editor.setAction(async function remove(conduit) {

	var that = this,
	    model_name = conduit.routeParam('subject'),
	    model = this.getModel(model_name),
	    id = conduit.routeParam('id');

	model.disableTranslations();

	if (conduit.body.sure === 'yes') {
		model.remove(id, function onRemoved(err) {

			if (err) {
				return conduit.error(err);
			}

			conduit.setHeader('x-history-url', '/chimera/editor/' + model_name + '/index');
			conduit.flash('Record has been removed', {className: 'chimera-success'});

			let route_params = Object.assign({}, conduit.params);
			route_params.action = 'index';
			delete route_params.id;

			return conduit.redirect({
				headers : conduit.headers,
				url     : Router.getUrl('ModelAction', route_params)
			});
		});
	} else {

		let item = await model.findById(id);

		if (!item) {
			return conduit.notFound();
		}

		that.set('editor_action', 'remove');
		that.set('actions', that.getActions());
		that.set('modelName', model_name);
		that.set('pageTitle', model_name.humanize());
		that.set('item', item);
		that.set('display_field_value', item.getDisplayFieldValue({prefer: 'name'}));
		that.internal('modelName', model_name);
		that.internal('recordId', id);

		that.render('chimera/editor/remove');
	}

});