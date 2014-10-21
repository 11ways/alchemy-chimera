/**
 * Setting model
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 */
var Setting = Model.extend(function SettingModel(options) {

	var chimera,
	    list,
	    edit;

	SettingModel.super.call(this, options);

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	// Get the list group
	list = chimera.getActionFields('list');
	list.addField('email');

	// Get the edit group
	edit = chimera.getActionFields('edit');
	edit.addField('email');


});

Setting.addField('email', 'String');