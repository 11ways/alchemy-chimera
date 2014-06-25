/**
 * The Text field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.1.0
 */
alchemy.create('ModelEditorField', function TextMEF() {

	/**
	 * Truncate the string for the index view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.1
	 * @version  0.1.1
	 */
	this.index = function index(callback) {

		if (this.value && typeof this.value == 'string') {
			this.value = this.value.stripTags().truncate(120);
		}

		callback();
	};

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