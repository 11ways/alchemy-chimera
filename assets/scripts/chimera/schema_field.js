/**
 * The Schema ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var SchemaChimeraField = Function.inherits('ChimeraField', function SchemaChimeraField(options) {

	var that = this,
	    value = options.value,
	    base;

	// @todo: this is probably breaking array support for schema's
	if (Array.isArray(value)) {
		value = value[0];
	}

	// Make sure the fields exist inside the value object
	if (!value) {

		// Prepare the new value object
		value = {fields: []};

		// Get the original value of the parent wrapper
		base = Object.first(options.parent.original_value);

		if (base && base.fields) {
			// Copy over the fields, but not the value
			base.fields.forEach(function eachField(entry) {
				value.fields.push({field: entry.field});
			});
		}
	}

	options.value = value;

	SchemaChimeraField.super.call(this, options);

	// Newly created ChimeraField instances of the subschema
	// will be stored in this array
	this.fields = [];
});

/**
 * The linked field, if any
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.4.0
 * @version  0.4.0
 */
SchemaChimeraField.setProperty(function linked_field() {

	var siblings,
	    pieces,
	    field,
	    path,
	    i;

	path = this.field.fieldType.options.schema;

	if (typeof path != 'string') {
		return null;
	}

	pieces = path.split('.');

	// Get the siblings
	siblings = this.container.parentElement.children;

	for (i = 0; i < siblings.length; i++) {

		// Ignore ourselves
		if (siblings[i] == this.container) {
			continue;
		}

		field = siblings[i].CFWrapper;

		if (field.name == pieces[0]) {
			return field;
		}
	}
});

/**
 * Initialize the field
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {Mixed}   value
 */
SchemaChimeraField.setMethod(function initEdit() {

	var that = this,
	    containers,
	    class_name,
	    urlparams,
	    selector,
	    recordId,
	    Router,
	    linked,
	    temp,
	    url,
	    i;

	// Get all the field containers that are direct descendents of this schema,
	// but not further (not a schema in a schema)
	if (this.is_local_add) {
		selector = '.chimeraField-container';

		// Get the very first container
		temp = this.entry.querySelector(selector);

		if (temp) {
			for (i = 0; i < temp.classList.length; i++) {
				if (temp.classList[i].startsWith('nid-')) {
					class_name = temp.classList[i].after('nid-');
					break;
				}
			}

			if (class_name) {
				selector += '.nid-' + class_name;
			}
		}

	} else {
		selector = '.chimeraField-container.nid-' + this.parent.entries_id;
	}

	// Get all the containers
	containers = Array.cast(this.entry.querySelectorAll(selector));

	// Filter out any non-container elements
	containers = containers.filter(function eachElement(element) {
		return element.matches('.chimeraField-container');
	});

	containers.forEach(function eachContainer(element, index) {

		var instance,
		    options,
		    config,
		    entry;

		entry = that.value.fields[index];
		config = entry.field;

		// Construct the wrapper options
		options = {
			nested_in: that,
			variables: that.variables,
			container: element,
			viewname: config.viewname,
			value: entry.value,
			field: entry.field
		};

		// Create a new wrapper instance
		instance = new ChimeraFieldWrapper(options);

		that.fields.push(instance);
	});

	// Get the optional linked field
	linked = this.linked_field;

	if (!linked) {
		return;
	}

	Router = new hawkejs.constructor.helpers.Router();

	urlparams = this.variables.__urlparams || {};

	if (urlparams.id) {
		recordId = urlparams.id;
	} else {
		recordId = Object.path(this.variables, 'item.value.id');
	}

	if (!recordId) {
		recordId = Object.path(this.variables, 'data.root_id');

		if (!recordId) {
			recordId = this.variables.__recordId || "000000000000000000000000";
		}
	}

	url = Blast.Collection.URL.parse(Router.routeUrl('RecordAction', {
		controller: 'editor',
		subject: this.field.model_name || this.modelName || this.variables.modelName,
		action: 'related_data',
		id: recordId
	}));

	if (this.nested_path) {
		url.addQuery('nested_in', this.nested_path);
	}

	url.addQuery('fieldpath', this.field.path);

	linked.on('change', function onChange() {

		var target_url,
		    value,
		    data;

		data = linked.getData();

		if (!data) {
			return;
		}

		value = data[linked.name];

		target_url = url.clone();
		target_url.addQuery('path_of_new_value', linked.getFullPath());
		target_url.addQuery('new_value', value);

		hawkejs.scene.fetch(target_url, {}, function gotResult(err, data) {

			if (err) {
				throw err;
			}

			// Remove the original field, this has to happen before adding the
			// new field, because otherwise multiple indexes exist and it screws up
			that.remove(true);

			that.parent.setPrefixValue(data, that.index, that.prefix);

			// Unlisten to change event
			linked.removeListener('change', onChange);
		});
	});
});

/**
 * Get the data from the subschema
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 */
SchemaChimeraField.setMethod(function getData() {

	var that = this,
	    result = {};

	this.fields.forEach(function eachField(field) {
		Object.merge(result, field.getData());
	});

	return result;
});