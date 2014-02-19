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
	this.build = function build(render, module, options) {

		var that       = this,
		    conditions = {},
		    fields     = [],
		    urlParams  = render.req.route.params,
		    fieldName,
		    model;

		// Already set the view file
		render.view = 'chimera/json_edit';

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
		render.viewVars.saveButton = __('chimera', 'Save record');
		render.viewVars.showActions = ['paginate', 'record'];
		render.viewVars.postUrl = module.getActionUrl('edit', urlParams);

		if (options.onlyView) {
			render.viewVars.showSaveButton = false;
			render.viewVars.editTitle = __('chimera', 'View record');
		} else {
			render.viewVars.editTitle = __('chimera', 'Edit record');
		}

		// Add every field in the blueprint to the fields array
		for (fieldName in model.blueprint) {
			fields.push(fieldName);
		}

		conditions['_id'] = render.req.params.id;

		// Handle GET requests
		// Also use this when onlyView is enabled (it allows no post requests);
		if (render.get || options.onlyView) {
			
			model.find('first', {conditions: conditions}, function (err, item) {

				var original = model.name.modelName();

				item = item[0];
				
				render.viewVars.fields = fields;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.blueprint = model.blueprint;
				render.viewVars.routeVars.id = item[original]._id;
				render.viewVars.modelTitle = model.title || model.modelName.titleize();

				render();
			});
		} else if (render.post) {

			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data,
			    fieldType,
			    fieldName;

			// Get the original record
			model.find('first', {conditions: conditions}, function(err, item) {

				item = item[0];

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

				// Go over all the fieldnames in the original and
				// remove deleted fields
				for (fieldName in item[model.modelName]) {

					if (!(fieldName in modelData)) {
						console.log('Field ' + fieldName + ' is not in the data');
						modelData[fieldName] = undefined;
					}
				}

				// Save the data. Allow any data through the json edit
				model.save(modelData, {fieldList: false}, function(err, result) {

					var url;

					log.error(err);
					log.verbose(result);
					
					if (err) {
						// Redirect to an error
						log.error(err);
					} else {

						url = module.getActionUrl('edit', urlParams);
						render.redirect(url);
					}

				});
			});
		}
	};
});