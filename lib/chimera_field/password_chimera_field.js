/**
 * Password Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var PasswordChimeraField = Function.inherits('ChimeraField', function PasswordChimeraField(fieldType, options) {

	PasswordChimeraField.super.call(this, fieldType, options);

	this.viewname = 'password';
});
