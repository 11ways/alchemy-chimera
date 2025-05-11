/**
 * The Chimera Settings Controller:
 * Allows editing the application settings
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
const SettingsController = Function.inherits('Alchemy.Controller.Chimera', 'Settings');

/**
 * The settings editor action
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 *
 * @param    {Alchemy.Conduit}   conduit
 */
SettingsController.setAction(async function editor(conduit) {

	if (conduit.method == 'post') {
		let changes = conduit.body;

		if (!changes) {
			return conduit.end();
		}

		const AlchemySetting = this.getModel('System.Setting');

		await AlchemySetting.saveChanges(changes, conduit);

		return conduit.end();
	}

	const settings_config = Classes.Alchemy.Setting.SYSTEM.getEditorConfiguration(alchemy.system_settings, conduit);

	this.set('settings_config', settings_config);

	this.render('chimera/settings/editor');
});