/**
 * The base Chimera Controller class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.3.0
 */
let ChimeraController = Function.inherits('Alchemy.Controller', 'Alchemy.Controller.Chimera', function Chimera(conduit, options) {

	Chimera.super.call(this, conduit, options);

	// Set the theme (only for HTTP conduits, not WebSocket connections)
	if (alchemy.plugins.chimera.theme && !conduit.websocket) {
		this.view_render.setTheme(alchemy.plugins.chimera.theme);
	}
});

/**
 * Do something before the action is executed
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.2.4
 * @version  1.3.0
 */
ChimeraController.setMethod(function beforeAction() {

	// Skip for WebSocket linkup connections - they don't have routes or params
	if (this.conduit.websocket) {
		return;
	}

	const model = this.conduit.params.model,
	      is_system_route = this.conduit.route.is_system_route;

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

/**
 * Set the toolbar manager as a template variable.
 * This must be called at the END of each action, after the document context
 * has been set up. Calling it too early (like in beforeAction) causes the
 * manager to be serialized before the document_watcher is set.
 *
 * For actions that don't call setContextDocument(), this will clear the
 * document_watcher to ensure the avatar doesn't persist from previous pages.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 *
 * @param    {Object}   options
 * @param    {Boolean}  options.has_document   Whether this action has a document context
 */
ChimeraController.setMethod(function setToolbarManagerVariable(options) {

	// If no document context was set for this action, clear the document watcher
	// This ensures the avatar doesn't persist when navigating from edit to list pages
	if (!options?.has_document) {
		this.toolbar_manager.setDocument(null);
	}

	this.set('toolbar_manager', this.toolbar_manager);
});