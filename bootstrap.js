alchemy.requirePlugin('widget');

// Define the default options
let options = {
	// The name to use in the routing
	base_path: 'chimera',

	// Use a custom theme?
	theme    : false
};

// Inject the user-overridden options
alchemy.plugins.chimera = Object.merge(options, alchemy.plugins.chimera);