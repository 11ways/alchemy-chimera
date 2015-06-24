/**
 * Chimera Model Configuration
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Model}   ModelClass
 */
var ChimeraConfig = Function.inherits(function ChimeraConfig(ModelClass) {

	// The modal class constructor
	this.ModelClass = ModelClass;

	// The different action groups
	this.actionGroups = {};
});

/**
 * See if this model's blueprint contains translation fields
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {Boolean}
 */
ChimeraConfig.setMethod(function containsTranslations() {

	for (key in this.ModelClass.blueprint) {
		if (this.ModelClass.blueprint[key].translatable) {
			return true;
		}
	}

	return false;
});

/**
 * Get the fields to show in the index
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {Array}
 */
ChimeraConfig.setMethod(function getIndexFields() {

	var modelName,
	    fields = [],
	    key;

	modelName = this.ModelClass.prototype.name;

	return this.ModelClass.blueprint.getSorted();

	for (key in this.ModelClass.blueprint) {
		fields.push({field: modelName + '.' + key, config: this.ModelClass.blueprint[key]});
	}

	if (this.containsTranslations()) {
		fields.push({meta: 'translations'});
	}

	return fields;
});

/**
 * Get the fieldgroup for a specific action
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {Deck}
 */
ChimeraConfig.setMethod(function getActionFields(name) {

	var group;

	if (name == null) {
		throw new Error('No action group name was given');
	}

	if (this.actionGroups[name] == null) {
		group = new alchemy.classes.ChimeraActionFields(this.ModelClass, name);
		this.actionGroups[name] = group;
	} else {
		group = this.actionGroups[name];
	}

	return group;
});

/**
 * Get the fields to show in the given type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {Array}
 */
ChimeraConfig.setMethod(function getFields(type) {

	var fields;

	fields = this.ModelClass.blueprint.getSorted();

	return this.ModelClass.blueprint.clone();
});