module.exports = function HawkejsChimera(Hawkejs, Blast) {

	var Chimera = Hawkejs.Helper.extend(function ChimeraHelper(view) {
		Hawkejs.Helper.call(this, view);
	});

	/**
	 * Print the chimera field
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.0
	 *
	 * @param    {Object}   record_value   Object containg fieldType and value
	 * @param    {Object}   options
	 *
	 * @return   {Placeholder}
	 */
	Chimera.setMethod(function printField(record_value, options) {

		var that = this,
		    placeholder,
		    viewElement,
		    variables,
		    fblock;

		if (!options) {
			options = {};
		}

		// Print the wrapper by default
		if (!options.template) {
			options.template = 'chimera/field_wrappers/_wrapper';
		}

		if (options.print_wrapper == null) {
			options.print_wrapper = true;
		}

		if (options.print_entries == null) {
			options.print_entries = true;
		}

		variables = {
			data: record_value,
			template: {
				field: record_value.field.viewname,
				action: record_value.field.viewaction,
				wrapper: record_value.field.viewwrapper
			},
			print_wrapper: options.print_wrapper,
			print_entries: options.print_entries,
			is_nested: options.is_nested
		};

		if (options.variables) {
			Object.assign(variables, options.variables);
		}

		// Print the placeholder element
		placeholder = this.view.print_element(options.template, variables);

		// Add the container classname to the wrapper element
		placeholder.element.classList.add('chimeraField-container');

		if (options.is_nested) {
			placeholder.element.classList.add('chimeraField-is-nested');

			if (options.nested_id) {
				placeholder.element.classList.add('nid-' + options.nested_id);
			}
		}

		// Create the 'fields' blockbuffer
		fblock = placeholder.renderer.createBlock('field', {created_manually: true});

		// Add the intake classname to the field wrapper element
		fblock.attributes['class'] = 'chimeraField-intake';

		return placeholder;
	});

	/**
	 * Print the actions for a given action type
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.0
	 *
	 * @param    {String}   type   model, list or record
	 */
	Chimera.setMethod(function printActions(type, options, subject) {

		var actionData,
		    routeName,
		    className,
		    variables,
		    rOptions,
		    actions,
		    action,
		    view,
		    list,
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

		// The default route name to use
		routeName = type.classify() + 'Action';

		if (subject == null) {
			subject = {};
		}

		if (actionData[type] == null) {
			return;
		}

		actions = actionData[type].createIterator();
		list = [];

		while (actions.hasNext()) {
			action = actions.next().value;

			if (!action) {
				continue;
			}

			temp = {
				controller: action.controller,
				action: action.name,
				subject: view.internal('modelName'),
				id: view.internal('recordId') || subject.id
			};

			className = 'action-' + action.name;

			if (options.className) {
				className += ' ' + options.className;
			}
			
			name = action.name;
			if(action.title){
				name = action.title;
			}

			rOptions = {title: action.name, content: name, className: className};

			if (action.handleManual) {
				rOptions.handleManual = true;
			}

			list.push({
				route_name : action.route_name || routeName,
				parameters : temp,
				options    : rOptions
			});
		}

		variables = Object.assign({}, {actions: list}, options.variables);

		view.print_element('chimera/elements/editor_actions', variables);
	});

	/**
	 * Set the page title
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.3.0
	 * @version  0.3.0
	 *
	 * @param    {Object}   options
	 */
	Chimera.setMethod(function setTitle(options) {

		if (typeof options == 'string') {
			options = {
				title : options
			};
		}

		this.view.set_title('Chimera: ' + options.title);
	});
};