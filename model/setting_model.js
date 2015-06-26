/**
 * Setting model
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  1.0.0
 */
var Setting = Model.extend(function SettingModel(options) {
	SettingModel.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
 */
Setting.constitute(function addFields() {
	this.addField('email', 'String');
	this.addField('google_analytics', 'String', {default: 'UA-XXXXX-Y'});
	this.addField('site_name', 'String');
	this.addField('cookie_warn_enable', 'Boolean');
	this.addField('cookie_warn_page', 'String');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
 */
Setting.constitute(function chimeraConfig() {

	var edit;

	if (!this.chimera) {
		return;
	}

	// Get the edit group
	edit = this.chimera.getActionFields('edit');
	edit.addField('email');
	edit.addField('google_analytics');
	edit.addField('site_name');
	edit.addField('cookie_warn_enable');
	edit.addField('cookie_warn_page');
});
