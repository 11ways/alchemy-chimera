/**
 * The basic index page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function BaseIndexChimeraView() {

	/**
	 * Build the view
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	this.build = function build(render, options) {

		var that     = this,
		    paginate = Component.get('Paginate'),
		    fields   = [],
		    excludeFields,
		    fieldName,
		    model,
			pageSize,
			modelName,
			lowerModelName,
		    i;

		if (typeof options !== 'object') {
			options = {};
		}

		excludeFields = options.excludeFields;

		if (!Array.isArray(excludeFields)) {
			excludeFields = [];
		}

		// Get the model instance
		if (typeof options.model === 'object') {
			model = options.model;
		} else if (typeof options.model === 'string') {
			model = this.getModel(options.model);
		} else {
			model = this.getModel(render.req.params.model);
		}
		modelName = model.name.modelName();
		lowerModelName = modelName.despace().toLowerCase();

		// Add the model name to the routeVars
		render.viewVars.routeVars.model = model.modelName.underscore();
		render.viewVars.modelName = model.modelName;
		render.viewVars.modelTitle = model.title || model.modelName.titleize();

		// Field information
		render.viewVars.fieldInfo = options.fieldInfo || {};

		// Default field type
		render.viewVars.defaultFieldType = options.defaultFieldType || 'default';

		// If default fields have been given, clone that array
		if (Array.isArray(options.defaultFields)) {
			fields = options.defaultFields.slice(0);
		}

		// Use only the fields given in the options
		if (Array.isArray(options.fields)) {
			for (i = 0; i < options.fields.length; i++) {
				// Only add this field if it doesn't exist yet
				if (fields.indexOf(options.fields[i]) == -1 && excludeFields.indexOf(options.fields[i]) == -1) {
					fields.push(options.fields[i]);
				}
			}
		} else {
			// Add every field in the blueprint to the fields array
			for (fieldName in model.blueprint) {

				// Only add this field if it doesn't exist yet
				if (fields.indexOf(fieldName) == -1 && excludeFields.indexOf(fieldName) == -1) {
					fields.push(fieldName);
				}
			}
		}

		// Make sure the translation behaviour gets disabled
		model.disableTranslations = true

		//PAGE SIZE
		if(model.pageSizes === undefined){
			model.pageSizes = [20, 50, 100];
		}
		render.viewVars.pageSizes = model.pageSizes;
		pageSize = model.pageSizes[0];
		if(render.req.cookies && render.req.cookies[lowerModelName+'_show']){
			pageSize = render.req.cookies[lowerModelName+'_show'];
		}
		if(render.req.body.data && render.req.body.data[modelName]['show']){
			pageSize = render.req.body.data[modelName]['show'];
			if(~model.pageSizes.indexOf(pageSize)){ //in case user tried to edit html and request 9000 items
				pageSize = model.pageSizes[0];
			}
			render.res.cookie(lowerModelName+'_show', render.req.body.data[modelName]['show']);
		}
		render.viewVars.show = pageSize;

		//FILTERS
		var conditions = {},
			or = {},
			not = {},
			filtersRaw = false,
			andorRaw = false;

		render.viewVars.filters = render.viewVars.andor = false;

		//load filters from cookies
		if(render.req.cookies && render.req.cookies[lowerModelName+'_filters'] && render.req.cookies[lowerModelName+'_andor']){
			filtersRaw = render.req.cookies[lowerModelName+'_filters'];
			andorRaw = render.req.cookies[lowerModelName+'_andor'];
		}
		//override in case new filters were submitted
		if (render.req.body.data && render.req.body.data[modelName]['filters']) {
			if(render.req.body.data[modelName]['filters']!=='[]'){
				filtersRaw = render.req.body.data[modelName]['filters'];
				andorRaw = render.req.body.data[modelName]['andor'];
			} else {
				filtersRaw = andorRaw = false;
				render.res.clearCookie(lowerModelName + '_filters');
				render.res.clearCookie(lowerModelName + '_andor');
			}
		}

		if(filtersRaw && andorRaw){
			render.viewVars.filters = filtersRaw;
			var filters = JSON.parse(filtersRaw);
			var andor = render.viewVars.andor = andorRaw;

			for(var i in filters){
				var filter = filters[i];
				var like = new RegExp('.*?' + filter.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '.*?', 'i');
				var value = filter.value;
				var field = filter.name.despace().toLowerCase();

				if (filter.condition === 'like') {
					if(andor == 'or'){
						or[field] = like;
					} else if(andor == 'and') {
						conditions[field] = like;
					}
				} else if (filter.condition === 'is') {
					if(andor == 'or'){
						or[field] = value;
					} else if(andor == 'and') {
						conditions[field] = value;
					}
				} else if (filter.condition === 'notlike') {
					not[field] = like;
				} else if (filter.condition === 'isnot') {
					not[field] = value;
				}
			}
			if (!empty(or)) {
				conditions['$or'] = or;
			}
			if (!empty(not)) {
				conditions['$not'] = not;
			}
			render.res.cookie(lowerModelName + '_filters', filtersRaw);
			render.res.cookie(lowerModelName + '_andor', andorRaw);
		}
		
		// Find all the records
		//this.Model.find('all', function (err, items) {
		//model.find('all', function (err, items) {
		paginate.find(model, {recursive: 0, pageSize: pageSize, conditions:conditions}, function (err, items) {

			// Expose the (non-sensitive) fields object to the view
			render.viewVars.fields = fields;

			// Expose the items AS-IS to the view
			// Because this happens in the admin, we "trust" the user
			render.viewVars.items = items;

			// Render the default view
			render('admin/model_index');
		});
	};
	
	function empty(object) {
		for (var property in object) {
			if (object.hasOwnProperty(property))
				return false;
		}

		return true;
	}
});