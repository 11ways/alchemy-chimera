alchemy.requirePlugin('widget');
alchemy.requirePlugin('form');

/**
 * Convert a model name to an string to be used in a url
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 *
 * @param    {string}   model_name
 */
Plugin.modelNameToUrl = function modelNameToUrl(model_name) {

	let path = Blast.parseClassPath(model_name),
	    result = [];

	for (let entry of path) {
		result.push(entry.underscore());
	}

	return result.join('.');
};

// Load the following files right now:
Plugin.useOnce('lib/chimera_config');
Plugin.useOnce('model/model');
