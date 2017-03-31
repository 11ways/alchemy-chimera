/**
 * Chimera Model Configuration Class:
 * Every model class has access to this via
 * the `chimera` static property
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Model}   ModelClass
 */
var ChimeraConfig = Function.inherits('Alchemy.Base', function ChimeraConfig(ModelClass) {

	// The modal class constructor
	this.ModelClass = ModelClass;

	// The different action groups
	this.actionGroups = {};
});

/**
 * Show filter fields on index pages
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type     {Boolean}
 */
ChimeraConfig.setProperty('show_index_filters', true);

/**
 * See if this model's blueprint contains translation fields
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @return   {Deck}
 */
ChimeraConfig.setMethod(function getActionFields(name) {

	var group;

	if (name == null) {
		throw new Error('No action group name was given');
	}

	if (this.actionGroups[name] == null) {
		group = new Classes.Alchemy.ChimeraActionFields(this.ModelClass, name);
		this.actionGroups[name] = group;
	} else {
		group = this.actionGroups[name];
	}

	return group;
});

/**
 * Get the fields to show in the given type
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Array}
 */
ChimeraConfig.setMethod(function getFields(type) {

	var fields;

	fields = this.ModelClass.blueprint.getSorted();

	return this.ModelClass.blueprint.clone();
});

/**
 * Get a specific field
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {String}   actionName   Like edit, list, ...
 * @param    {String}   fieldName    Fieldname path
 * @param    {Object}   record       Optional record
 *
 * @return   {ChimeraField}
 */
ChimeraConfig.setMethod(function getField(actionName, fieldName, record) {

	var actionFields,
	    subschema,
	    subrecord,
	    pieces,
	    field,
	    first,
	    temp;

	if (fieldName == null || typeof fieldName == 'object') {
		record = fieldName;
		fieldName = actionName;
		actionName = 'edit';
	}

	pieces = fieldName.split('.');

	// Remove the first piece if it's just this model name
	if (pieces[0] == this.ModelClass.modelName) {
		pieces.shift();
	}

	first = pieces.shift();

	// If the action group isn't defined,
	// get nothing
	if (this.actionGroups[actionName] == null) {
		return;
	}

	field = this.actionGroups[actionName].getField(first);

	// We might need to get something out of the record, too
	subrecord = record;

	while (pieces.length > 0) {

		// Get the subschema of this field
		subschema = field.fieldType.getSubschema(subrecord, fieldName);

		if (!subschema) {
			return;
		}

		// Create a new actionfields object
		actionFields = new Classes.Alchemy.ChimeraActionFields(subschema, actionName);

		// Get the next fieldname to get
		temp = pieces.shift();

		// If this field was a subschema, change the subrecord too
		if (field.fieldType.typename == 'Schema') {
			subrecord = Object.path(subrecord, field.path);
		}

		// @TODO: When encountering numbers,
		// it's probably an arrayable field,
		// and we can't use that to get the actual field definition
		if (Number.isInteger(Number(temp))) {

			if (Array.isArray(subrecord)) {
				subrecord = subrecord[temp];
			}

			// It was a number, skip to the next piece
			temp = pieces.shift();
		}

		// Add the field to get to the actionfields,
		// so it can init everything it needs to init
		actionFields.addField(temp);

		// Get the inited chimerafield we just added
		field = actionFields.getField(temp);
	}

	return field;
});