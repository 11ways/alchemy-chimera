/**
 * The Admin Controller class
 *
 * @constructor
 * @extends       alchemy.classes.Controller
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.0.1
 * @version       0.0.1
 */
var AdminController = Controller._extend(function AdminController (){

	this.types = alchemy.shared('Chimera.types');

	/**
	 * Pre-init constructor, for properties
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.preInit = function preInit() {
		this.parent();
		this.useModel = false;
	};
	
	/**
	 * Runs when the class is constructed
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.init = function init () {
		this.parent();
	}

	this.chimera_dispatch = function chimera_dispatch(render) {
		
		var params   = render.req.route.params,
		    route    = render.req.alchemyRoute,
		    body     = render.req.body,
		    chimera  = this.types[route.options.chimeraType];

		// augment the chimera instance
		chimera = alchemy.augment(chimera, this.__augment__);

		if (chimera && chimera[route.options.chimeraAction]) {
			chimera[route.options.chimeraAction](render);
		} else {
			// @todo: redirect error
			render();
		}
		
	};
	
	/**
	 * Runs before any action
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.beforeAction = function beforeAction (next, render) {
		
		var modelName, models = {};
		
		for (modelName in alchemy.models) {
			if (alchemy.models[modelName].admin !== false) {
				
				models[modelName] = {
					options: {
						title: modelName
					},
					href: '/admin/' + modelName.underscore()
				};
				
			}
		}
		
		render.viewVars.adminLinks = models;
		next();
	}

	/**
	 * The dashboard action
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.dashboard = function dashboard (render) {
		render();
	}
	
});