/**
 * HasOneParent Chimera Field
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {FieldType}
 */
var HOP = Function.inherits('BelongsToChimeraField', function HasOneParentChimeraField(fieldType, options) {

	HasOneParentChimeraField.super.call(this, fieldType, options);

	this.viewname = 'hasoneparent';
	this.viewwrapper = 'default';
});