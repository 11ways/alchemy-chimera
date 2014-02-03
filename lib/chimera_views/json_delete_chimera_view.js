/**
 * The delete record page
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonDeleteChimeraView() {

	/**
	 * Build the view
	 *
	 * @author   Kjell Keisse   <kjell@codedor.be>
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
		render.view = 'chimera/json_delete';

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
		render.viewVars.deleteButton = __('chimera', 'Delete record');
		render.viewVars.showActions = ['paginate', 'record'];
		render.viewVars.postUrl = module.getActionUrl('delete', urlParams);

		render.viewVars.deleteTitle = __('chimera', 'Delete record');

		// Add every field in the blueprint to the fields array
		for (fieldName in model.blueprint) {
			fields.push(fieldName);
		}

		conditions['_id'] = render.req.params.id;

		// Handle GET requests
		// Also use this when onlyView is enabled (it allows no post requests);
		if (render.get) {
						
			model.find('first', {conditions: conditions}, function (err, item) {

				var original = model.name.modelName();

				item = item[0];
				
				render.viewVars.fields = fields;
				render.viewVars.__current__ = item;
				render.viewVars.item = item;
				render.viewVars.blueprint = model.blueprint;
				render.viewVars.routeVars.id = item[original]._id;

				render();
			});
		} else if (render.post) {
			// Create references to the data
			var data       = render.req.body.data,
			    modelData  = data,
				modelName  = model.name.modelName();
					
			// Save the data. Allow any data through the json edit
			model.remove(modelData._id, function(err) {

				var url;

				if (err) {
					// Redirect to an error
					log.error(err);
				} else {
					url = module.getActionUrl('index').replace(':model', modelName);
					render.redirect(url);
				}

			});
		}
	};
});