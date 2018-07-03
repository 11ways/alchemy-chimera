/**
 * The Chimera Settings Controller class
 *
 * @author        Kjell Keisse   <kjell@codedor.be>
 * @since         0.2.0
 * @version       0.3.0
 */
var Settings = Function.inherits('Alchemy.Controller.Chimera.Editor', function Setting(conduit, options) {

	Setting.super.call(this, conduit, options);

	this.addComponent('paginate');

	//this.addAction('draft', 'save', {handleManual: true});
	this.addAction('record', 'save', {title: '<span class="fi-save"></span>', handleManual: true});

});

/**
 * The index action
 *
 * @param   {Conduit}   conduit
 */
Settings.setAction(function index(conduit) {

	var that = this,
	    modelName = 'settings',
	    model = Model.get(modelName);

	model.find('first', function gotResult(err, settings){
		if(settings.available){
			return that.edit(conduit);
		} else {
			model.save({email: ''}, {create: true}, function afterSave(err) {
				model.find('first', function gotResult(err, settings){
					return that.edit(conduit);
				});
			});
		}
	});

});

/**
 * The edit action
 *
 * @param   {Conduit}   conduit
 */
Settings.setAction(function edit(conduit) {

	var that = this,
	    modelName = 'settings',
	    model = Model.get(modelName),
	    chimera = model.constructor.chimera,
	    id;

	model.find('first', function gotResult(err, settings){

		id = settings._id;

		var actionFields = chimera.getActionFields('edit'),
		    groups = actionFields.groups.clone();

		actionFields.processRecords(model, settings, function groupedRecords(err, groups) {

			if (err) {
				return conduit.error(err);
			}

			that.set('groups', groups);
			that.set('actions', that.getActions());
			that.set('modelName', modelName);
			that.set('pageTitle', modelName.humanize());
			that.internal('modelName', modelName);
			that.internal('recordId', id);

			that.render('chimera/editor/edit');

		});
	});

	
});

/**
 * The save action
 *
 * @param   {Conduit}   conduit
 */
Settings.setAction(function save(conduit) {

	var that = this,
	    actionFields,
	    modelName,
	    chimera,
	    options,
	    groups,
	    record,
	    model,
	    data,
	    id;

	modelName = 'settings';
	model = Model.get(modelName);

	chimera = model.constructor.chimera;
	data = conduit.body.data;
	actionFields = chimera.getActionFields('edit');
	groups = actionFields.groups.clone();

	model.find('first', function gotResult(err, settings){

		id = settings._id;

		record = data[modelName.classify()];
		record._id = alchemy.castObjectId(id);

		options = {};

		// Force create, even though an _id could be given
		if (conduit.body.create === true) {
			options.create = true;
		}

		model.save(record, options, function afterSave(err) {
			that.edit(conduit);
		});
	});
});