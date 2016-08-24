/**
 * Time Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var TimeChimeraField = Function.inherits('Alchemy.ChimeraField', function TimeChimeraField(fieldType, options) {

	TimeChimeraField.super.call(this, fieldType, options);

	this.viewname = 'time';
	this.viewwrapper = 'date';
});
