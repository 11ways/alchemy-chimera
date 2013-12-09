/**
 * The Record View chimera page
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Chimera', function RecordViewChimera() {

	this.routeName = 'recordview';

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

			// Construct a path where a possible overridden index view would be
			var ownView = 'admin/' + model.name.underscore() + '/index';
			
			// Expose the (non-sensitive) fields object to the view
			render.viewVars.fields = fields;

			// Expose the items AS-IS to the view
			// Because this happens in the admin, we "trust" the user
			render.viewVars.items = items;

			// Render the ownView or the default view
			render([ownView, 'admin/model_index']);
		});
	}

});