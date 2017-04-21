/**
 * The Datetime ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var DatetimeChimeraField = Function.inherits('ChimeraField', function DatetimeChimeraField(parent, value, container, variables, prefix) {
	DatetimeChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Don't use rome for list views
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.1
 * @version  0.2.1
 */
DatetimeChimeraField.setMethod(function renderList() {

	var format,
	    html,
	    val = this.value;

	if (this.parent.field.options.list_format) {
		format = this.parent.field.options.list_format;
	} else {
		format = 'Y-m-d H:i';
	}

	if (val && Date.isDate(val)) {
		val = val.format(format);
	}

	html = '<div>' + val + '</div>';
	this.setMainElement(html);
});

/**
 * Initialize the field in the edit action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {Mixed}   value   Optional value to override
 */
DatetimeChimeraField.setMethod(function initEdit(value) {

	var that = this;

	// Override the value if given
	if (typeof value !== 'undefined') {
		this.input.value = value;
	}

	// Add change listener
	if (this.input) {
		this.input.addEventListener('change', function onChange() {

			var faulty,
			    utc;

			faulty = Date.create(that.input.value);

			// The Date constructor interpreted it as having a timezone,
			// we need to correct this
			faulty = Number(faulty) + (faulty.getTimezoneOffset() * 60 * 1000);

			// And now the correct value
			utc = Date.create(faulty);

			that.setValue(utc);
		});
	} else {
		console.warn('Field', this, 'has no input! Changes will not be saved');
	}
});

/**
 * The Date ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var DateChimeraField = Function.inherits('ChimeraField', function DateChimeraField(parent, value, container, variables, prefix) {
	DateChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Don't use rome for list views
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.1
 * @version  0.2.1
 */
DateChimeraField.setMethod(function renderList() {

	var format,
	    html,
	    val = this.value;

	if (this.parent.field.options.list_format) {
		format = this.parent.field.options.list_format;
	} else {
		format = 'Y-m-d';
	}

	if (val && Date.isDate(val)) {
		val = val.format(format);
	}

	html = '<div>' + val + '</div>';
	this.setMainElement(html);
});

/**
 * The Time ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
TimeChimeraField = ChimeraField.extend(function TimeChimeraField(parent, value, container, variables, prefix) {
	TimeChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Don't use rome for list views
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.1
 * @version  0.2.1
 */
TimeChimeraField.setMethod(function renderList() {

	var format,
	    html,
	    val = this.value;

	if (this.parent.field.options.list_format) {
		format = this.parent.field.options.list_format;
	} else {
		format = 'H:i:s';
	}

	if (val && Date.isDate(val)) {
		val = val.format(format);
	}

	html = '<div>' + val + '</div>';
	this.setMainElement(html);
});