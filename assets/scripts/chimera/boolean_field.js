/**
 * The Boolean ChimeraField class
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
BooleanChimeraField = ChimeraField.extend(function BooleanChimeraField(parent, value, container, variables, prefix) {
	BooleanChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
BooleanChimeraField.setMethod(function renderEdit() {

	var html = '<input type="checkbox"';

	if (this.value) {
		html += ' checked';
	}

	html += '>';

	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BooleanChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $(this.input);

	$input.change(function onBooleanEdit() {
		that.setValue($input.is(':checked'));
	});
});