/**
 * The JSON View chimera page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraModule', function ModelEditorChimeraModule() {

	this.fields = alchemy.shared('Chimera.modelEditorFields');

	this.routeName = 'editor';

	this.routeBase = '/:model';

	this.actions = {
		index: {
			route: '/index',
			title: __('chimera', 'Index'),
			class: 'btn-primary',
			icon: 'list',
		},
		view: {
			route: '/view/:id',
			title: __('chimera', 'View'),
			icon: 'eye'
		},
		edit: {
			route: '/edit/:id',
			title: __('chimera', 'Edit'),
			icon: 'pencil'
		},
		add: {
			route: '/add',
			title: __('chimera', 'Add'),
			icon: 'plus'
		}
	};

	this.actionLists = {
		paginate: ['index', 'add'],
		record: ['view', 'edit']
	};

	// Menu default settings
	this.menuBlueprint = {
		grouped: {
			type: 'Boolean',
			default: true
		}
	};

	this.groupedMenuTitle = __('chimera', 'Model Editor');

	/**
	 * The index view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(render) {
		// var BaseIndex = this.getView('BaseIndex');
		// BaseIndex.build(render, {
		// 	defaultFields: ['_id', 'created', 'updated'],
		// 	excludeFields: ['__v'],
		// 	defaultFieldType: 'json'
		// });
		var ModelViews = this.getView('ModelEditor');
		ModelViews.index(render, this, {});
	};

	/**
	 * The edit json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.edit = function edit(render) {
		var ModelViews = this.getView('ModelEditor');
		ModelViews.edit(render, this, {});
	};

	/**
	 * The add json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.add = function add(render) {
		var ModelViews = this.getView('ModelEditor');
		ModelViews.add(render, this, {});
	};

	/**
	 * The view json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.view = function view(render) {
		var JsonView = this.getView('JsonEdit');
		JsonView.build(render, this, {onlyView: true});
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

		var modelParams,
		    modelGreedy,
		    modelName,
		    models = [];

		if (!settings.model || settings.model == 'all') {
			models = alchemy.models;
		} else {
			modelName = settings.model.modelName();
			models = {};
			models[modelName] = alchemy.models[settings.model.modelName()];
		}

		for (modelName in models) {

			modelName = modelName.modelName();

			if (modelName == 'App') {
				continue;
			}

			modelParams = {model: modelName.underscore()};
			modelGreedy = this.getBaseUrl(modelParams);

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

				entry.id = 'ChimeraEditorModel' + modelName;
				entry.title = modelName;
				entry.url = this.getActionUrl('index', modelParams);
				//entry.url = Connection.url('Chimera-jsonview::index', {params: {model: modelName.underscore()}});
				entry.parent = parent;
				entry.greedy = modelGreedy

				if (typeof model.icon === 'undefined') {
					entry.icon = this.icon;
				} else {
					entry.icon = model.icon;
				}

				entries[entry.id] = entry;
			}
		}
	};

	/**
	 * Get the wanted field instance
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getField = function getField(name) {

		if (!name){
			log.error('Tried to get invalid field');
			return false;
		}

		var Field   = this.fields[name.underscore()],
		    augment = {};

		// If no view is found, return the string view by default
		if (!Field) {
			Field = this.fields['string'];
		}

		// Inject the __augment__ object into this new object
		alchemy.inject(augment, this.__augment__);

		// augment the view instance
		Field = alchemy.augment(Field, augment);

		return Field;
	};

});