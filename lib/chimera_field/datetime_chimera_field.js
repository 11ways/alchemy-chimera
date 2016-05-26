/**
 * Datetime Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {FieldType}
 */
var DatetimeChimeraField = Function.inherits('ChimeraField', function DatetimeChimeraField(fieldType, options) {

	this.constructor.super.call(this, fieldType, options);

	this.script_file = ['chimera/date_field', 'rome/rome'];
	this.style_file = 'rome/rome';

	this.viewname = 'datetime';
	this.viewwrapper = 'date';
});
