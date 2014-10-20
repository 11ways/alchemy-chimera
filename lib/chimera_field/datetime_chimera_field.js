/**
 * Datetime Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var DatetimeChimeraField = Function.inherits('ChimeraField', function DatetimeChimeraField(fieldType, options) {

	this.constructor.super.call(this, fieldType, options);

	this.viewname = 'datetime';
	this.viewwrapper = 'date';
});
