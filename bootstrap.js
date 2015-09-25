var ChimeraController,
    options;

// Define the default options
options = {

	// The name of the base layout
	baselayout: 'admin_base',

	// The name of the body layout
	bodylayout: 'admin_body',

	// The name of the body block
	bodyblock: 'admin-body',

	// The name of the main block
	mainblock: 'admin-main',

	// The name of the content block
	contentblock: 'admin-content',

	// The name to use in the routing
	routename: 'chimera',

	// The title to show in the top left corner
	title: 'Alchemy Admin'

};

// Inject the user-overridden options
alchemy.plugins.chimera = Object.merge(options, alchemy.plugins.chimera);

if (!alchemy.plugins.acl) {
	alchemy.plugins.acl = {placeholders: {}}
	log.todo('Acl settings for Chimera');
}

// Set the acl placeholder variable
//alchemy.plugins.acl.placeholders.chimeraRouteName = alchemy.plugins.chimera.routename;

// Construct the view settings
options.view_settings = {
	baselayout: 'layouts/' + options.baselayout,
	bodylayout: 'layouts/' + options.bodylayout,
	bodyblock: options.bodyblock,
	mainblock: options.mainblock,
	contentblock: options.contentblock,
	title: options.title
};

// Create the menu deck
options.menu = new Deck();

var ChimeraController = Function.inherits('Controller', function ChimeraController(conduit, options) {

	Controller.call(this, conduit, options);

	this.name = this.constructor.name.beforeLast('ChimeraController');

	this.actions = {};
});

ChimeraController.setMethod(function addAction(type, fncname, options) {

	var obj;

	if (options == null) {
		options = {};
	}

	obj = this.getActions(type);

	options.type = type;

	if (options.title == null) {
		options.title = fncname.humanize();
	}

	if (options.controller == null) {
		options.controller = this.name.underscore();
	}

	options.name = fncname;

	obj.set(fncname, options);
});

ChimeraController.setMethod(function getActions(type) {

	if (this.actions == null) {
		this.actions = {};
	}

	if (type == null) {
		return this.actions;
	}

	if (this.actions[type] == null) {
		this.actions[type] = new Deck();
	}

	return this.actions[type];
});