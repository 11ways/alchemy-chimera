/**
 * The Json view Item Type
 */
alchemy.create('MenuItemType', function ChimeraModuleMIT() {

	this.modules = alchemy.shared('Chimera.modules');
	this.models = alchemy.models;
	
	this.blueprint = {
		module: {
			type: 'Enum',
		}
	};

	/**
	 * Prepare several instance properties
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {
		this.parent();
		
		// Chimera Module menu items can't have children
		this.allowChildren = false;
	};

	/**
	 * Get the wanted chimera module.
	 * If no valid module is found, the default module is returned.
	 * (An instance of the base class)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @pram     {String}   moduleName
	 */
	this.getModule = function getModule(moduleName) {

		var module;

		// Underscore the name
		moduleName = String(moduleName).underscore();

		module = this.modules[moduleName];

		if (!module) {
			module = this.modules['default_chimera_module'];
		}

		module = alchemy.inject(module, this.__augment__);

		return module;
	};

	/**
	 * Clone the default settings and return them as a new object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.cloneDefaultSettings = function cloneDefaultSettings(recordData) {

		var settings = {},
		    module;

		if (recordData) {
			module = this.getModule(recordData.settings.module)
		}

		// If no valid module is found, use this instance
		if (!module) {
			module = this;
		}

		alchemy.inject(
			settings,
			this.defaultSettings,
			module.defaultSettings);

		return settings;
	};

	/**
	 * Get the title to display in the menu manager
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   data       The MenuPiece record data from the db
	 */
	this.getPieceTitle = function getPieceTitle(data) {

		var module = this.getModule(data.settings.module);

		return module.getPieceTitle(data);
	};

	/**
	 * Configure this menu piece
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.configure = function configure(data, settings, callback) {

		var module = this.getModule(settings.module);

		if (module) {
			module.configureMenu(this, data, settings, callback);
		} else {
			// Do nothing with unsert modules
			callback();
		}
	};

	/**
	 * Intercept the preload editor settings:
	 * this way we can give different fields per module
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {ModelEditorChimeraView}   ModelEdit
	 * @param    {Object}                   piece
	 */
	this.preloadEditorSettings = function preloadEditorSettings(ModelEdit, piece, callback) {

		// Get the module
		var Module = this.getModule(piece.settings.module);

		// See if the blueprint has already been merged
		if (!Module.blueprint) {
			Module.blueprint = alchemy.inject({}, this.blueprint, Module.menuBlueprint);
		}

		return ModelEdit.preloadEditorSettings(Module, piece, callback);
	};

});