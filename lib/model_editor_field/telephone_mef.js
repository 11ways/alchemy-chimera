/**
 * The Telephone field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('StringMEF', function TelephoneMEF() {

	this.index = function index(callback) {

		var that = this;

		this.parent('index', null, function() {

			var isArray,
			    values,
			    i;

			isArray = Array.isArray(that.value);
			values = Array.cast(that.value);

			for (i = 0; i < values.length; i++) {
				if (values[i]) {
					values[i] = '<a href="tel://' + values[i] + '">' + values[i] + '</a>';
				}
			}

			if (isArray) {
				that.value = values;
			} else {
				that.value = values[0];
			}

			callback();
		});
	}

	/**
	 * Get the value for the excel export
	 *
	 * @author   Jyrki De Neve   <jyrki@codedor.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	this.export = function exprt(callback) {

		var that = this;
		callback();
	};
});