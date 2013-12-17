/**
 * The basic index page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonEditChimeraView() {

	/**
	 * Build the view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.build = function build(render, options) {

		var that       = this,
		    conditions = {},
		    fields     = [],
		    fieldName,
		    model;

		if (typeof options !== 'object') {
			options = {};
		}

		// Get the model instance
		if (typeof options.model === 'object') {
			model = options.model;
		} else if (typeof options.model === 'string') {
			model = this.getModel(options.model);
		} else {
			model = this.getModel(render.req.params.model);
		}

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