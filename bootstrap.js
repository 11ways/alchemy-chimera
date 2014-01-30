alchemy.requirePlugin(['styleboost', 'acl', 'jquery', 'jsoneditor', 'select2']);

// Define the default options
var options = {

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
alchemy.plugins.chimera = alchemy.inject(options, alchemy.plugins.chimera);

// Set the acl placeholder variable
alchemy.plugins.acl.placeholders.chimeraRouteName = alchemy.plugins.chimera.routename;

// Get the view settings
var viewSettings = {
	baselayout: alchemy.layoutify(options.baselayout),
	bodylayout: alchemy.layoutify(options.bodylayout),
	bodyblock: options.bodyblock,
	mainblock: options.mainblock,
	contentblock: options.contentblock,
	title: options.title
};

// Send the acl layout options to the client
alchemy.on('render.callback', function(render, callback) {

	// Only send this data on the initial pageload
	if (!render.ajax) {
		render.store('chimera-view-setting', viewSettings);
	}
	
	callback();
});

// Make sure the chimera-sidebar menu exists
alchemy.ready(function checkChimeraSidebar() {
	var Menu = Model.get('Menu');

	Menu.find('first', {conditions: {name: 'chimera-sidebar'}}, function (err, result) {
		
		// If no result was found, create one!
		if (!result.length) {
			var data = {
				Menu: {
					name: 'chimera-sidebar'
				},
				MenuPiece: [
					{
						"settings" : {
							"module" : "model_editor",
							"target" : "",
							"parent" : "",
							"order" : 5
						},
						"type" : "chimera_module"
					},
					{
						"settings" : {
							"module" : "json",
							"target" : "",
							"parent" : "",
							"order" : 10
						},
						"type" : "chimera_module"
					}
				]
			};

			Menu.save(data, function(err, result) {
				if (err) {
					log.error('Failed to create chimera-sidebar menu:');
					log.error(err);
				}
			});
		}

	});

});

// Make sure the Administrator ACL group exists
alchemy.ready(function checkChimeraACLGroups() {
	var AclGroup = Model.get('AclGroup'),
	    AclPermission = Model.get('AclPermission');
	
	AclGroup.find('first', {conditions: {name: 'Administrator'}}, function (err, result) {

		// If no result was found, create one!
		if (!result.length) {
			var data = {
				AclGroup: {
					name: 'Administrator'
				},
				AclPermission: [
					{
						"target" : "group",
						"type" : "url",
						"parent_name" : "/%chimeraRouteName%(/.*?|)",
						"child_name" : "",
						"halt" : false,
						"order" : 10,
						"allow" : true
					}
				]
			};

			// Also create an AclPermission to restrict everyone else from entering
			var permissionData = {
				AclPermission: {
					"target" : "everyone",
					"type" : "url",
					"parent_name" : "/%chimeraRouteName%(/.*?|)", // Anything starting with 'admin/' is forbidden
					"child_name" : "",
					"halt" : false,
					"order" : 10,
					"allow" : false
				}
			};

			// Save the group + amdinistrator permission
			AclGroup.save(data, function(err, result) {
				if (err) {
					log.error('Failed to create Administrators ACL group:');
					log.error(err);
				}
			});

			// And save the permission for everyone else
			AclPermission.save(permissionData, function(err, result) {
				if (err) {
					log.error('Failed to save permission to restrict users from Chimera pages');
					log.error(err);
				}
			});
		}
	});
});