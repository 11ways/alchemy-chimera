/**
 * Time Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {FieldType}
 */
var TimeChimeraField = Function.inherits('ChimeraField', function TimeChimeraField(fieldType, options) {

	this.constructor.super.call(this, fieldType, options);

	this.viewname = 'time';
	this.viewwrapper = 'date';
});
