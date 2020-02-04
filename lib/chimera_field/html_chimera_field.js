/**
 * Html Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {FieldType}
 */
var HtmlChimeraField = Function.inherits('Alchemy.ChimeraField', function HtmlChimeraField(fieldType, options) {

	HtmlChimeraField.super.call(this, fieldType, options);

	this.script_file = ['/public/ckeditor/4.13/ckeditor', 'chimera/text_field'];

	this.viewname = 'text';
	this.viewwrapper = 'text';
});
