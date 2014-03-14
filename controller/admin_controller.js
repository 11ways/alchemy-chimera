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

	this.modules = alchemy.shared('Chimera.modules');

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
	};

	/**
	 * Handle Chimera Module Actions
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 *
	 * @param   {renderCallback}   render
	 */
	this.chimera_dispatch = function chimera_dispatch(render) {
		
		var params   = render.req.route.params,
		    route    = render.req.alchemyRoute,
		    body     = render.req.body,
		    module   = this.modules[route.options.chimeraModule];

		// Augment the module instance
		module = alchemy.augment(module, this.__augment__);

		// If a module was found, and the action exists, execute it
		if (module && module[route.options.chimeraAction]) {
			
			// Call the beforeAction method
			module.beforeAction(function afterBeforeAction() {
				module[route.options.chimeraAction](render);
			}, render);
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
		this.getNotifications(render, false);
		next();
	};

	/**
	 * The dashboard action
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.dashboard = function dashboard (render) {
		
		this.getNotifications(render, true);

	};
	
	/**
	 * The my_settings action
	 *
	 * @author        Kjell Keisse   <kjell@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.my_settings = function my_settings (render) {
		
		this.getNotifications(render, true);

	};
	
	/**
	 * The website_settings action
	 *
	 * @author        Kjell Keisse   <kjell@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.website_settings = function website_settings (render) {
		
		/*var that = this;
		this.getModel('NotificationMessage').notify('User visited settings page', '', '', '', function(){
			that.getNotifications(render, true);
		});*/
		
		this.getModel('NotificationMessage').notify('User visited settings page');
		this.getNotifications(render, true);
		
	};
	
	
	/**
	 * Update notifications (mark as read)
	 *
	 * @author        Kjell Keisse   <kjell@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.update_notification = function update_notification (render) {

		var conditions = {},
			that = this;
		conditions['NotificationUser._id'] = render.req.params['id'];
		conditions['NotificationUser.user_id'] = render.req.session.user._id;
		this.getModel('NotificationUser').find('first', {conditions: conditions}, function(err, record) {
			
			record[0].NotificationUser.read = true;
			
			that.getModel('NotificationUser').save(record, function(err, result){
				//pr(err);
			});
			
		});
		
	};
	
	/**
	 * Get notifications
	 *
	 * @author        Kjell Keisse   <kjell@codedor.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.getNotifications = function getNotifications (render, must_render) {
		var conditions = {};
		conditions['NotificationUser.user_id'] = render.req.session.user._id;
		this.getModel('NotificationUser').find('all', {conditions: conditions, limit: 10}, function(err, items) {
			
			var unread = 0;
			
			for(var i=0; i<items.length; i++){
				var notification = items[i];
				if(!notification.NotificationUser.read){
					unread++;
				}
			}
			
			render.viewVars.notifications = items;
			render.viewVars.unread = unread;

			if(must_render){
				render();
			}
		});
	};
	
});