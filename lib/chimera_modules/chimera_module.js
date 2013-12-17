var ChimeraModules = alchemy.shared('Chimera.modules');

/**
 * The chimera class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.classes.BaseClass.extend(function ChimeraModule() {

	/**
	 * All the chimera views
	 *
	 * @type   {Object}
	 */
	this.views = alchemy.shared('Chimera.views');

	/**
	 * Every chimera page has its own name in the route.
	 * This name can be set manually.
	 *
	 * @type   {String}
	 */
	this.routeName = false;

	/**
	 * Every chimera page can have their own actions & routes
	 *
	 * @type   {Object}
	 */
	this.actions = false;

	/**
	 * The default menu settings children can modify
	 *
	 * @type {Object}
	 */
	this.defaultPieceSettings = null;

	/**
	 * The default menu translatable settings children can modify
	 *
	 * @type {Object}
	 */
	this.defaultPieceTranslatableSettings = null;

	/**
	 * The module menu title
	 *
	 * @type {String}
	 */
	this.menuTitle = null;

	/**
	 * The grouped module menu title
	 *
	 * @type {String}
	 */
	this.groupedMenuTitle = null;

	/**
	 * The module menu icon
	 *
	 * @type {String}
	 */
	this.icon = 'circle-o';

	/**
	 * The grouped module menu icon
	 *
	 * @type {String}
	 */
	this.groupedIcon = 'gear';

	/**
	 * Instantiate a newly created Chimera after this class has been extended
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   parent   The parent class
	 * @param    {Function}   child    The (extended) child class
	 */
	this.__extended__ = function __extended__(parent, child) {

		// Extract the name
		var name     = child.name.replace(/ChimeraModule$/, ''),
		    typeName = name.underscore();

		child.prototype.chimeraName = name;

		// If no routeName is set, underscore the name itself
		if (!child.prototype.routeName) {
			child.prototype.routeName = typeName;
		}

		// Do not let the child inherit the extendonly setting
		if (!child.prototype.hasOwnProperty('extendonly')) {
			child.prototype.extendonly = false;
		}

		// Create a new instance if this is a useable type
		if (!child.prototype.extendonly) {
			ChimeraModules[typeName] = new child();
		}

		if (!child.prototype.hasOwnProperty('menuTitle')) {
			child.prototype.menuTitle = __('chimera', name);
		}

		if (!child.prototype.hasOwnProperty('groupedMenuTitle')) {
			child.prototype.groupedMenuTitle = __('chimera', name + ' Group');
		}
	};

	/**
	 * Create these chimera routes
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.createRoutes = function createRoutes() {

		var connectionOptions,
		    connectionName,
		    action,
		    path,
		    name;

		if (this.actions) {
			for (name in this.actions) {

				connectionOptions = {
					controller   : 'admin',
					action       : 'chimera_dispatch',
					routeName    : this.routeName,
					chimeraModule: this.chimeraName.underscore(),
					chimeraAction: name,
					inflect      : false,
					order        : 0
				};

				// Alias the route
				action = this.actions[name];

				// Prepare the connection name
				connectionName = 'Chimera-' + this.routeName + '::' + name;

				// Construct the complete path
				path = '/admin/' + this.routeName + action.route;

				// And finally make the connection
				alchemy.connect(connectionName, path, connectionOptions);
			}
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
		
		// MenuItemTypes can have children by default
		this.allowChildren = true;
	};

	this.init = function preInit() {
		this.parent();
		this.createRoutes();
	};

	/**
	 * Clone the default settings and return them as a new object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.cloneDefaultSettings = function cloneDefaultSettings() {

		var settings = {};

		alchemy.inject(
			settings,
			this.baseDefaultPieceSettings,
			this.defaultPieceSettings);

		alchemy.inject(
			settings,
			this.baseDefaultPieceTranslatableSettings,
			this.defaultPieceTranslatableSettings);

		return settings;
	};

	/**
	 * Build this menu piece
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   data       The MenuPiece record data from the db
	 * @param    {Function} callback   The function to call back
	 */
	this.build = function build(data, callback) {

		// Create the target settings object
		var settings = this.cloneDefaultSettings();

		// Inject the settings from the database
		alchemy.inject(settings, data.settings);
		alchemy.inject(settings, data.translatable_settings);

		this.configure(data, settings, callback);
	};

	/**
	 * Do the configuration
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   data       The MenuPiece record data from the db
	 * @pram     {Object}   settings   The copied settings
	 * @param    {Function} callback   The function to call back
	 */
	this.configure = function configure(data, settings, callback) {
		callback(null, settings);
	};

	/**
	 * Get the wanted chimera view instance
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   viewName
	 */
	this.getView = function getView(viewname) {

		var view    = this.views[viewname.underscore()],
		    augment = {};

		// Inject the __augment__ object into this new object
		alchemy.inject(augment, this.__augment__);

		// Add the actions to the augment
		augment.actions = this.actions;

		// augment the view instance
		view = alchemy.augment(view, augment);

		return view;
	};

	/**
	 * Configure this menu, see if it needs to be grouped
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.configureMenu = function configureMenu(mit, data, settings, callback) {

		var entries = {},
		    parent  = false,
		    grouped = settings.grouped,
		    modelName,
		    entry,
		    model;

		if (grouped) {
			parent = 'Chimera' + this.name + 'GroupedModel';
			entry = this.cloneDefaultSettings();
			entry.id = parent;
			entry.title = this.groupedMenuTitle;
			entry.icon = this.groupedIcon;

			// Add this parent entry to the entries object
			entries[parent] = entry;
		}

		this.configureMenuEntries(entries, parent, mit, data, settings);

		callback(null, {entries: entries});
	};

	/**
	 * Configure a menu piece
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
	 * @return  {Array}        The resulting entries
	 */
	this.configureMenuEntries = function configureMenuEntries(entries, parent, mit, data, settings) {
		return entries;
	};

});