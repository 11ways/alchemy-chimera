/**
 * The base Chimera Controller class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.0.0
 */
let ChimeraController = Function.inherits('Alchemy.Controller', 'Alchemy.Controller.Chimera', function Chimera(conduit, options) {

	Chimera.super.call(this, conduit, options);

	// Set the theme
	if (alchemy.plugins.chimera.theme) {
		this.view_render.setTheme(alchemy.plugins.chimera.theme);
	}
});

/**
 * Do something before the action is executed
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.2.4
 * @version  1.2.4
 */
ChimeraController.setMethod(function beforeAction() {
	this.set('toolbar_manager', this.toolbar_manager);
	this.toolbar_manager.queueModelFallback(this.conduit.params.model);
});

/**
 * Get this client's toolbar manager
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.2.4
 * @version  1.2.4
 *
 * @return   {Alchemy.Widget.EditorToolbarManager}
 */
ChimeraController.enforceProperty(function toolbar_manager(new_value) {

	if (!new_value && this.conduit) {
		new_value = Classes.Alchemy.Widget.EditorToolbarManager.create(this.conduit);
		new_value.scenario = 'chimera';
	}

	return new_value;
});