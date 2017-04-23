/**
 * The Chimera Editor Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.2.0
 */
var Editor = Function.inherits('Alchemy.ChimeraController', function EditorChimeraController(conduit, options) {

	EditorChimeraController.super.call(this, conduit, options);

	this.addComponent('paginate');

	this.addAction('model', 'index', {title: 'Index', icon: '<x-svg data-src="chimera/list"></x-svg>'});
	this.addAction('model', 'add', {title: 'Add', icon: '<x-svg data-src="chimera/plus"></x-svg>'});

	this.addAction('model-list', 'add', {title: 'Add', icon: '<x-svg data-src="chimera/plus"></x-svg>', route_name: 'ModelAction'});

	this.addAction('draft', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true});

	this.addAction('record', 'edit', {title: 'Edit', icon: '<x-svg data-src="chimera/edit"></x-svg>'});
	this.addAction('record', 'view', {title: 'View', icon: '<x-svg data-src="chimera/eye"></x-svg>'});
	this.addAction('record', 'remove', {title: 'Remove', icon: '<x-svg data-src="chimera/garbage"></x-svg>'});

	this.addAction('record-edit', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});
	this.addAction('record-edit', 'index', {title: 'Index', icon: '<x-svg data-src="chimera/list"></x-svg>', route_name: 'ModelAction'});
	this.addAction('record-edit', 'view', {title: 'View', icon: '<x-svg data-src="chimera/eye"></x-svg>', route_name: 'RecordAction'});
	this.addAction('record-edit', 'remove', {title: 'Remove', icon: '<x-svg data-src="chimera/garbage"></x-svg>', route_name: 'RecordAction'});

	this.addAction('record-draft', 'save', {title: 'Save', icon: '<x-svg data-src="chimera/floppy"></x-svg>', handleManual: true, route_name: 'RecordAction'});
	this.addAction('record-draft', 'index', {title: 'Index', icon: '<x-svg data-src="chimera/list"></x-svg>', route_name: 'ModelAction'});
	this.addAction('record-draft', 'view', {title: 'View', icon: '<x-svg data-src="chimera/eye"></x-svg>', route_name: 'RecordAction'});
	this.addAction('record-draft', 'remove', {title: 'Remove', icon: '<x-svg data-src="chimera/garbage"></x-svg>', route_name: 'RecordAction'});
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
Editor.setMethod(function index(conduit) {
	return this.listing(conduit, 'list', 'index');
});

/**
 * The generic listing method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.4.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    type
 * @param    {String}    view
 */
Editor.setMethod(function listing(conduit, type, view) {

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

	// Get the model title
	model_title = model_name.titleize();

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

	Function.parallel(function getTotal(next) {
		model.find('list', {fields: ['_id']}, function gotResult(err, list) {

			// Ignore errors here
			if (err) {
				return next();
			}

			that.conduit.set('available_records', list.available || 0);
			next();
		});
	}, function paginate(next) {

		var options = {
			fields    : fields,
			pageSize  : 10
		};

		// Find the paginated records
		that.components.paginate.find(model, options, function gotRecords(err, items) {

			if (err) {
				return next(err);
			}

			action_fields.processRecords('general', model, items, function groupedRecords(err, results) {

				if (err) {
					return next(err);
				}

				that.set('prefixes',           Prefix.getPrefixList());
				that.set('fields',             general);
				that.set('records',            results.general);
				that.set('actions',            that.getActions());
				that.set('show_index_filters', model.chimera.show_index_filters);

				that.set('model_title',        model_title);
				that.set('model_name',         model_name);
				that.internal('model_name',    model_name);

				// Deprecated modelName
				that.set('modelName',          model_name);
				that.internal('modelName',     model_name);

				next();
			});
		});

	}, function done(err) {

		if (err) {
			return conduit.error(err);
		}

		that.render('chimera/editor/' + view);
	});
});

