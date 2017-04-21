/**
 * Date Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {FieldType}
 */
var DateChimeraField = Function.inherits('Alchemy.ChimeraField', function DateChimeraField(fieldType, options) {

	DateChimeraField.super.call(this, fieldType, options);

	this.script_file = ['chimera/date_field'];

	this.viewname = 'date';
	this.viewwrapper = 'date';
});
