var ChimeraController,
    options;

alchemy.requirePlugin(['acl', 'menu']);

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

	// The default theme to use
	theme: 'ajatar',

	// The title to show in the top left corner
	title: 'Alchemy Admin'
};

// Inject the user-overridden options
alchemy.plugins.chimera = Object.merge(options, alchemy.plugins.chimera);
global.chimera = alchemy.plugins.chimera;

if (!alchemy.plugins.acl) {
	alchemy.plugins.acl = {placeholders: {}}
	log.todo('Acl settings for Chimera');
}

// Set the acl placeholder variable
//alchemy.plugins.acl.placeholders.chimeraRouteName = alchemy.plugins.chimera.routename;

// Construct the view settings
options.view_settings = {
	baselayout     : 'layouts/' + options.baselayout,
	bodylayout     : 'layouts/' + options.bodylayout,
	bodyblock      : options.bodyblock,
	mainblock      : options.mainblock,
	contentblock   : options.contentblock,
	theme          : options.theme,
	title          : options.title
};

if (options.theme == 'ajatar') {
	alchemy.usePlugin('ajatar-theme');
}

/**
 * Function to asynchronously get the menu item
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @param    {Function}   callback
 */
alchemy.plugins.chimera.getMenu = function getMenu(callback) {
	alchemy.plugins.menu.getDefault('chimera_menu', callback);
};

/**
 * Backwards compatibility for synchronously adding items
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
alchemy.plugins.chimera.menu = {
	set : function set(name, options, weight) {
		alchemy.plugins.chimera.getMenu(function gotMenu(err, menu) {

			var config = {
				title     : name,
				settings  : options,
				weight    : weight
			};

			if (options.icon) {
				options.decoration = options.icon;
			}

			menu.addItem('route', config);
		});
	}
};

/**
 * Get the chimera menu and add some entries
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
alchemy.plugins.chimera.getMenu(function gotMenu(err, menu) {

	// Set the position name
	menu.position_name = 'chimera_main_sidebar';

	// Set the title
	menu.title = __('chimera', 'Chimera');

	/**
	 * Add the dashboard to the menu
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.0
	 */
	menu.addItem('route', {
		weight     : 9999,
		settings   : {
			title  : __('chimera', 'Dashboard'),
			route  : 'chimera@Dashboard',
			decoration  : {
				icon    : {
					svg : 'chimera/home'
				}
			}
		}
	});

	/**
	 * Add the users model to the menu
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.0
	 */
	menu.addItem('route', {
		weight     : 9900,
		settings   : {
			title  : __('chimera', 'Users'),
			route  : 'chimera@ModelAction',
			parameters  : {
				controller : 'Editor',
				subject    : 'user',
				action     : 'index'
			},
			decoration  : {
				icon    : {
					svg : 'chimera/office-worker'
				}
			}
		}
	});
});

var ChimeraController = Function.inherits('Alchemy.Controller', function ChimeraController(conduit, options) {

	Controller.call(this, conduit, options);

	// @TODO: move to the prototype
	this.name = this.constructor.name.beforeLast('ChimeraController');

	// Set the theme
	this.viewRender.setTheme(alchemy.plugins.chimera.theme);

	this.actions = {};
});

/**
 * Add a chimera action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
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

/**
 * Get all chimera actions
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
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

/**
 * Ensure Chimera ACL rules are set,
 * don't start the server before it's done
 */
alchemy.sputnik.beforeSerial('startServer', function beforeStartServer(done) {

	var AclRule = Model.get('AclRule'),
	    rules;

	rules = [
		{
			// Deny "everyone" group access to chimera section
			_id              : '52efff0000a1c00002000000',
			type             : 'route_acl_rule_type',
			target_groups_id : [alchemy.plugins.acl.EveryoneGroupId],
			settings         : {
				section : 'chimera',
				allow   : false,
				weight  : 9999
			}
		},
		{
			// Allow "everyone" group access to chimera section
			_id              : '52efff0000a1c00002000001',
			type             : 'route_acl_rule_type',
			target_groups_id : [alchemy.plugins.acl.SuperUserGroupId],
			settings         : {
				section : 'chimera',
				allow   : true,
				weight  : 100
			}
		}
	];

	AclRule.ensureIds(rules, function doneEnsuring(err) {

		if (err) {
			return log.error('Can not start server, error ensuring ACL rules.', {err: err});
		}

		done();
	});
});

/*
{
    "_id" : ObjectId("58457c242ceac61b95d09e19"),
    "created" : ISODate("2016-12-05T14:39:39.641Z"),
    "updated" : ISODate("2016-12-05T22:35:32.593Z"),
    "type" : "route_acl_rule_type",
    "settings" : {
        "section" : "chimera"
    },
    "target_groups_id" : [ 
        ObjectId("52efff000001000001000000")
    ]
}
*/