/**
 * Create a field value
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function create_field_value(conduit, controller, subject, action) {

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
Editor.setMethod(function add(conduit) {

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

	// Get the model title
	model_title = model_name.titleize();

	// And the plural form
	model_plural = model_title.pluralize();

	// Disable translation behaviour of the model
	model.disableTranslations();

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
Editor.setMethod(function edit(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    id = conduit.routeParam('id');

	model.disableTranslations();

	var actionFields = chimera.getActionFields('edit'),
	    groups = actionFields.groups.clone();

	model.find('first', {conditions: {_id: alchemy.castObjectId(id)}}, function(err, items) {

		if (err) {
			return conduit.error(err);
		}

		if (!items.length) {
			return conduit.notFound();
		}

		actionFields.processRecords(model, items, function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('editor_action', 'edit');
			that.set('prefixes', Prefix.getPrefixList());
			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('display_field_value', items.getDisplayFieldValue({prefer: 'name'}));
			that.set('pagetitle', modelName.humanize() + ': Edit');
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
Editor.setMethod(function peek(conduit) {

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
	model.find('first', {conditions: {_id: id}}, function gotRecord(err, items) {

		if (err) {
			return conduit.error(err);
		}

		if (!items.length) {
			return conduit.notFound();
		}

		action_fields.processRecords(model, items, function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('editor_action', 'peek');
			that.set('prefixes', Prefix.getPrefixList());
			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', model_name);
			that.set('display_field_value', items.getDisplayFieldValue({prefer: 'name'}));
			that.internal('modelName', model_name);
			that.internal('recordId', id);

			that.render('chimera/editor/peek');
		});
	});

});

/**
 * Associated model data
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function model_assoc_data(conduit) {

	var model = Model.get(conduit.routeParam('subject')),
	    options;

	options = {
		fields: ['_id', 'title', 'name'].concat(model.displayField),
		document: false
	};

	model.find('list', options, function gotData(err, results) {

		var response;

		if (err) {
			return conduit.error(err);
		}

		response = {
			items: results,
			displayField: model.displayField
		};

		conduit.end(response);
	});
});

/**
 * The related_data action for a certain field
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function related_data(conduit) {

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
Editor.setMethod(function view(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    id = conduit.routeParam('id');

	model.disableTranslations();

	var actionFields = chimera.getActionFields('edit'),
	    groups = actionFields.groups.clone();

	model.find('first', {conditions: {_id: alchemy.castObjectId(id)}}, function(err, items) {

		if (err) {
			return conduit.error(err);
		}

		if (!items.length) {
			return conduit.notFound();
		}

		actionFields.processRecords(model, items, function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('editor_action', 'view');
			that.set('prefixes', Prefix.getPrefixList());
			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('pageTitle', modelName.humanize());
			that.internal('modelName', modelName);
			that.internal('recordId', id);
			that.internal('chimeraReadOnly', true);

			that.render('chimera/editor/view');
		});
	});
});

/**
 * The save action
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function save(conduit) {

	var that = this,
	    actionFields,
	    modelName,
	    chimera,
	    options,
	    groups,
	    record,
	    model,
	    data,
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
	record._id = alchemy.castObjectId(id);

	options = {};

	// Force create, even though an _id could be given
	if (conduit.body.create === true) {
		options.create = true;
	}

	model.save(record, options, function afterSave(err, result) {

		if (err != null) {
			conduit.flash('Could not save record: ' + err, {className: 'chimera-fail'});
			return conduit.error(err);
		}

		let route_params = Object.assign({}, conduit.params);
		route_params.action = 'edit';
		route_params.id = result._id;

		conduit.flash('Record has been saved', {className: 'chimera-success'});

		// When creating a new record we need to supply a new url,
		// because the 'history' will be activated
		// The redirect does remain internal, though!
		if (options.create) {
			return conduit.redirect({
				headers : conduit.headers,
				url     : Router.getUrl('RecordAction', route_params)
			});
		}

		that.edit(conduit);
	});
});

/**
 * The remove action
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function remove(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = this.getModel(modelName),
	    chimera = model.constructor.chimera,
	    id = conduit.routeParam('id');

	model.disableTranslations();

	if(conduit.body.sure === 'yes'){

		model.remove(alchemy.castObjectId(id), function(err) {

			if (err) {
				log.debug(err);
			}

			conduit.setHeader('x-history-url', '/chimera/editor/' + modelName + '/index');
			conduit.flash('Record has been removed', {className: 'chimera-success'});
			that.index(conduit);
			return;
		});

	} else {

		model.find('first', {conditions: {_id: alchemy.castObjectId(id)}}, function(err, items) {

			if (err) {
				return conduit.error(err);
			}

			if (!items.length) {
				return conduit.notFound();
			}

			that.set('editor_action', 'remove');
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('pageTitle', modelName.humanize());
			that.set('item', items[0]);
			that.internal('modelName', modelName);
			that.internal('recordId', id);

			that.render('chimera/editor/remove');

		});
	}

});