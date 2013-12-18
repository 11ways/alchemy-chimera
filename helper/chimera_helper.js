module.exports = function chimeraHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers,
	    drones  = hawkejs.drones,
	    chimera = helpers.chimera = {},
	    fields  = helpers.chimera_fields = {};

	/**
	 * Print out module actions
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	chimera.actions = function actions(actionListName, options) {
		
		if (!options) {
			options = {};
		}

		var routeVars   = {},
		    content     = options.content,
		    actions     = this.chimeraModuleActions,
		    actionLists = this.chimeraModuleActionLists,
		    cssClass,
		    prepend,
		    action,
		    title,
		    list,
		    key,
		    i;

		// Merge routeVars in the viewvars with the routevars in the options
		hawkejs.µ.inject(routeVars, this.routeVars, options.routeVars);

		// Make sure the actionlist exists
		if (actionLists[actionListName]) {

			list = actionLists[actionListName];

			// Go over every action name in the list
			for (i = 0; i < list.length; i++) {

				action = actions[list[i]];

				if (action) {

					// Every link is a btn
					if (options['class']) {
						cssClass = options['class'] + ' ';
					} else {
						cssClass = 'btn ';
					}

					// See if we need to add a custom class
					if (action['class']) {
						cssClass += action['class'];
					} else {
						cssClass += 'btn-default';
					}

					// See if an icon is defined
					if (action.icon) {
						prepend = '<i class="fa fa-' + action.icon + '"></i>';
					} else {
						prepend = '<i class="fa fa-circle-o"></i>';
					}

					if (typeof options.title === 'undefined' || options.title === true) {
						title = action.title;
					} else {
						title = false;
					}

					this.add_link(action.path, {
						title: title,
						content: content,
						'class': cssClass,
						prepend: prepend,
						urlvars: routeVars
					});
				}
			}
		}
	};

	/**
	 * Print out the given field
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	chimera.field = function field(record, fieldName, options) {

		var info    = this.fieldInfo[fieldName],
		    actionName;

		if (typeof info !== 'object') {
			info = {};
		}

		if (!info.fieldType) {
			info.fieldType = this.defaultFieldType || 'default';
		}

		actionName = info.fieldType + '_view';

		if (this.chimera_fields[actionName]) {
			if (record && typeof record[fieldName] !== 'undefined') {
				this.chimera_fields[actionName](record, fieldName, options);
			}
		}
	};

	/**
	 * Print out the given data, default way
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	fields.default_view = function default_view(record, fieldName, options) {
		this.echo(record[fieldName], {escape: true});
	};

	/**
	 * Print out the given data, json encoded
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	fields.json_view = function json_view(record, fieldName, options) {
		
		var text = record[fieldName];

		if (typeof options !== 'object') {
			options = {};
		}

		// Only encode values that truly need it (objects)
		if (options.all || typeof text === 'object') {
			text = JSON.stringify(text);
		}

		this.echo(text, {escape: true});
	};

};