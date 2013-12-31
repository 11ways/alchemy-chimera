alchemy.requirePlugin(['styleboost', 'acl', 'jquery', 'jsoneditor']);

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
	contentblock: 'admin-content'

};

// Inject the user-overridden options
alchemy.plugins.chimera = alchemy.inject(options, alchemy.plugins.chimera);

// Get the view settings
var viewSettings = {
	baselayout: alchemy.layoutify(options.baselayout),
	bodylayout: alchemy.layoutify(options.bodylayout),
	bodyblock: options.bodyblock,
	mainblock: options.mainblock,
	contentblock: options.contentblock
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
		if (!result) {
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