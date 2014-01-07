var bcrypt = alchemy.use('bcrypt');

/**
 * The Password field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function PasswordMEF() {

	/**
	 * Modify the value for input
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.input = function input(callback) {

		// Use the password view
		this.fieldView = 'password';

		// Do not pass the value to the user, the hash should remain a secret
		this.value = '';

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
			this.value = '***';
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

		var that = this;

		// Only set the password if we've been given 2 values
		if (Array.isArray(this.value)) {

			if (this.value.length == 2) {
				// See if the passwords match
				if (this.value[0] == this.value[1]) {

					bcrypt.hash(this.value[0], 8, function bcryptResult(err, hash) {

						if (err) {
							log.error('There was an error generating the password hash');
							delete that.value;
						} else {
							that.value = hash;
						}

						callback();
					});

					return;
				} else {
					// The passwords didn't match!
					log.error('The passwords didn not match!');
					delete this.value;
				}
			} else {
				// Only 1 password was given!
				log.error('No password given');
				delete this.value;
			}
		} else {
			log.error('No valid password data was given');
			delete this.value;
		}
		
		callback();
	};

});