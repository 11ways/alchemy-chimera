/**
 * Register Chimera's toolbar buttons
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 */
const EditorToolbarManager = Classes.Alchemy.Widget.EditorToolbarManager;

/**
 * Register model-level buttons for Chimera
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Alchemy.Widget.EditorToolbarManager}   manager
 * @param    {string}                                model_name
 */
EditorToolbarManager.registerModelButtonProvider(function addChimeraModelButtons(manager, model_name) {

	// Only add buttons in chimera scenario
	if (manager.scenario != 'chimera') {
		return;
	}

	// Add create button for all models
	manager.addTemplateToRender('buttons', 'chimera/toolbar/create_button', {
		model_name: model_name,
	});
});

/**
 * Register document-level buttons for Chimera
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Alchemy.Widget.EditorToolbarManager}   manager
 * @param    {Alchemy.Document}                      doc
 * @param    {Alchemy.Model}                         model
 * @param    {string}                                model_name
 * @param    {*}                                     pk_val
 */
EditorToolbarManager.registerDocumentButtonProvider(function addChimeraDocumentButtons(manager, doc, model, model_name, pk_val) {

	// Edit in Chimera button (for non-chimera scenarios)
	if (manager.scenario != 'chimera') {
		manager.addTemplateToRender('buttons', 'chimera/toolbar/edit_in_chimera_button', {
			model_name: model_name.underscore(),
			record_pk: pk_val,
		});
		return; // No other buttons for non-chimera
	}

	// Preview button (chimera scenario only)
	if (model.chimera?.record_preview) {
		manager.addTemplateToRender('buttons', 'chimera/toolbar/preview_button', {
			model_name: model_name.underscore(),
			record_pk: pk_val,
		});
	}

	// Run Task button for System.Task
	if (model_name == 'System_Task' && doc.enabled && doc.type) {
		manager.addTemplateToRender('buttons', 'chimera/toolbar/run_task_button', {
			record_pk: pk_val,
		});
	}

	// Monitor button for System.TaskHistory
	if (model_name == 'System_TaskHistory') {
		manager.addTemplateToRender('buttons', 'chimera/toolbar/monitor_button', {
			record_pk: pk_val,
		});
	}
});
