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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BooleanChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $('.chimeraEditor-input', this.intake);

	$input.change(function onBooleanEdit() {
		that.setValue($input.is(':checked'));
	});
});