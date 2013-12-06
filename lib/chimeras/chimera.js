var ChimeraTypes = alchemy.shared('Chimera.types');

/**
 * The chimera class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.classes.BaseClass.extend(function Chimera() {

	/**
	 * Every chimera page has its own name in the route.
	 * This name can be set manually.
	 *
	 * @type   {String}
	 */
	this.routeName = false;

	/**
	 * Every chimera page can have their own routes
	 *
	 * @type   {Object}
	 */
	this.routes = false;

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
		var name     = child.name.replace(/Chimera$/, ''),
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
			ChimeraTypes[typeName] = new child();
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
		    route,
		    path,
		    name;

		if (this.routes) {
			for (name in this.routes) {

				connectionOptions = {
					controller   : 'admin',
					action       : 'chimera_dispatch',
					routeName    : this.routeName,
					chimeraType  : this.chimeraName.underscore(),
					chimeraAction: name,
					inflect      : false,
					order        : 0
				};

				// Alias the route
				route = this.routes[name];

				// Prepare the connection name
				connectionName = 'Chimera-' + this.routeName + '::' + name;

				// Construct the complete path
				path = '/admin/' + this.routeName + route.route;

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
});