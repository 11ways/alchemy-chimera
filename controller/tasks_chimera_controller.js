var all_task_types = alchemy.getClassGroup('task'),
    running_tasks  = alchemy.shared('Task.running', 'Array');

/**
 * The Chimera Task Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.4.1
 * @version       0.4.1
 */
var Tasks = Function.inherits('Alchemy.Controller.Chimera', function Task(conduit) {
	Task.super.call(this, conduit);
});

/**
 * The index action:
 * Show all running and finished jobs
 *
 * @param   {Conduit}   conduit
 */
Tasks.setAction(function index(conduit) {

	var that = this,
	    finished = [],
	    running = [],
	    command,
	    tasks = [],
	    i;

	running_tasks.forEach(function eachTask(task) {
		tasks.push(function getDescription(next) {
			task.getDescription(function gotDescription(err, description) {

				if (err) {
					return next(err);
				}

				if (task.stopped) {
					finished.push(task);
				} else {
					running.push(task);
				}

				return next();
			});
		});
	});

	Function.parallel(tasks, function done(err) {

		if (err) {
			return conduit.error(err);
		}

		that.set('pagetitle', 'Tasks');
		that.set('running', running);
		that.set('finished', finished);

		that.render('chimera/tasks/index');
	});
});

/**
 * Get a specific command
 *
 * @param   {String}   id
 */
Tasks.setMethod(function getById(id) {

	var i;

	for (i = 0; i < running_tasks.length; i++) {
		if (running_tasks[i].id == id) {
			return running_tasks[i];
		}
	}
});

/**
 * Do a specific action on a command
 *
 * @param   {Conduit}   conduit
 */
Tasks.setAction(function action(conduit, id, type) {

	var task = this.getById(id);

	if (!task) {
		throw new Error('Task "' + id + '" not found');
	}

	switch (type) {

		case 'stop':
			task.stop();
			break;

		case 'pause':
			task.pause();
			break;

		case 'resume':
			task.resume();
			break;
	}
});