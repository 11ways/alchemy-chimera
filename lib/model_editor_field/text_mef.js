/**
 * The Text field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.1.0
 */
alchemy.create('ModelEditorField', function TextMEF() {

	/**
	 * Modify the value for input
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.input = function input(callback) {

		// Use the password view
		this.fieldView = 'text';

		this.parent();
	};

});