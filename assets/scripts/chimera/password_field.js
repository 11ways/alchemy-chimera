/**
 * The Password ChimeraField class
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
var PasswordChimeraField = ChimeraField.extend(function PasswordChimeraField(parent, value, container, variables, prefix) {
	PasswordChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
PasswordChimeraField.setMethod(function initEdit() {

	"use strict";

	var that = this,
	    $first = $('.chimeraPassword-first', this.container),
	    $second = $('.chimeraPassword-second', this.container),
	    $validation = $('.validation', this.container);

	$first.add($second).change(function onFirstChange() {

		checkMatch();

		if ($first.val() == $second.val()) {
			that.setValue($first.val());
		} else {
			//that.setValue(null);
		}
	});

	$first.add($second).on('keyup', function() {
		checkMatch();
	});

	function checkMatch() {

		var first = $first.val(),
		    second = $second.val();

		if (first == second) {
			$validation.text('');
			that.container.classList.remove('has-error');

			if (first) {
				that.container.classList.add('has-success');
			}
		} else {
			let error_html = String(alchemy.__('chimera', 'passwords.dont.match'));
			let html = '<br><div class="alert alert-danger" role="alert">'
				+ '<i class="alert-ico fa fa-fw fa-ban"></i>'
				+ error_html
				+ '</div>';

			$validation.html(html);
			that.container.classList.add('has-error');
			that.container.classList.remove('has-success');
		}
	}
});