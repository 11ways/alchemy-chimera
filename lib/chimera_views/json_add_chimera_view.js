/**
 * The basic index page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonAddChimeraView() {

	/**
	 * Build the view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.build = function build(render, module, options) {

		var that       = this,
		    conditions = {},
		    fields     = [],
		    urlParams  = render.req.route.params,
		    fieldName,
		    model;

		// Already set the view file
		render.view = 'chimera/json_add';

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
		model.disableTranslations = true;

		// Add the model name to the routeVars
		render.viewVars.routeVars.model = model.modelName.underscore();
		render.viewVars.modelName = model.modelName;

		// Add every field in the blueprint to the fields array
		for (fieldName in model.blueprint) {
			fields.push(fieldName);
		}

		render.viewVars.postUrl = module.getActionUrl('add', urlParams);

		if (render.get) {
			
			var original = model.name.modelName();
			
			render.viewVars.fields = fields;
			render.viewVars.__current__ = false;
			render.viewVars.item = false;
			render.viewVars.blueprint = model.blueprint;
			
			render();

		} else if (render.post) {

			pr('Saving new item!', true)

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data,
			    fieldType,
			    fieldName;

			// Clean up the data
			for (fieldName in modelData) {

				// Get this fieldType
				fieldType = model.fieldType(fieldName);

				// Remove empty string fields if the field type is not a string
				// This is because an empty input field is always interpreted as a string
				// All other faults deserve to get an error thrown
				if (fieldType !== 'string') {

					if (modelData[fieldName] === '') {
						delete modelData[fieldName];
						continue;
					}

					// Convert date strings back to a real date
					if (fieldType === 'date') {
						modelData[fieldName] = new Date(modelData[fieldName]);
					}
				}
			}

			pr('Going to save modeldata!');
			pr(modelData, true);

			// Save the data. Allow any data through the json add
			model.save(modelData, {fieldList: false}, function(err, result) {

				var params = {},
				    item,
				    url;

				log.error(err);
				log.verbose(result);

				if (err) {
					// Redirect to an error
					log.error(err);
				} else {

					// Inject the url params into a new object
					alchemy.inject(params, urlParams);

					item = result[0].item;

					// Set the ID
					params.id = item._id;
					url = module.getActionUrl('edit', params);

					render.redirect(url);
				}

			});
		}
	};
});