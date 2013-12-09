/**
 * The JSON View chimera page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Chimera', function JsonViewChimera() {

	this.routeName = 'jsonview';

	this.routes = {
		'index': {
			route: '/:model/index'
		},
		'view': {
			route: '/:model/view/:id'
		},
		'edit': {
			route: '/:model/edit/:id'
			
		}
	};

	/**
	 * The index json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.index = function index(render) {

		var that     = this,
		    model    = this.getModel(render.req.params.model),
		    paginate = Component.get('Paginate'),
		    fields   = [],
		    fieldName;

		// Add every field in the blueprint to the fields array
		for (fieldName in model.blueprint) {
			fields.push(fieldName);
		}

		// Make sure the translation behaviour gets disabled
		model.disableTranslations = true

		// Set the modelName
		render.viewVars.modelName = model.name.modelName();

		// Find all the records
		//this.Model.find('all', function (err, items) {
		//model.find('all', function (err, items) {
		paginate.find(model, {}, function (err, items) {

			// Expose the (non-sensitive) fields object to the view
			render.viewVars.fields = fields;

			// Expose the items AS-IS to the view
			// Because this happens in the admin, we "trust" the user
			render.viewVars.items = items;

			render.viewVars.editconnection = '/admin/jsonview/:modelname/edit/:id';

			// Render the default view
			render('admin/model_index');
		});
	};

	/**
	 * The edit json view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.edit = function edit(render) {

		var that       = this,
		    conditions = {},
		    fields     = [],
		    model      = this.getModel(render.req.params.model),
		    fieldName;

		// Make sure the translation behaviour gets disabled
		model.disableTranslations = true

		// Set the modelName
		render.viewVars.modelName = model.name.modelName();

		// Add every field in the blueprint to the fields array
		for (fieldName in model.blueprint) {
			fields.push(fieldName);
		}

		if (render.get) {
			conditions['_id'] = render.req.params.id;
			
			model.find('first', {conditions: conditions}, function (err, item) {

				var original = model.name.modelName();
				
				render.viewVars.fields = fields;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.blueprint = model.blueprint;

				render('chimera/json_edit');
				
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

});