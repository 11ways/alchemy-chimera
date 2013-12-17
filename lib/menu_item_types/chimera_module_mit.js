/**
 * The Json view Item Type
 */
alchemy.create('MenuItemType', function ChimeraModuleMIT() {

	this.modules = alchemy.shared('Chimera.modules');

	/**
	 * Get the wanted chimera module
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @pram     {String}   moduleName
	 */
	this.getModule = function getModule(moduleName) {

		var module = this.modules[moduleName.underscore()];

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
			this.baseDefaultPieceSettings,
			module.defaultPieceSettings);

		alchemy.inject(
			settings,
			this.baseDefaultPieceTranslatableSettings,
			module.defaultPieceTranslatableSettings);

		return settings;
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
			// @todo: catch faulty menu stuff
			log.error('Chimera Model Menu Item Type without propper configuration');
			callback();
		}
	};

});