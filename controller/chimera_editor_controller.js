/**
 * The Chimera Editor Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.2.0
 */
var Editor = Function.inherits('ChimeraController', function EditorChimeraController(conduit, options) {

	EditorChimeraController.super.call(this, conduit, options);

	this.addComponent('paginate');

	this.addAction('model', 'index', {title: 'List'});
	this.addAction('model', 'add');

	this.addAction('draft', 'save', {handleManual: true});

	this.addAction('record', 'edit');
	this.addAction('record', 'view');
	this.addAction('record', 'save', {handleManual: true});

});

/**
 * The index action
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function index(conduit) {
	return this.listing(conduit, 'list', 'index');
});

/**
 * The generic listing method
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function listing(conduit, type, view) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = Model.get(modelName),
	    chimera = model.behaviours.chimera;

	if (view == null) {
		view = type;
	}

	var actionFields = chimera.getActionFields(type),
	    general = actionFields.getGroup('general'),
	    sorted = general.getSorted(false);

	var fields = [];

	for (var i = 0; i < sorted.length; i++) {
		fields.push(sorted[i].path);
	}

	this.components.paginate.find(model, {fields: fields}, function(err, items) {

		if (err) {
			return conduit.error(err);
		}

		actionFields.processRecords('general', model, items, function groupedRecords(err, results) {

			if (err) {
				return conduit.error(err);
			}

			that.conduit.set('fields', general);
			that.conduit.set('records', results.general);
			that.conduit.set('actions', that.getActions());
			that.conduit.set('modelName', modelName);
			that.conduit.internal('modelName', modelName);
			that.conduit.set('pageTitle', modelName.humanize());

			that.render('chimera/editor/' + view);
		});
	});
});

/**
 * The add action
 *
 * @param   {Conduit}   conduit
 */
Editor.setMethod(function add(conduit) {

	var that = this,
	    modelName = conduit.routeParam('subject'),
	    model = Model.get(modelName),
	    chimera = model.behaviours.chimera;

	var actionFields = chimera.getActionFields('edit'),
	    groups = actionFields.groups.clone();

	var item = model.compose(),
	    id = item._id;

	actionFields.processRecords(model, [item], function groupedRecords(err, groups) {

		if (err) {
			pr(err);
		}

		that.set('groups', groups);
		that.set('actions', that.getActions());
		that.set('modelName', modelName);
		that.set('pageTitle', modelName.humanize());
		that.internal('modelName', modelName);
		that.internal('recordId', id);

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
	    model = Model.get(modelName),
	    chimera = model.behaviours.chimera,
	    id = conduit.routeParam('id');

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

			pr('Group fields:')
			console.log(groups.general[0].fields);
			//console.log(groups.general[0].fields[1].field)

			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('pageTitle', modelName.humanize());
			that.internal('modelName', modelName);
			that.internal('recordId', id);

			that.render('chimera/editor/edit');
		});
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
	    model = Model.get(modelName),
	    chimera = model.behaviours.chimera,
	    id = conduit.routeParam('id');

	var actionFields = chimera.getActionFields('view'),
	    groups = actionFields.groups.clone();

	model.find('first', {conditions: {_id: alchemy.castObjectId(id)}}, function(err, items) {

		actionFields.processRecords(model, items, function groupedRecords(err, groups) {

			if (err) {
				pr(err);
			}

			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('pageTitle', modelName.humanize());
			that.internal('modelName', modelName);
			that.internal('recordId', id);

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

	modelName = conduit.routeParam('subject');
	model = Model.get(modelName);

	chimera = model.behaviours.chimera;
	data = conduit.body.data;
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

	model.save(record, options, function afterSave(err) {
		that.edit(conduit);
	});
});