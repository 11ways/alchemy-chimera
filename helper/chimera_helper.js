module.exports = function chimeraHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers,
	    drones  = hawkejs.drones,
	    chimera = helpers.chimera = {},
	    fields  = helpers.chimera_fields = {},
	    indexv  = helpers.chimera_index_views = {};

	/**
	 * Print out module actions
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	chimera.actions = function actions(actionListName, options) {

		var i;
		
		if (!options) {
			options = {};
		}

		if (Array.isArray(actionListName)) {

			for (i = 0; i < actionListName.length; i++) {
				this.chimera.actions(actionListName[i], options);
			}

			return;
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
		hawkejs.utils.inject(routeVars, this.routeVars, options.routeVars);

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
						urlvars: routeVars,
						match: {
							'class': 'active',
							greedy: true
						}
					});
				}
			}
		}
	};

	chimera.inputfield = function inputfield(viewname, options) {

		var hWrapper  = '',
		    addButton = '',
		    tempOption,
		    tempValue,
		    tempItem,
		    viewPath,
		    result,
		    blocks,
		    wrapper,
		    input = '',
		    item,
		    nr;

		item = options.variables.item;
		options = hawkejs.utils.inject({}, options);
		options['return'] = true;
		options.newscope = true;
		viewPath = 'chimera_fields/' + viewname + '_field';

		hWrapper = '<hawkejs data-chimera-field ';

		if (options.variables.item.array) {

			hWrapper += 'data-array ';

			addButton = '<button data-chimera-add-entry class="btn btn-default"><i class="fa fa-plus"></i> Add entry</button>';

			if (!Array.isArray(item.value)) {
				item.value = [''];
			}

			// Make sure the array contains a value, an empty string at least
			if (!item.value.length) {
				item.value.push('');
			}

			for (nr = 0; nr < item.value.length; nr++) {
				tempItem = hawkejs.utils.inject({}, item);
				tempItem.value = item.value[nr];

				tempOption = hawkejs.utils.inject({}, options);

				tempOption.variables = hawkejs.utils.inject({}, tempOption.variables);
				tempOption.variables.item = tempItem;

				result = this.print_element(viewPath, tempOption);
				blocks = result.payload.request.blocks;

				if (blocks.input) {
					input += '<hawkejs data-chimera-input>' + blocks.input.buf.join('') + '</hawkejs>';
				}
			}

			// Create 1 more with an empty value
			tempOption.variables.item.value = '';
			result = this.print_element(viewPath, tempOption);
			if (result.payload && result.payload.request.blocks && result.payload.request.blocks.input) {
				input += '<hawkejs data-chimera-empty-input style="display: none;">' + hawkejs.utils.encode(result.payload.request.blocks.input.buf.join('')) + '</hawkejs>';
			}
		} else {
			result = this.print_element(viewPath, options);
			blocks = result.payload.request.blocks;

			if (blocks.input) {
				input += '<hawkejs data-chimera-input>' + blocks.input.buf.join('') + '</hawkejs>';
			}
		}

		wrapper = blocks.wrapper;

		if (wrapper) {
			wrapper = wrapper.buf.join('');
		} else {
			wrapper = '';
		}

		// Add the add button (only set if this field is an array)
		input += addButton;

		hWrapper += '>';
		wrapper = hWrapper + wrapper.replace('<!--INPUT-->', input) + '</hawkejs>';

		this.echo(wrapper);
	};

	/**
	 * Print out the given field
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	chimera.field = function field(record, fieldInfo, options) {

		var info    = fieldInfo,
		    fieldName = info.field,
		    actionName;

		if (typeof info !== 'object') {
			info = {};
			fieldName = fieldInfo;
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

		var value = record[fieldName];

		if (typeof value == 'object' && typeof value.value !== 'undefined') {
			value = value.value;
		}

		this.echo(value, {escape: false});
	};

	/**
	 * Print out the given data, json encoded
	 *
	 * @author        Jelle De Loecker   <jelle@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	fields.json_view = function json_view(record, fieldName, options) {

		var value = record[fieldName];

		if (typeof value == 'object' && typeof value.value !== 'undefined') {
			value = value.value;
		}
		
		if (typeof options !== 'object') {
			options = {};
		}

		// Only encode values that truly need it (objects)
		if (options.all || typeof value === 'object') {
			value = JSON.stringify(value);
		}

		this.echo(value, {escape: true});
	};

};