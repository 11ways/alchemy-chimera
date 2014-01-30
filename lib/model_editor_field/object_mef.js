/**
 * The Object field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function ObjectMEF() {

	this.input = function input(callback) {

		this.value = JSON.stringify(this.value);

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

		try {
			this.value = JSON.parse(this.value);
		} catch (e) {
			delete this.value;
		}
		
		callback();
	};

});