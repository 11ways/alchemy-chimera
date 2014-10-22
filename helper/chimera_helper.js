module.exports = function HawkejsChimera(Hawkejs, Blast) {

	var Chimera = Hawkejs.Helper.extend(function ChimeraHelper(view) {
		Hawkejs.Helper.call(this, view);
	});

	Chimera.setMethod(function printField(recordValue) {

		var that = this,
		    placeholder,
		    viewElement,
		    variables,
		    fblock;

		variables = {
			data: recordValue,
			template: {
				field: recordValue.field.viewname,
				action: recordValue.field.viewaction,
				wrapper: recordValue.field.viewwrapper
			}
		};

		// Print the placeholder element
		placeholder = this.view.print_element('chimera/field_wrappers/_wrapper', variables);

		// Add the container classname to the wrapper element
		placeholder.element.addClass('chimeraField-container');

		// Create the 'fields' blockbuffer
		fblock = placeholder.renderer.createBlock('field');

		// Add the intake classname to the field wrapper element
		fblock.attributes['class'] = 'chimeraField-intake';
	});

	/**
	 * Print the actions for a given action type
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {String}   type   model, list or record
	 */
	Chimera.setMethod(function printActions(type, options, subject) {

		var actionData,
		    routeName,
		    className,
		    rOptions,
		    actions,
		    action,
		    view,
		    name,
		    item,
		    temp,
		    val;

		if (!type) {
			throw new TypeError('Invalid action type given');
		}

		if (options == null) {
			options = {};
		}

		view = this.view;
		actionData = view.set('actions');
		routeName = type.classify() + 'Action';

		if (subject == null) {
			subject = {};
		}

		if (actionData[type] == null) {
			return;
		}

		actions = actionData[type].createIterator();

		while (actions.hasNext()) {
			action = actions.next().value;

			temp = {
				controller: action.controller,
				action: action.name,
				subject: view.internal('modelName'),
				id: view.internal('recordId') || subject.id
			};

			className = 'btn btn--' + type + ' action-' + action.name;

			if (options.className) {
				className += ' ' + options.className;
			}
			
			name = action.name;
			if(action.title){
				name = action.title;
			}

			rOptions = {title: name, className: className};

			if (action.handleManual) {
				rOptions.handleManual = true;
			}

			view.print(' ');
			view.helpers.Router.printRoute(routeName, temp, rOptions);
		}
	});
};