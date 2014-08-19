module.exports = function chimeraHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers,
	    drones  = hawkejs.drones,
	    chimera = helpers.chimera = {},
	    fields  = helpers.chimera_fields = {},
	    indexv  = helpers.chimera_index_views = {};

	/**
	 * Show flash messages
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	hawkejs.event.on('viewready', function(type, data) {

		var entry, list, i;

		if (hawkejs.storage.deliverData && hawkejs.storage.deliverData.list) {
			list = hawkejs.storage.deliverData.list;
		} else {
			return;
		}

		for (i = 0; i < list.length; i++) {

			entry = list[i];
			
			if (entry.type == 'flash' && !entry.done) {
				if (toastr[entry.value.type]) {
					toastr[entry.value.type](entry.value.value);
				} else {
					toastr.info(entry.value.type + ': ' + entry.value.value);
				}

				entry.done = true;
			}
		}
	});

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
		    path,
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

				if (typeof list[i] === 'object') {
					action = list[i];
				} else {
					action = actions[list[i]];
				}

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
					} else if (action.icon !== false) {
						prepend = '<i class="fa fa-circle-o"></i>';
					}

					if (typeof options.title === 'undefined' || options.title === true) {
						if (options.modelTitle) {
							title = hawkejs.helpers.__addPlaceholders(action.title, {modelTitle: ''+options.modelTitle, newItem: ''+options.newItem});
						} else {
							title = action.title;
						}
					} else {
						title = false;
					}

					path = action.path.fillPlaceholders(routeVars);

					if (path.placeholders().length) {
						continue;
					}

					this.add_link(path, {
						title: title,
						content: content,
						'class': cssClass,
						prepend: prepend,
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
		    helptext,
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

			var emptyVal;

			hWrapper += 'data-array ';

			if (!item.readonly) {
				addButton = '<button data-chimera-add-entry class="btn btn-default"><i class="fa fa-plus"></i> Add entry</button>';
			}

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

			if (options.emptyResult) {
				emptyVal = options.emptyResult;
			} else {
				emptyVal = '';
			}

			// Create 1 more with an empty value
			tempOption.variables.item.value = emptyVal;
			result = this.print_element(viewPath, tempOption);

			if (result.payload && result.payload.request.blocks && result.payload.request.blocks.input) {
				input += '<script type="text/html" data-chimera-empty-input style="display: none;">' + result.payload.request.blocks.input.buf.join('') + '</script>';
			}
		} else {
			result = this.print_element(viewPath, options);
			blocks = result.payload.request.blocks;

			if (blocks.input) {
				input += '<hawkejs data-chimera-input>' + blocks.input.buf.join('') + '</hawkejs>';
			}
		}

		// Re-emit any user-specified events
		if (result && result.payload && result.payload.request && result.payload.request.events) {
			if (result.payload.request.events.length) {
				for (nr = 0; nr < result.payload.request.events.length; nr++) {
					this.emit.apply(this, result.payload.request.events[nr]);
				}
			}
		}

		wrapper = blocks.wrapper;

		if (wrapper) {
			wrapper = wrapper.buf.join('');
		} else {
			wrapper = '';
		}

		// Add the add button (only set if this field is an array)
		if (!item.disabled) {
			input += addButton;
		}

		hWrapper += '>';
		wrapper = hWrapper + wrapper.replace('<!--INPUT-->', input) + '</hawkejs>';

		if (options.variables.item.help) {
			helptext = '<div class="alert alert-info chimera-help-text"><span>' + options.variables.item.help + '</span></div>'
			wrapper = wrapper.replace('<!--HELP-->', helptext);
		}

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
		
		if (typeof options !== 'object') {
			options = {};
		}

		if (!info.fieldType) {
			info.fieldType = this.defaultFieldType || 'default';
		}
		
		if(typeof fieldInfo['assoc'] !== 'undefined'){
			info.fieldType = 'assoc';
			options.modelName = fieldInfo['assoc']['modelName'].underscore();
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
	
	/**
	 * Print out the given data, linked to the associated item view page
	 *
	 * @author        Kjell Keisse   <kjell@codedor.be>
	 * @since         0.0.2
	 * @version       0.1.0
	 */
	fields.assoc_view = function assoc_view(record, fieldName, options) {

		var value = record[fieldName];

		if (value && typeof value == 'object' && typeof value.value !== 'undefined') {
			value = value.value;
		}

		if (value === null) {
			return;
		}

		if(typeof value.hasMany !== 'undefined' && value.hasMany.length !== 0){
			for(var i = 0; i < value.hasMany.length; i++){
				this.add_link('../'+options.modelName+'/view/'+value.hasMany[i]._id, {title: value.hasMany[i].displayName});
				if(value.hasMany.length > 1 && i < value.hasMany.length-1){
					this.echo(', <br />', {escape: false});
				}
			}
		} else if(typeof value.displayName !== 'undefined'){
			this.add_link('../'+options.modelName+'/view/'+value._id, {title: value.displayName});
		}

	};

};