/**
 * The Boolean field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function BooleanMEF() {

	this.input = function input(callback) {

		this.fieldView = 'boolean';

		callback();
	};

	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {

		// Unlike PHP, when multiple named inputs are submitted
		// they get merged into an array.
		// In PHP, the last one would overwrite the first one.
		// So: if the value is an array, the value is true.
		if (Array.isArray(this.value)) {
			this.value = true;
		} else {
			this.value = false;
		}

		callback();
	};

});