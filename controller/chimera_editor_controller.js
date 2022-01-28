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
 * @version  1.0.1
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
	}

	if (title) {
		window_title += title;
	}

	page_title = title;

	this.set('page_title', page_title);
	this.set('window_title', window_title || page_title);
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
 * @version  1.0.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 */
Editor.setAction(async function add(conduit, model_name) {

	let model = this.getModel(model_name);

	model.translateItems = false;

	if (conduit.method == 'post') {

		let record = model.createDocument();

		record.setDataRecord(conduit.body[model_name]);

		try {
			await record.save();

			let url = alchemy.routeUrl('Chimera.Editor#edit', {
				model: model_name,
				pk: record.$pk,
				message: 'added'
			});

			return conduit.redirect(url);
		} catch (err) {
			// @TODO: set this in the context somehow?
			this.set('record_violations', err);

			this.set('context_variables', {
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

	this.render('chimera/widgets');
});

/**
 * The edit action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.0.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 * @param    {String}    pk_val
 */
Editor.setAction(async function edit(conduit, model_name, pk_val) {

	let model = this.getModel(model_name);

	model.translateItems = false;

	let record = await model.findByPk(pk_val);
	let message_type = conduit.param('message');

	this.set('context_variables', {
		record : record
	});

	if (conduit.method == 'post') {

		Object.assign(record, conduit.body[model_name]);

		try {
			await record.save();
			message_type = 'saved';
		} catch (err) {
			// @TODO: set this in the context somehow?
			this.set('record_violations', err);
		}
	}

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

	this.set('widget_config', widget_config);
	this.setTitle(model.constructor.title + ' Edit');

	this.render('chimera/widgets');
});

/**
 * The records API action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    model_name
 */
Editor.setAction(async function records(conduit, model_name) {

	let body = conduit.body,
	    model = this.getModel(model_name),
	    crit = model.find();

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

			val = RegExp.interpretWildcard('*' + val + '*');
			crit.where(key).equals(val);
		}
	}

	let records = await model.find('all', crit),
	    result = [],
	    record,
	    main;

	for (record of records) {

		record.$hold.actions = [
			{
				name : 'edit',
				icon : 'edit',
				url  : alchemy.routeUrl('Chimera.Editor#edit', {
					model : model_name,
					pk    : record.$pk,
				})
			}
		];
	}

	conduit.end({
		records : records
	});
});