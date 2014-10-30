/**
 * The Chimera Behaviour
 *
 * @constructor
 * @extends       alchemy.classes.Behaviour
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         1.0.0
 * @version       1.0.0
 */
var Chimera = Function.inherits('Behaviour', function ChimeraBehaviour(model, options) {

	Behaviour.call(this, model, options);

});

/**
 * Actiongroups will be stored in here
 *
 * @type   {Object}
 */
Chimera.prepareProperty('actionGroups', Object);

/**
 * See if this model's blueprint contains translation fields
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {Boolean}
 */
Chimera.setMethod(function containsTranslations() {

	for (key in this.model.blueprint) {
		if (this.model.blueprint[key].translatable) {
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
Chimera.setMethod(function getIndexFields() {

	var modelName,
	    fields = [],
	    key;

	modelName = this.model.name;

	return this.model.blueprint.getSorted();

	for (key in this.model.blueprint) {
		fields.push({field: modelName + '.' + key, config: this.model.blueprint[key]});
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
Chimera.setMethod(function getActionFields(name) {

	var group;

	if (name == null) {
		throw new Error('No action group name was given');
	}

	if (this.actionGroups[name] == null) {
		group = new alchemy.classes.ChimeraActionFields(this.model, name);
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
Chimera.setMethod(function getFields(type) {

	var fields;

	fields = this.model.blueprint.getSorted();

	return this.model.blueprint.clone();
});

/**
 * Get a specific field
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {ChimeraField}
 */
Chimera.setMethod(function getField(actionName, fieldName) {

	var actionFields,
	    subschema,
	    pieces,
	    field,
	    first,
	    temp;

	if (fieldName == null) {
		fieldName = actionName;
		actionName = 'edit';
	}

	pieces = fieldName.split('.');

	// Remove the first piece if it's just this model name
	if (pieces[0] == this.model.name) {
		pieces.shift();
	}

	first = pieces.shift();
	field = this.actionGroups[actionName].getField(first);

	while (pieces.length > 0) {
		// Get the subschema of this field
		subschema = field.fieldType.fieldSchema;

		// Create a new actionfields object
		actionFields = new alchemy.classes.ChimeraActionFields(subschema, actionName);

		// Get the next fieldname to get
		temp = pieces.shift();

		// Add the field to get to the actionfields,
		// so it can init everything it needs to init
		actionFields.addField(temp);

		// Get the inited chimerafield we just added
		field = actionFields.getField(temp);
	}

	return field;
});