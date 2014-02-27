/**
 * The export page
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonExportChimeraView() {

	var nodeExcel = alchemy.use('excel-export');

	/**
	 * Build the view
	 *
	 * @author   Kjell Keisse   <kjell@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.build = function build(render, options) {

		var that = this,
		    paginate = Component.get('Paginate'),
		    fields = [],
		    excludeFields,
		    fieldName,
		    model,
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
		model.disableTranslations = true;

		// Expose the (non-sensitive) fields object to the view
		render.viewVars.fields = fields;

		if (render.get) {
			// Render the default view
			render('chimera/json_export');
		} else if (render.post) {
			var data = render.req.body.data,
			    modelData = data,
			    modelName = model.name.modelName(),
			    export_fields = [],
			    conditions = {},
			    or = {},
			    not = {},
			    andor = data[modelName]['andor'];

			for (var i in fields) {
				var field = fields[i],
					condition = field + '_condition',
					value = field + '_value';

				if (data[modelName][field]) {
					export_fields.push(field);
					var like = new RegExp('.*?' + data[modelName][value].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '.*?');
					var val = data[modelName][value];

					if (data[modelName][condition] === 'like') {
						if(andor == 'or'){
							or[field] = like;
						} else if(andor == 'and') {
							conditions[field] = like;
						}
					} else if (data[modelName][condition] === 'is') {
						if(andor == 'or'){
							or[field] = val;
						} else if(andor == 'and') {
							conditions[field] = val;
						}
					} else if (data[modelName][condition] === 'notlike') {
						not[field] = like;
					} else if (data[modelName][condition] === 'isnot') {
						not[field] = val;
					}
				}
			}

			if (!empty(or)) {
				conditions['$or'] = or;
			}
			if (!empty(not)) {
				conditions['$not'] = not;
			}

			model.find('all', {fields: export_fields, conditions: conditions}, function(err, results) {

				if (!err) {
					//pr(results);
					//pr(export_fields);
					var columns = [];
					var result_rows = [];
					for (var i in export_fields){
						var obj = {caption: export_fields[i], type:'string'};
						columns.push(obj);
					}
					
					delete(results['available']);
					for( var i in results){
						var result = results[i];
						var row = [];
						for (var e in export_fields){
							row.push(result[modelName][export_fields[e]]);
						}
						result_rows.push(row);
					}
					//render('chimera/json_export');

					var conf = {};
					//conf.stylesXmlFile = "styles.xml";
					conf.cols = columns;
					conf.rows = result_rows;
					var result = nodeExcel.execute(conf);
					
					// @todo: integrate this in alchemy
					if (render.req.query._hawkejsAjaxFormTracker) {
						// Set a temporary cookie for tracking the download progress of this form submit
						render.res.cookie(render.req.query._hawkejsAjaxFormTracker, true, {maxAge: 1000*60*5});
					}

					// @todo: make it easier to do this in alchemy itself
					render.res.writeHead(200, {'Content-Type': 'application/vnd.openxmlformats', 'Content-Disposition':"attachment; filename=" + modelName + "_export.xlsx"});
					render.res.end(result, 'binary');

				} else {
					render('chimera/json_export');
				}
			});
		}
	};

	function empty(object) {
		for (var property in object) {
			if (object.hasOwnProperty(property))
				return false;
		}

		return true;
	}
});