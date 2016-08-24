/**
 * Boolean Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var BooleanChimeraField = Function.inherits('Alchemy.ChimeraField', function BooleanChimeraField(fieldType, options) {

	BooleanChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/boolean_field';

	this.viewname = 'boolean';
});
