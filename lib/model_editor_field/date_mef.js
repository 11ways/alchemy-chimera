/**
 * The Date field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function DateMEF() {

	this.input = function input(callback) {

		this.fieldView = 'date';

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

		var date = new Date(this.value);

		if (date.valueOf()) {
			this.value = date;
		} else {
			this.value = null;
		}

		callback();
	};

});