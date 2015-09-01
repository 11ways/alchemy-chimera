/**
 * Geopoint chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var GeopointChimeraField = Function.inherits('ChimeraField', function GeopointChimeraField(fieldType, options) {

	GeopointChimeraField.super.call(this, fieldType, options);

	this.script_file = 'chimera/geopoint_field';

	this.viewname = 'geopoint';
	this.viewwrapper = 'geopoint';
});
