/**
 * The chimera-task-monitor element
 * Displays live progress of a running task via WebSocket linkup
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
const TaskMonitor = Function.inherits('Alchemy.Element.App', 'Alchemy.Element.Chimera', 'TaskMonitor');

/**
 * Set the custom element prefix to 'chimera'
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setStatic('custom_element_prefix', 'chimera');

/**
 * The template file
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setTemplateFile('elements/chimera_task_monitor');

/**
 * The task history ID to monitor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setAttribute('task-history-id');

/**
 * The history document (passed from server)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setAssignedProperty('history_doc');

/**
 * The system task document (passed from server)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setAssignedProperty('system_task');

/**
 * Get or initialize the current task state
 * (stored as _task_state to persist modifications)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setProperty(function task_state() {

	// Check if we need to reinitialize (history_doc changed)
	let current_pk = this.history_doc?.$pk;
	if (this._task_state && this._task_state_doc_pk !== current_pk) {
		this._task_state = null;  // Invalidate cache
	}

	// Return existing state if already initialized
	if (this._task_state) {
		return this._task_state;
	}

	// Store which history_doc we're initializing from
	this._task_state_doc_pk = current_pk;

	// Initialize from history_doc on first access
	this._task_state = {
		is_running  : this.history_doc?.is_running ?? false,
		percentage  : null,
		is_paused   : false,
		can_stop    : false,
		can_pause   : false,
		had_error   : this.history_doc?.had_error ?? false,
		started_at  : this.history_doc?.started_at,
		ended_at    : this.history_doc?.ended_at,
	};

	return this._task_state;
});

/**
 * The element has been added to the DOM
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function introduced() {

	if (!Blast.isBrowser) {
		return;
	}

	// Set up event listeners for control buttons
	this.onEventSelector('click', '.btn-stop', e => {
		e.preventDefault();
		this.stopTask();
	});

	this.onEventSelector('click', '.btn-pause', e => {
		e.preventDefault();
		this.pauseTask();
	});

	this.onEventSelector('click', '.btn-resume', e => {
		e.preventDefault();
		this.resumeTask();
	});

	// Initialize display from history_doc (for already-completed tasks)
	this.updateStatus();
	this.updateProgress();
	this.updateControls();

	// Start the linkup connection
	this.connectLinkup();

	// Start elapsed time updates
	this.startElapsedTimeUpdates();
});

/**
 * Connect to the server via linkup
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function connectLinkup() {

	let task_history_id = this.task_history_id;

	if (!task_history_id) {
		this.showError(this.__('no-task-history-id'));
		return;
	}

	// Enable websockets
	alchemy.enableWebsockets();

	// Create the linkup to the taskmonitor route in the chimera section
	// The event name must include the section prefix 'chimera@' because the route
	// is defined on the chimera section (chimera_section.linkup(...))
	try {
		this.linkup = alchemy.linkup('chimera@taskmonitor', {
			task_history_id: task_history_id
		});
	} catch (err) {
		this.showError(this.__('linkup-connection-failed'));
		return;
	}

	// Handle initial state
	this.linkup.on('state', (data) => {
		this.handleState(data);
	});

	// Handle progress updates
	this.linkup.on('progress', (data) => {
		this.handleProgress(data);
	});

	// Handle new reports (logs)
	this.linkup.on('report', (data) => {
		this.handleReport(data);
	});

	// Handle completion
	this.linkup.on('complete', (data) => {
		this.handleComplete(data);
	});

	// Handle errors (both protocol errors with data.message and connection errors with err.message)
	this.linkup.on('error', (err) => {
		let error_message = err?.message || err;
		this.showError(error_message);

		// Also append to log for connection-level errors
		if (err instanceof Error) {
			this.appendLog(this.__('connection-error') + ': ' + error_message, 'error');
		}

		// Stop elapsed time updates if the task is not running
		if (!this.task_state.is_running) {
			this.stopElapsedTimeUpdates();
		}
	});

	// Handle connection close (server disconnect, network issues)
	this.linkup.on('close', () => {
		if (this.task_state.is_running) {
			this.appendLog(this.__('connection-lost'), 'warning');
		}
		this.stopElapsedTimeUpdates();
	});

	// Handle pause/resume/stop confirmations
	this.linkup.on('paused', () => {
		this.task_state.is_paused = true;
		this.updateControls();
		this.appendLog(this.__('task-paused'), 'info');
	});

	this.linkup.on('resumed', () => {
		this.task_state.is_paused = false;
		this.updateControls();
		this.appendLog(this.__('task-resumed'), 'info');
	});

	this.linkup.on('stopped', () => {
		this.task_state.is_running = false;
		this.updateControls();
		this.appendLog(this.__('task-stopped-by-user'), 'warning');
	});
});

/**
 * Handle initial state from server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function handleState(data) {

	this.task_state.is_running = data.is_running;
	this.task_state.percentage = data.percentage;
	this.task_state.is_paused = data.is_paused;
	this.task_state.can_stop = data.can_stop;
	this.task_state.can_pause = data.can_pause;
	this.task_state.had_error = data.had_error;
	this.task_state.started_at = data.started_at;
	this.task_state.ended_at = data.ended_at;

	// Display existing reports
	if (data.reports && data.reports.length) {
		for (let report of data.reports) {
			this.displayReport(report);
		}
	}

	this.updateStatus();
	this.updateProgress();
	this.updateControls();
});

/**
 * Handle progress update
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function handleProgress(data) {

	this.task_state.percentage = data.percentage;
	this.task_state.is_paused = data.is_paused;

	this.updateProgress();
	this.updateControls();
});

/**
 * Handle a new report (log entry)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function handleReport(report) {
	this.displayReport(report);
});

/**
 * Display a report in the logs
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function displayReport(report) {

	if (!report) {
		return;
	}

	let type_class = 'log-info';

	if (report.type === 'done') {
		type_class = 'log-success';
	} else if (report.type === 'failed' || report.error) {
		type_class = 'log-error';
	} else if (report.type === 'stopped') {
		type_class = 'log-warning';
	}

	// Log the report type/status
	if (report.type) {
		let percentage_str = '';
		if (report.percentage != null) {
			percentage_str = ` (${report.percentage}%)`;
		}
		this.appendLog(`[${report.type}]${percentage_str}`, type_class);
	}

	// Log any messages
	if (report.logs && report.logs.length) {
		for (let log_entry of report.logs) {
			let message = log_entry.args ? log_entry.args.join(' ') : '';
			this.appendLog(message, 'log-detail');
		}
	}

	// Log any errors
	if (report.error) {
		let error_message = report.error.message || report.error.toString();
		this.appendLog(this.__('error') + ': ' + error_message, 'log-error');

		if (report.error.stack) {
			this.appendLog(report.error.stack, 'log-error log-stack');
		}
	}
});

/**
 * Handle task completion
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function handleComplete(data) {

	this.task_state.is_running = false;
	this.task_state.ended_at = data.ended_at;
	this.task_state.had_error = data.had_error;

	if (data.had_error && data.error_message) {
		this.appendLog(this.__('task-failed') + ': ' + data.error_message, 'log-error');
	} else if (!data.had_error) {
		this.task_state.percentage = 100;
		this.appendLog(this.__('task-completed-successfully'), 'log-success');
	}

	this.updateStatus();
	this.updateProgress();
	this.updateControls();

	// Stop the elapsed time updates
	this.stopElapsedTimeUpdates();
});

/**
 * Update the status display
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function updateStatus() {

	let status_el = this.querySelector('.task-status');

	if (!status_el) {
		return;
	}

	let status_text = '';
	let status_class = '';

	if (this.task_state.is_running) {
		if (this.task_state.is_paused) {
			status_text = this.__('task-status-paused');
			status_class = 'status-paused';
		} else {
			status_text = this.__('task-status-running');
			status_class = 'status-running';
		}
	} else if (this.task_state.had_error) {
		status_text = this.__('task-status-failed');
		status_class = 'status-error';
	} else if (this.task_state.ended_at) {
		status_text = this.__('task-status-completed');
		status_class = 'status-completed';
	} else {
		status_text = this.__('task-status-pending');
		status_class = 'status-pending';
	}

	status_el.textContent = status_text;
	status_el.className = 'task-status ' + status_class;
});

/**
 * Update the progress bar
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function updateProgress() {

	let progress_bar = this.querySelector('.progress-bar');
	let progress_text = this.querySelector('.progress-text');

	if (progress_bar) {
		let percentage = this.task_state.percentage ?? 0;
		progress_bar.style.width = percentage + '%';

		if (this.task_state.had_error) {
			progress_bar.classList.add('error');
		} else if (percentage >= 100) {
			progress_bar.classList.add('complete');
		} else {
			progress_bar.classList.remove('error', 'complete');
		}
	}

	if (progress_text) {
		let percentage = this.task_state.percentage;
		if (percentage != null) {
			progress_text.textContent = Math.round(percentage) + '%';
		} else {
			progress_text.textContent = '-';
		}
	}
});

/**
 * Update the control buttons visibility
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function updateControls() {

	let stop_btn = this.querySelector('.btn-stop');
	let pause_btn = this.querySelector('.btn-pause');
	let resume_btn = this.querySelector('.btn-resume');

	if (stop_btn) {
		stop_btn.disabled = !this.task_state.is_running || !this.task_state.can_stop;
		stop_btn.style.display = this.task_state.is_running && this.task_state.can_stop ? '' : 'none';
	}

	if (pause_btn) {
		pause_btn.disabled = !this.task_state.is_running || this.task_state.is_paused || !this.task_state.can_pause;
		pause_btn.style.display = this.task_state.is_running && !this.task_state.is_paused && this.task_state.can_pause ? '' : 'none';
	}

	if (resume_btn) {
		resume_btn.disabled = !this.task_state.is_paused;
		resume_btn.style.display = this.task_state.is_paused ? '' : 'none';
	}
});

/**
 * Append a log message to the output
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function appendLog(message, type_class) {

	let log_output = this.querySelector('.log-output');

	if (!log_output) {
		return;
	}

	let log_entry = document.createElement('div');
	log_entry.className = 'log-entry ' + (type_class || '');

	let timestamp = document.createElement('span');
	timestamp.className = 'log-timestamp';
	timestamp.textContent = new Date().format('H:i:s');

	let content = document.createElement('span');
	content.className = 'log-content';
	content.textContent = message;

	log_entry.appendChild(timestamp);
	log_entry.appendChild(content);
	log_output.appendChild(log_entry);

	// Auto-scroll to bottom
	log_output.scrollTop = log_output.scrollHeight;
});

/**
 * Show an error message
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function showError(message) {

	let error_el = this.querySelector('.task-error');

	if (error_el) {
		error_el.textContent = message;
		error_el.style.display = 'block';
	}

	this.appendLog(this.__('error') + ': ' + message, 'log-error');
});

/**
 * Send stop command to server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function stopTask() {
	if (this.linkup) {
		this.linkup.submit('stop');
		this.appendLog(this.__('sending-stop-command'), 'log-info');
	}
});

/**
 * Send pause command to server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function pauseTask() {
	if (this.linkup) {
		this.linkup.submit('pause');
		this.appendLog(this.__('sending-pause-command'), 'log-info');
	}
});

/**
 * Send resume command to server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function resumeTask() {
	if (this.linkup) {
		this.linkup.submit('resume');
		this.appendLog(this.__('sending-resume-command'), 'log-info');
	}
});

/**
 * Start updating elapsed time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function startElapsedTimeUpdates() {

	// Clear any existing interval first to prevent race conditions
	this.stopElapsedTimeUpdates();

	this.updateElapsedTime();

	this._elapsed_interval = setInterval(() => {
		this.updateElapsedTime();
	}, 1000);
});

/**
 * Stop updating elapsed time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function stopElapsedTimeUpdates() {
	if (this._elapsed_interval) {
		clearInterval(this._elapsed_interval);
		this._elapsed_interval = null;
	}

	// Do one final update
	this.updateElapsedTime();
});

/**
 * Update the elapsed time display
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function updateElapsedTime() {

	let elapsed_el = this.querySelector('.elapsed-time');

	if (!elapsed_el) {
		return;
	}

	let started_at = this.task_state.started_at || this.history_doc?.started_at;
	let ended_at = this.task_state.ended_at || this.history_doc?.ended_at;

	if (!started_at) {
		elapsed_el.textContent = '-';
		return;
	}

	let start_time = new Date(started_at).getTime();
	let end_time = ended_at ? new Date(ended_at).getTime() : Date.now();
	let elapsed_ms = end_time - start_time;

	if (elapsed_ms < 0) {
		elapsed_el.textContent = '-';
		return;
	}

	// Format as HH:MM:SS
	let seconds = Math.floor(elapsed_ms / 1000);
	let minutes = Math.floor(seconds / 60);
	let hours = Math.floor(minutes / 60);

	seconds = seconds % 60;
	minutes = minutes % 60;

	let parts = [];

	if (hours > 0) {
		parts.push(String(hours).padStart(2, '0'));
	}

	parts.push(String(minutes).padStart(2, '0'));
	parts.push(String(seconds).padStart(2, '0'));

	elapsed_el.textContent = parts.join(':');
});

/**
 * Clean up when element is removed
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
TaskMonitor.setMethod(function removed() {

	// Destroy the linkup
	if (this.linkup) {
		this.linkup.destroy();
		this.linkup = null;
	}

	// Stop elapsed time updates
	this.stopElapsedTimeUpdates();
});
