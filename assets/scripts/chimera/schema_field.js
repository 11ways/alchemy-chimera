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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
SchemaChimeraField.setMethod(function initEdit() {

	var that = this,
	    containers,
	    selector;

	// Get all the field containers that are direct descendents of this schema,
	// but not further (not a schema in a schema)
	// This is curently not used, as it does not work when adding new entries
	selector = '.chimeraField-container.nid-' + this.parent.entries_id;

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

	return;

	this.value.fields.forEach(function eachSchemaField(entry) {

		var instance,
		    options,
		    wrapper,
		    config = entry.field,
		    html;

		html = '<div class="chimeraField-row">';
		html += '<div class="chimeraField-left"><div class="chimeraField-label">' + config.fieldType.title + '</div></div>';
		html += '<div class="chimeraField-intake"></div>';
		html += '</div>';

		wrapper = Blast.parseHTML(html);

		// Add this new wrapper
		that.$input.append(wrapper);

		// Construct the wrapper options
		options = {
			nested_in: that,
			variables: that.variables,
			container: wrapper,
			viewname: config.viewname,
			value: entry.value,
			field: entry.field
		};

		// Create a new wrapper instance
		instance = new ChimeraFieldWrapper(options);

		that.fields.push(instance);
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