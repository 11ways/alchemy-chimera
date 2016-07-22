var commands = alchemy.shared('Command.running', 'Array');

/**
 * The Chimera Commands Controller class
 *
 * @author    Jelle De Loecker   <jelle@develry.be>
 * @since     0.2.1
 * @version   0.2.1
 */
var Commands = Function.inherits('ChimeraController', function RunningCommandChimeraController(conduit, options) {

	RunningCommandChimeraController.super.call(this, conduit, options);

});

/**
 * The index action:
 * Show all running and finished jobs
 *
 * @param   {Conduit}   conduit
 */
Commands.setMethod(function index(conduit) {

	var that = this,
	    finished = [],
	    running = [],
	    command,
	    tasks = [],
	    i;

	commands.forEach(function eachCommand(command) {
		tasks.push(function getDescription(next) {
			command.getDescription(function gotDescription(err, description) {

				if (err) {
					return next(err);
				}

				if (command.stopped) {
					finished.push(command);
				} else {
					running.push(command);
				}

				return next();
			});
		});
	});

	Function.parallel(tasks, function done(err) {

		if (err) {
			return conduit.error(err);
		}

		that.set('pagetitle', 'Commands');
		that.set('running', running);
		that.set('finished', finished);

		that.render('chimera/running_commands/index');
	});
});

/**
 * Get a specific command
 *
 * @param   {String}   id
 */
Commands.setMethod(function getById(id) {

	var i;

	for (i = 0; i < commands.length; i++) {
		if (commands[i].id == id) {
			return commands[i];
		}
	}
});

/**
 * Do a specific action on a command
 *
 * @param   {Conduit}   conduit
 */
Commands.setMethod(function action(conduit, id, type) {

	var command = this.getById(id);

	if (!command) {
		throw new Error('Command "' + id + '" not found');
	}

	switch (type) {

		case 'stop':
			command.stop();
			break;

		case 'pause':
			command.pause();
			break;

		case 'resume':
			command.resume();
			break;
	}
});