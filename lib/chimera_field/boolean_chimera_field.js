/**
 * Boolean Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var BooleanChimeraField = Function.inherits('ChimeraField', function BooleanChimeraField(fieldType, options) {

	this.constructor.super.call(this, fieldType, options);

	this.script_file = 'chimera/boolean_field';

	this.viewname = 'boolean';
});
