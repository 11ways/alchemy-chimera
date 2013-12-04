/**
 * The base admin Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model._extend(function AdminModel (){

	this.preInit = function preInit() {
		this.parent();
		this.hideFields = ['_id', 'created', 'updated'];
	};

	this.init = function init () {
		this.parent();

		// Cut off the 'Admin' part of the name
		var NormalModelName = this.modelName.substr(0, this.modelName.length-5);

		this.Original = Model.get(NormalModelName);
	}

	this.augmented = function augmented() {
		pr(this.modelName);
		pr('AdminModel was augmented!');
	};
	
});

/**
 * Get an admin model
 *
 * @param    {String}       modelName   The model to get
 * 
 * @return   {AdminModel}
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Plugin.admin.getModel = function getAdminModel (modelName) {
	
	var adminModelName = modelName + 'AdminModel';
	
	var existingModel = Model.get(adminModelName, false);
	
	var returnModel;
	
	if (existingModel) {
		returnModel = existingModel;
	} else {
		returnModel = BaseClass.extend('AdminModel', {name: adminModelName}, function(){});
	}
	
	// Create an instance of the new controller if it hasn't been made yet
	if (typeof alchemy.instances.models[adminModelName] == 'undefined') {
		alchemy.instances.models[adminModelName] = new returnModel({table: modelName.tableize()});
	}
	
	return alchemy.instances.models[adminModelName];
};