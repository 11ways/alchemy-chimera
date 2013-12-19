/**
 * The JSON View chimera page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraModule', function JsonChimeraModule() {

	this.routeName = 'jsonview';

	this.actions = {
		index: {
			route: '/:model/index',
			title: __('chimera', 'Index'),
			class: 'btn-primary',
			icon: 'list',
		},
		view: {
			route: '/:model/view/:id',
			title: __('chimera', 'View'),
			icon: 'eye'
		},
		edit: {
			route: '/:model/edit/:id',
			title: __('chimera', 'Edit'),
			icon: 'pencil'
		},
		add: {
			route: '/:model/add',
			title: __('chimera', 'Add'),
			icon: 'plus'
		}
	};

	this.actionLists = {
		paginate: ['index', 'add'],
		record: ['view', 'edit']
	};

	// Menu default settings
	this.defaultPieceSettings = {
		grouped: true
	};

	/**
	 * The index json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(render) {
		var BaseIndex = this.getView('BaseIndex');
		BaseIndex.build(render, {
			defaultFields: ['_id', 'created', 'updated'],
			excludeFields: ['__v'],
			defaultFieldType: 'json'
		});
	};

	/**
	 * The edit json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.edit = function edit(render) {

		var JsonEdit = this.getView('JsonEdit');
		JsonEdit.build(render, this, {});
	};

	/**
	 * Configure the menu pieces
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param   {Array}          entries    The current entries array
	 * @param   {String}         parent     Parent to use for all new entries
	 * @param   {MenuItemType}   mit        The ChimeraModuleMIT
	 * @param   {Object}         data       Menu piece record data
	 * @param   {Object}         settings   The settings to use
	 *
	 * @return  {Array}          The resulting entries
	 */
	this.configureMenuEntries = function configureMenuEntries(entries, parent, mit, data, settings) {

		for (modelName in alchemy.models) {
			if (alchemy.models[modelName].admin !== false) {

				// Get the model instance
				model = Model.get(modelName);

				// If the model does not use a table, or the admin
				// property is false, do not add it
				if (!model.useTable || (typeof model.admin !== 'undefined' && !model.admin)) {
					continue;
				}

				// Clone the default settings into a new object
				entry = this.cloneDefaultSettings();

				entry.id = 'ChimeraJsonModel' + modelName;
				entry.title = modelName;
				entry.url = this.getActionUrl('index', {model: modelName.underscore()});
				//entry.url = Connection.url('Chimera-jsonview::index', {params: {model: modelName.underscore()}});
				entry.parent = parent;

				if (typeof model.icon === 'undefined') {
					entry.icon = this.icon;
				} else {
					entry.icon = model.icon;
				}

				entries[entry.id] = entry;
			}
		}
	};

});