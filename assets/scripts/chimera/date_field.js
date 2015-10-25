/**
 * The Rome ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
 */
RomeChimeraField.setMethod(function renderEdit() {
	var html = '<div class="chimeraEditor-date-edit"></div>';
	this.setMainElement(html);
});

/**
 * The Datetime ChimeraField class
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
 * The Date ChimeraField class
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
 * The Time ChimeraField class
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
 * Initiate a datefield
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
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

	// Apply `rome`
	calender = rome(that.input, options);

	this.romeCalender = calender;

	calender.on('data', function dateChange(dateString) {
		var newdate = calender.getDate();
		console.log('Setting new value', newdate);
		that.setValue(newdate);
	});
}