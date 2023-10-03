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
 * @version  1.2.6
 */
ChimeraController.setMethod(function beforeAction() {

	const model = this.conduit.params.model,
	      is_system_route = this.conduit.route.is_system_route;

	this.set('toolbar_manager', this.toolbar_manager);
	
	// If this is not a system route and no model is defined in the parameters,
	// do not queue a model fallback
	if (is_system_route && !model) {
		return;
	}

	// Ignore loopback conduits
	if (this.conduit instanceof Classes.Alchemy.Conduit.Loopback) {
		return;
	}

	this.toolbar_manager.queueModelFallback(model);
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