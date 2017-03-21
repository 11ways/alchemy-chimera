/**
 * The Rome ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var RomeChimeraField = Function.inherits('ChimeraField', function RomeChimeraField(parent, value, container, variables, prefix) {
	RomeChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
RomeChimeraField.setMethod(function renderEdit() {

	var html;

	// The "inline" option only shows a Rome picker,
	// but it can be confusing when no value is set
	if (this.parent.field.options.inline) {
		html = '<div class="chimeraEditor-date-edit"></div>';
	} else {
		// Don't use "date" or "datetime" as type,
		// that'll just complicate things
		html = '<input class="chimeraField-string" type="text"></input>';
	}

	this.setMainElement(html);
});

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
var DatetimeChimeraField = Function.inherits('RomeChimeraField', function DatetimeChimeraField(parent, value, container, variables, prefix) {
	DatetimeChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
DatetimeChimeraField.setMethod(function initEdit() {
	var that = this;
	applyDateField(that, 'datetime');
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
 * The Date ChimeraField class
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
var DateChimeraField = Function.inherits('RomeChimeraField', function DateChimeraField(parent, value, container, variables, prefix) {
	DateChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
DateChimeraField.setMethod(function initEdit() {
	var that = this;
	applyDateField(that, 'date', {time: false});
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
 * @version  0.2.0
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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TimeChimeraField.setMethod(function initEdit() {
	var that = this;
	applyDateField(that, 'time', {date: false});
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

/**
 * Initiate a datefield
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {ChimeraField}   that
 * @param    {String}         type
 * @param    {Object}         options
 */
function applyDateField(that, type, options) {

	var value = that.value,
	    calender;

	if (value != null) {
		value = new Date(value);
	}

	options = Object.assign({weekStart: 1, initialValue: value}, options);

	if (!that.input) {
		throw new Error('Date field has no valid input element!');
	}

	// Apply `rome`
	calender = rome(that.input, options);

	this.romeCalender = calender;

	calender.on('data', function dateChange(dateString) {
		var local = calender.getDate(),
		    utc;

		utc = new Date(Date.UTC(local.getFullYear(), local.getMonth()+1, local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds(), local.getMilliseconds()));

		that.setValue(utc);
	});
}