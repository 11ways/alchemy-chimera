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
	 * Modify the value for index
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(callback) {

		// If there is a value present, indicate it by showing stars
		if (this.value) {
			var d = new Date(this.value);
			this.value = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
		}

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