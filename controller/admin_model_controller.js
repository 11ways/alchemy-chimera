/**
 * The Admin Model Controller class
 * Every model creates a class based on this one,
 * eg: NewsAdminController
 *
 * @constructor
 * @extends       alchemy.classes.AdminController
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.0.1
 * @version       0.0.1
 */
BaseClass.extend('AdminController', function AdminModelController (){

	this.preInit = function preInit() {

		this.parent();
	
		// Do not get a model when the controller is created,
		// we'll do that in the init function ourselves.
		this.useModel = false;

		this.components = {paginate: {}};

		/**
		 * These items are hidden by default
		 *
		 * @author        Jelle De Loecker   <jelle@codedor.be>
		 * @since         0.0.1
		 * @version       0.0.1
		 *
		 * @type          {Array}
		 */
		this.hideFields = ['_id', 'created', 'updated'];
	};

	this.augmented = function augmented() {
		this.Model = alchemy.augment(this.Model, this.__augment__);
	};

	/**
	 * Runs when the class is constructed
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.init = function init() {
		
		// Get the ModelName of this controller
		this.ModelName = this.name.replace(/AdminController$/, '').singularize();

		// Store names in here
		this.Names = {};
		this.Names.underscore = this.ModelName.underscore();

		// Get the Model
		this.Model = Model.get(this.ModelName);
		
		// Execute the parent init function
		this.parent('init', null, {});
		
		this.fields = [];
		
		// Add every field in the blueprint to the fields array
		for (var fieldName in this.Model.blueprint) {
			this.fields.push(fieldName);
		}
		
	};
	
	this.beforeAction = function beforeAction(next, render) {
		
		var that = this;

		// Call this parent's before action first
		this.parent('beforeAction', false, function() {

			// Make sure the translation behaviour gets disabled
			that.Model.disableTranslations = true

			// Set the modelName
			render.viewVars.modelName = that.ModelName;
			
			next();
		}, render);

	};
	
	/**
	 * Render the model's index view:
	 * Show a list of all the available records.
	 *
	 * @author        Jelle De Loecker   <jelle@kipdola.be>
	 * @since         0.0.1
	 * @version       0.0.1
	 */
	this.index = function index(render) {

		// Create a reference to the Controller's scope
		var that = this;

		// Find all the records
		//this.Model.find('all', function (err, items) {
		this.component('Paginate').find(this.Model, {}, function (err, items) {

			// Construct a path where a possible overridden index view would be
			var ownView = 'admin/' + that.Names.underscore + '/index';
			
			// Expose the (non-sensitive) fields object to the view
			render.viewVars.fields = that.fields;

			// Expose the items AS-IS to the view
			// Because this happens in the admin, we "trust" the user
			render.viewVars.items = items;

			// Render the ownView or the default view
			render([ownView, 'admin/model_index']);
		});

	};
	
	/**
	 * Render a record edit view
	 */
	this.edit = function edit(render) {
		
		var that       = this,
		    conditions = {},
		    model      = this.getModel(this.Model.modelName);

		if (render.get) {
			conditions['_id'] = render.req.params.id;
			
			model.find('first', {conditions: conditions}, function (err, item) {

				var original = that.Names.underscore,
				    ownView  = 'admin/' + original + '/edit';
				
				render.viewVars.fields = that.fields;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.blueprint = that.Model.blueprint;

				render([ownView, 'admin/model_edit']);
				
			});
		} else if (render.post) {

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data[this.ModelName],
			    fieldName;

			pr(modelData);

			// Clean up the data
			for (fieldName in modelData) {

				// Remove empty string fields if the field type is not a string
				// This is because an empty input field is always interpreted as a string
				// All other fauls deserve to get an error thrown
				if (this.Model.fieldType(fieldName) !== 'string') {
					if (modelData[fieldName] === '') {
						delete modelData[fieldName];
					}
				}
			}

			this.Model.saveOne(modelData, function(err, result) {

				var url;

				log.error(err);
				log.verbose(result);
				
				if (err) {
					// Redirect to an error
					log.error(err);
				} else {

					url = Connection.url('Admin_Controller_Action_Id', {
						params: {
							controller: that.Names.underscore,
							action: 'edit',
							id: result._id
						}
					});

					pr('Redirecting to ' + url)

					render.redirect(url);
				}

			});
		}
	};

	/**
	 * Render a record add view
	 */
	this.add = function add(render) {

		var original = this.ModelName.underscore(),
		    that     = this;

		if (render.get) {
			var ownView = 'admin/' + original + '/add';

			//render.viewVars.fields = alchemy.cloneSafe(this.fields);
			render.viewVars.blueprint = alchemy.cloneSafe(this.Model.blueprint);

			for (var fieldName in render.viewVars.blueprint) {

				if (this.Model.hideFields && this.Model.hideFields.indexOf(fieldName) > -1) {
					delete render.viewVars.blueprint[fieldName];
				}

			}

			render([ownView, 'admin/model_add']);

		} else if (render.post) {

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data[this.ModelName],
			    fieldName;

			// Clean up the data
			for (fieldName in modelData) {

				// Remove empty string fields if the field type is not a string
				// This is because an empty input field is always interpreted as a string
				// All other fauls deserve to get an error thrown
				if (this.Model.fieldType(fieldName) !== 'string') {
					if (modelData[fieldName] === '') {
						delete modelData[fieldName];
					}
				}
			}

			pr('ModelName: ' + this.ModelName);
			pr('Cleaned up data: ')
			pr(data);

			this.Model.saveOne(modelData, function(err, result) {

				log.error(err);
				log.verbose(result);
				
				if (err) {
					// Redirect to an error
					log.error(err);
				} else {
					render.req.params.id = result._id;
					that.edit(render);
				}

			});
		}
	};
	
});

Plugin.chimera.getController = function getAdminController(controllerName) {

	// Make sure the controller name ends with 'Admin'
	if (!controllerName.endsWith('Admin')) controllerName += 'Admin';
	
	// Create an instance of the new controller if it hasn't been made yet
	if (typeof alchemy.instances.controllers[controllerName] === 'undefined') {

		var adminControllerName = controllerName + 'Controller',
		    existingController = Controller.get(adminControllerName),	
		    returnController;
		
		if (existingController) {
			returnController = existingController;
		} else {
			returnController = BaseClass.extend('AdminModelController', {name: adminControllerName, test: true});
		}

		alchemy.instances.controllers[controllerName] = new returnController();
	}
	
	return alchemy.instances.controllers[controllerName];
}