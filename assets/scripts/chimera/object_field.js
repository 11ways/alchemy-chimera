/**
 * The Object ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var ObjectChimeraField = Function.inherits('ChimeraField', function ObjectChimeraField(options) {
	ObjectChimeraField.super.call(this, options);
});

/**
 * Initialize the field in the edit action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Mixed}   value   Optional value to override
 */
ObjectChimeraField.setMethod(function initEdit(value) {

	var that = this;

	// Override the value if given
	if (typeof value !== 'undefined') {
		this.input.value = JSON.stringify(value, null, 4);
	}

	// Add change listener
	this.input.addEventListener('change', function onChange() {

		var value;

		try {
			value = JSON.parse(that.input.value);
		} catch (err) {
			return console.error('Failed to parse JSON: ', value);
		}

		that.setValue(value);
	});
});
