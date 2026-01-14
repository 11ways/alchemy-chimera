/**
 * System Task controller for Chimera
 *
 * @constructor
 * @extends       Alchemy.Controller.Chimera
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
const SystemTask = Function.inherits('Alchemy.Controller.Chimera', 'SystemTask');

/**
 * Run a task manually
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 *
 * @param    {Conduit}              conduit
 * @param    {Document.SystemTask}  system_task   The task to run (auto-populated from route)
 */
SystemTask.setAction(async function run(conduit, system_task) {

	if (!system_task) {
		return conduit.error(new Error('Task not found'));
	}

	if (!system_task.type) {
		return conduit.error(new Error('Task has no type configured'));
	}

	if (!system_task.enabled) {
		return conduit.error(new Error('Task is disabled'));
	}

	try {
		let task_instance = await alchemy.task_service.startTaskManually(system_task);

		// Get the task history document ID for live monitoring
		let task_history_id = task_instance.id;

		conduit.end({
			success         : true,
			message         : 'Task started successfully',
			task_id         : system_task.$pk,
			task_history_id : task_history_id,
		});
	} catch (err) {
		conduit.error(err);
	}
});

/**
 * Monitor a running task via linkup
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 *
 * @param    {Conduit}   conduit
 * @param    {Linkup}    linkup
 * @param    {Object}    config
 */
SystemTask.setAction(async function monitor(conduit, linkup, config) {

	const task_history_id = config?.task_history_id;

	if (!task_history_id) {
		linkup.submit('error', {message: 'No task history ID provided'});
		linkup.destroy();
		return;
	}

	// Get the TaskHistory model and find the record
	const TaskHistory = Model.get('System.TaskHistory');
	const history_doc = await TaskHistory.findByPk(task_history_id);

	if (!history_doc) {
		linkup.submit('error', {message: 'Task history record not found'});
		linkup.destroy();
		return;
	}

	// Find the running task instance
	const running = alchemy.shared('Task.running', 'Array');
	let task_instance = running.find(t => t.id === task_history_id);

	// Helper to get current task state
	// Prefers in-memory task instance values over database values when available,
	// because the database save may be pending (async)
	const getTaskState = async () => {

		let is_running,
		    started_at,
		    ended_at,
		    had_error;

		if (task_instance) {
			// Use in-memory task instance state (more up-to-date than database)
			is_running = task_instance.has_started && !task_instance.has_stopped;
			started_at = task_instance.started ? new Date(task_instance.started) : history_doc.started_at;
			ended_at = task_instance.stopped ? new Date(task_instance.stopped) : history_doc.ended_at;
			had_error = task_instance.error ? true : history_doc.had_error;
		} else {
			// Task instance not in memory - re-fetch from database for latest state
			let fresh_doc = await TaskHistory.findByPk(task_history_id);
			is_running = fresh_doc?.is_running ?? false;
			started_at = fresh_doc?.started_at ?? history_doc.started_at;
			ended_at = fresh_doc?.ended_at ?? history_doc.ended_at;
			had_error = fresh_doc?.had_error ?? history_doc.had_error;
		}

		return {
			id          : task_history_id,
			type        : history_doc.type,
			started_at  : started_at,
			ended_at    : ended_at,
			is_running  : is_running,
			had_error   : had_error,
			percentage  : task_instance?.percentage ?? null,
			reports     : task_instance?.reports ?? [],
			is_paused   : task_instance?.is_paused ?? false,
			can_stop    : task_instance?.can_be_stopped ?? false,
			can_pause   : task_instance?.can_be_paused ?? false,
		};
	};

	// Send initial state
	linkup.submit('state', await getTaskState());

	// Check if task is still actively running
	const is_task_running = task_instance && task_instance.has_started && !task_instance.has_stopped;

	if (is_task_running) {
		// Task is actively running - subscribe to its events

		// When task completes, send final state and re-fetch the document
		const check_completion = async () => {
			// Re-fetch the history document to get final state
			const updated_doc = await TaskHistory.findByPk(task_history_id);

			if (updated_doc && !updated_doc.is_running) {
				linkup.submit('complete', {
					ended_at     : updated_doc.ended_at,
					had_error    : updated_doc.had_error,
					error_message: updated_doc.error_message,
				});
			}
		};

		// Listen for report events
		const on_report = async (report) => {
			linkup.submit('report', report);
			linkup.submit('progress', {
				percentage: task_instance.percentage,
				is_paused: task_instance.is_paused,
			});

			// When the task is done, send the completion state and clean up listener
			if (report.done) {
				task_instance.off('report', on_report);
				await check_completion();
			}
		};

		task_instance.on('report', on_report);

		// Handle stop command from client
		linkup.on('stop', async () => {
			if (task_instance && task_instance.can_be_stopped) {
				await task_instance.stop();
				linkup.submit('stopped');
			}
		});

		// Handle pause command from client
		linkup.on('pause', () => {
			if (task_instance && task_instance.can_be_paused && !task_instance.is_paused) {
				task_instance.pause();
				linkup.submit('paused');
			}
		});

		// Handle resume command from client
		linkup.on('resume', () => {
			if (task_instance && task_instance.is_paused) {
				task_instance.resume();
				linkup.submit('resumed');
			}
		});

		// Clean up when linkup is destroyed
		linkup.on('destroyed', () => {
			if (task_instance) {
				task_instance.off('report', on_report);
			}
		});

	} else {
		// Task is not running (either completed or never started)
		// Send completed state using the most up-to-date values
		let ended_at, had_error, error_message;

		if (task_instance && task_instance.has_stopped) {
			// Task instance exists but has stopped - use in-memory values
			ended_at = task_instance.stopped ? new Date(task_instance.stopped) : null;
			had_error = task_instance.error ? true : false;
			error_message = task_instance.error?.message || null;
		} else {
			// No task instance - re-fetch from database for latest state
			let fresh_doc = await TaskHistory.findByPk(task_history_id);
			ended_at = fresh_doc?.ended_at;
			had_error = fresh_doc?.had_error;
			error_message = fresh_doc?.error_message;
		}

		linkup.submit('complete', {
			ended_at     : ended_at,
			had_error    : had_error,
			error_message: error_message,
		});
	}
});
