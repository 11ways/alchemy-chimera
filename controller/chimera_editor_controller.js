/**
 * The Chimera Editor Controller class
 *
 * @author        Jelle De Loecker   <jelle@elevenways.be>
 * @since         0.2.0
 * @version       1.0.0
 */
const Editor = Function.inherits('Alchemy.Controller.Chimera', 'Editor');

/**
 * Set the title
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.1
 * @version  1.2.4
 *
 * @param    {String}    title
 */
Editor.setMethod(function setTitle(title) {

	let window_title,
	    page_title;

	if (alchemy.plugins.chimera.title) {
		window_title = alchemy.plugins.chimera.title || '';

		if (title && window_title) {
			window_title += ' | ';
		}
	} else {
		window_title = '';
	}

	if (title) {
		window_title += title;
	}

	page_title = title;

	this.set('page_title', page_title);
	this.set('window_title', window_title || page_title);
	this.toolbar_manager.title = page_title;
});

/**
 * Set the context document
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.2.4
 * @version  1.2.4
 *
 * @param    {Document}    doc
 */
Editor.setMethod(function setContextDocument(doc) {
	let document_watcher = this.toolbar_manager.setDocument(doc);
	this.toolbar_manager.setModel(doc.$model_name);
	document_watcher.addWatcher(this.conduit);
});

/**
 * The index action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.0.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 */
Editor.setAction(function index(conduit, model_name) {

	let model = this.getModel(model_name);

	let widget_config = model.chimera.getWidgetConfig('index', conduit);

	this.setTitle(model_name.titleize());

	this.set('model_name', model_name);

	this.set('widget_config', widget_config);

	this.render('chimera/editor/index');
});

/**
 * The add action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.2.7
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 */
Editor.setAction(async function add(conduit, model_name) {

	let model = this.getModel(model_name);

	model.translateItems = false;

	if (conduit.method == 'post') {

		let record = model.createDocument();

		record.setDataRecord(conduit.body);

		try {
			await record.save();

			let url = alchemy.routeUrl('Chimera.Editor#edit', {
				model: model_name,
				pk: record.$pk,
				message: 'added'
			});

			return conduit.redirect(url);
		} catch (err) {
			this.set('context_variables', {
				form_violations : err,
				record : record
			});
		}
	}

	let widget_config = model.chimera.getWidgetConfig('edit', conduit);

	if (!widget_config.class_names) {
		widget_config.class_names = [];
	}

	widget_config.class_names.push('chimera-editor-widgets');

	this.set('widget_config', widget_config);
	this.setTitle(model.constructor.title + ' Add');

	this.render('chimera/editor/add');
});

/**
 * The edit action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.2.7
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 * @param    {String}    pk_val
 */
Editor.setAction(async function edit(conduit, model_name, pk_val) {

	let model = this.getModel(model_name);

	model.translateItems = false;

	let record = await model.findByPk(pk_val);

	if (!record) {
		return conduit.notFound('Unable to find record with primary key "' + pk_val + '"');
	}

	let message_type = conduit.param('message');

	record.keepPrivateFields();

	let context_variables = {
		record,
	};

	if (conduit.method == 'post') {

		Object.assign(record, conduit.body);

		try {
			await record.save();
			message_type = 'saved';
		} catch (err) {
			context_variables.form_violations = err;
		}
	}

	this.set('context_variables', context_variables);

	let widget_config = model.chimera.getWidgetConfig('edit', conduit);

	if (!widget_config.class_names) {
		widget_config.class_names = [];
	}

	if (message_type) {
		if (message_type == 'added') {
			this.set('message', 'Record has been added');
		} else if (message_type == 'saved') {
			this.set('message', 'Record has been saved');
		}
	}

	widget_config.class_names.push('chimera-editor-widgets');

	if (model.chimera.record_preview) {
		this.set('add_preview_button', true);
	}

	this.setContextDocument(record);

	this.set('record_pk', record.$pk);
	this.set('model_name', model.model_name.toLowerCase());
	this.set('widget_config', widget_config);
	this.setTitle(model.constructor.title + ' Edit');

	this.render('chimera/editor/edit');
});

/**
 * The preview action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.2.3
 * @version  1.2.3
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 * @param    {String}    pk_val
 */
Editor.setAction(async function preview(conduit, model_name, pk_val) {

	let model = this.getModel(model_name);
	const action_name = model?.chimera?.record_preview_action;

	if (!action_name) {
		return conduit.notFound();
	}

	let record = await model.findByPk(pk_val);

	if (!record) {
		return conduit.notFound();
	}

	const controller = Controller.get(model.chimera.record_preview_controller, conduit);

	console.log(conduit.view_render.variables);

	if (!controller) {
		return conduit.notFound();
	}

	console.log('URLPARAMS:', controller.view_render?.variables?.__urlparams)

	controller.doAction(action_name, [conduit, record]);
});

/**
 * The trash action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.4
 * @version  1.0.4
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 * @param    {String}    pk_val
 */
Editor.setAction(async function trash(conduit, model_name, pk_val) {

	let model = this.getModel(model_name);

	model.translateItems = false;

	let record = await model.findByPk(pk_val);

	if (!record) {
		return conduit.notFound();
	}

	let index_url = alchemy.routeUrl('Chimera.Editor#index', {
		model : model_name
	});

	if (conduit.method == 'post') {
		await record.remove();
		conduit.redirect(index_url);
		return;
	}

	let referer = conduit.headers.referer || index_url;

	this.set('back_url', referer);
	this.set('record', record);
	this.render('chimera/editor/trash');
});

/**
 * The records API action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.2.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 */
Editor.setAction(async function records(conduit, model_name) {

	let body = conduit.body,
	    model = this.getModel(model_name),
	    crit = model.find();
	
	model.disableTranslations();

	let page_size = body.page_size,
	    fields = body.fields,
	    page = body.page;

	if (fields) {

		// @TODO: fix FieldSet being sent with regular json?
		if (fields.fields) {
			fields = fields.fields;
		}

		crit.select(fields);
	}

	if (page_size && !page) {
		page = 1;
	}

	if (page) {
		crit.page(page, page_size);
	}

	if (body.sort && body.sort.field && body.sort.dir) {
		crit.sort([body.sort.field, body.sort.dir]);
	}

	if (body.filters) {
		let key,
		    val;

		for (key in body.filters) {
			val = body.filters[key];

			// The value should always be a string,
			// so anything that is falsy can be ignored
			if (!val) {
				continue;
			}

			val = RegExp.interpretWildcard('*' + val + '*', 'i');
			crit.where(key).equals(val);
		}
	}

	let records = await model.find('all', crit),
	    result = [],
	    record,
	    main;
	
	records.keepPrivateFields();

	for (record of records) {

		let edit_action = new Classes.Alchemy.Form.Action.Url({
			name : 'edit',
			icon : 'edit',
			placement : ['row', 'context'],
			url       : alchemy.routeUrl('Chimera.Editor#edit', {
				model : model_name,
				pk    : record.$pk,
			})
		});

		let trash_action = new Classes.Alchemy.Form.Action.Url({
			name      : 'trash',
			icon      : 'trash',
			placement : ['context'],
			url       : alchemy.routeUrl('Chimera.Editor#trash', {
				model : model_name,
				pk    : record.$pk,
			})
		});

		record.$hold.actions = [
			edit_action,
			trash_action,
		];
	}

	conduit.end({
		records : records
	});
});