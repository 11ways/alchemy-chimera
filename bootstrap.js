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

pr(options);

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