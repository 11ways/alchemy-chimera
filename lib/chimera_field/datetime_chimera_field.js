/**
 * Datetime Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var DatetimeChimeraField = Function.inherits('Alchemy.ChimeraField', function DatetimeChimeraField(fieldType, options) {

	DatetimeChimeraField.super.call(this, fieldType, options);

	this.script_file = ['chimera/date_field'];

	this.viewname = 'datetime';
	this.viewwrapper = 'date';
});
