/**
 * Password Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {FieldType}
 */
var PasswordChimeraField = Function.inherits('ChimeraField', function PasswordChimeraField(fieldType, options) {

	PasswordChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/password_field';
	this.viewname = 'password';
});
