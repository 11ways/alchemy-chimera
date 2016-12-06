/**
 * Object Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var ObjectChimeraField = Function.inherits('Alchemy.ChimeraField', function ObjectChimeraField(fieldType, options) {

	ObjectChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/object_field';
	this.viewname = 'object';
});
