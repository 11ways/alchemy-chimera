/**
 * The Admin Route class
 *
 * @constructor
 * @augments alchemy.classes.Route
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Route.extend(function AdminRoute () {
	
	this.parse = function parse (req, res, route, next) {
		
		var c, options = route.options;
		
		// If this entry does not exist in the cache, create it
		if (typeof this.cache[req.url] == 'undefined') {
			
			c = this.cache[req.url] = {};
			
			// Get the controller if it hasn't been set in the options
			if (!options.controller) {
				
				if (req.params.controller) {
					c.controllerName = req.params.controller;
				} else {
					c.controllerName = 'app';
				}
				
			} else {
				c.controllerName = options.controller;
			}
			
			// Make sure the controller name is set propperly
			c.controllerName = c.controllerName.controllerName();
			
			// Get the action if it hasn't been set in the options
			if (!options.action) {
				
				if (req.params.action) {
					c.actionName = req.params.action;
				} else {
					c.actionName = 'notfound';
				}
				
			} else {
				c.actionName = options.action;
			}
			
			// Set the view
			if (!options.view) {
				c.view = 'admin/' + c.controllerName.underscore() + '/' + c.actionName;
			} else {
				c.view = options.view;
			}
			
			// Get the admin controller
			c.controller = Plugin.admin.getController(c.controllerName);
			c.controllerName += 'Admin';
			
		} else {
			c = this.cache[req.url];
		}

		next(c);
		
	}
	
});