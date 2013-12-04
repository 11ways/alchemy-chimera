/**
 * Make ofInput fields functional
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
hawkejs.event.on({type: 'create', name: 'admin-main'}, function(id, payload){

	var $mainForm = $('[data-hawkejs-block="admin-main"] form');

	$('button[data-add-ofinput]', $mainForm).click(function(e) {
		e.preventDefault();

		var $this       = $(this),
		    fieldName   = $this.attr('data-add-ofinput'),
		    $collection = $('div[data-ofinput="' + fieldName + '"]');

		$this.before('<div data-of-entry><input type="text" data-of-key placeholder="Key"> <input type="text" data-of-value placeholder="Value"></div>');

	});

	// Change the name of the value field when the key changes
	$mainForm.on('change', '[data-of-key]', function() {

		var $this      = $(this),
		    $form      = $this.parents('form'),
		    formModel  = $form.attr('data-model-name'),
		    fieldName  = $this.parents('div[data-ofinput]').attr('data-ofinput'),
		    keyName    = $this.val(),
		    $valfield  = $this.siblings('[data-of-value]');

	    if (keyName) {
			$valfield.attr('name', 'data[' + formModel + '][' + fieldName + '][' + keyName + ']');
		}
	});
});