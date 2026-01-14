/**
 * The chimera-run-task-button element
 * A button that triggers the SystemTask#run API to run a task manually
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
const RunTaskButton = Function.inherits('Alchemy.Element.Form.Button', 'Alchemy.Element.Chimera', 'RunTaskButton');

/**
 * Set the custom element prefix to 'chimera'
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
RunTaskButton.setStatic('custom_element_prefix', 'chimera');

/**
 * The task ID to run
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
RunTaskButton.setAttribute('task-id');

/**
 * The element has been added to the dom for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
RunTaskButton.setMethod(function introduced() {

	// Call parent introduced first (sets up click/keyup listeners)
	introduced.super.call(this);

	// Listen to the activate event (emitted by parent Button class on click)
	this.addEventListener('activate', async e => {
		await this.runTask();
	});
});

/**
 * Run the task via API
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
RunTaskButton.setMethod(async function runTask() {

	let task_id = this.task_id;

	if (!task_id) {
		console.error('No task ID provided');
		return;
	}

	this.setState('busy');

	try {
		let result = await this.hawkejs_helpers.Alchemy.getResource({
			name   : 'Chimera.SystemTask#run',
			method : 'post',
		}, {
			_id: task_id,
		});

		this.setState('done');

		// Redirect to the task monitor page if we have a task history ID
		if (result && result.task_history_id) {
			// Construct the URL for the task monitor page
			let monitor_url = alchemy.routeUrl('Chimera.Editor#taskMonitor', {
				task_history_id: result.task_history_id
			});

			// Navigate to the monitor page
			if (Blast.isBrowser && typeof hawkejs !== 'undefined' && hawkejs.scene) {
				hawkejs.scene.openUrl(monitor_url);
			} else {
				window.location.href = monitor_url;
			}
		}
	} catch (err) {
		console.error('Failed to run task:', err);
		this.setState('error', 3000, 'default');
	}
});
