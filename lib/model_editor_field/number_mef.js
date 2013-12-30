/**
 * The Number field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function NumberMEF() {

	this.input = function input(callback) {

		this.fieldView = 'number';

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

		var number = Number(this.value);

		if (!isNaN(number)) {
			this.value = number;
		} else {
			this.value = null;
		}

		callback();
	};

});