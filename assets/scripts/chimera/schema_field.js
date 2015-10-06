/**
 * The Password ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var SchemaChimeraField = ChimeraField.extend(function SchemaChimeraField(parent, value, container, variables, prefix) {

	var that = this,
	    base;

	// Make sure the fields exist inside the value object
	if (!value) {

		// Prepare the new value object
		value = {fields: []};

		// Get the original value of the parent wrapper
		base = Object.first(parent.original_value);

		// Copy over the fields, but not the value
		base.fields.forEach(function eachField(entry) {
			value.fields.push({field: entry.field});
		});
	}

	SchemaChimeraField.super.call(this, parent, value, container, variables, prefix);

	// Newly created ChimeraField instances of the subschema
	// will be stored in this array
	this.fields = [];
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
SchemaChimeraField.setMethod(function renderEdit() {

	var html = '<div class="chimera-schema-field"></div>';

	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
SchemaChimeraField.setMethod(function initEdit() {

	var that = this;

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
 * @since    1.0.0
 * @version  1.0.0
 */
SchemaChimeraField.setMethod(function getData() {

	var that = this,
	    result = {};

	this.fields.forEach(function eachField(field) {
		Object.merge(result, field.getData());
	});

	return result;
});