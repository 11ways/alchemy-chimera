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
var PasswordChimeraField = ChimeraField.extend(function PasswordChimeraField(parent, value, container, variables, prefix) {
	PasswordChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
PasswordChimeraField.setMethod(function renderEdit() {

	var html = '<input class="chimeraField-string chimeraPassword-first" type="password" placeholder="Enter a new password">';
	html += '<input class="chimeraField-string chimeraPassword-second" type="password" placeholder="Repeat the same password">';

	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
PasswordChimeraField.setMethod(function initEdit() {

	var that = this,
	    $first = $('.chimeraPassword-first', this.intake),
	    $second = $('.chimeraPassword-second', this.intake);

	$first.add($second).change(function onFirstChange() {

		if ($first.val() == $second.val()) {
			that.setValue($first.val());
		} else {
			that.setValue(null);
		}
	});
});