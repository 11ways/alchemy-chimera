/**
 * Chimera Action Fields: collection of fields
 *
 * @constructor
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         1.0.0
 * @version       1.0.0
 */
var ActionFields = Function.inherits(function ChimeraActionFields(model, name, options) {

	if (model == null) {
		console.log('No schema given!')
	}

	if (model instanceof Model) {
		this.schema = model.blueprint;
	} else {
		this.schema = model;
	}

	this.name = name;
	this.options = Object.assign({}, options);

	this.groups = new Deck();
});

/**
 * Add a field to this action group
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   name      The name of the field inside the schema
 * @param    {Object}   options
 */
ActionFields.setMethod(function addField(groupName, name, options) {

	var fieldType,
	    group,
	    field;

	if (typeof name !== 'string') {
		options = name;
		name = groupName;
		groupName = null;
	}

	if (this.schema == null) {
		throw new Error('Can not get "' + name + '" from non existing schema (' + this.name + ')');
	}

	// Get the fieldType instance from the model
	fieldType = this.schema.getField(name);

	if (fieldType == null) {
		throw new Error('Field "' + name + '" does not exist inside group "' + groupName + '" of schema "' + (this.schema.name || this.schema.modelName) + '"');
	}

	if (options == null) {
		options = {};
	}

	if (options.action == null) {
		options.action = this.name;
	}

	if (options.group == null) {
		options.group = groupName || 'general';
	}

	// Get the chimera field
	field = fieldType.getChimeraField(options, name);

	// Get the group deck
	group = this.groups.get(options.group, Deck.create);

	group.push(field);
});

/**
 * Get a field
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   name
 *
 * @return   {ChimeraField}
 */
ActionFields.setMethod(function getField(name) {

	var group,
	    field,
	    key,
	    id;

	for (key in this.groups.dict) {
		group = this.groups.dict[key];

		for (id in group.value.dict) {
			field = group.value.dict[id].value;

			if (field.fieldType.name == name) {
				return field;
			}
		}
	}

});

/**
 * Get the fields of a specific group as a deck
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   group      The name of the group (general)
 *
 * @return   {Deck}
 */
ActionFields.setMethod(function getGroup(name, clone) {

	var fieldname,
	    group;

	if (name == null) {
		name = 'general';
	}

	group = this.groups.get(name);

	if (group == null) {
		for (fieldname in this.schema.dict) {
			this.addField(name, fieldname);
		}

		group = this.groups.get(name);
	}

	if (clone == null || clone) {
		group = group.clone();
	}

	return group;
});

/**
 * Process found records
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String|Array|Deck}             groups
 * @param    {Array}                         records
 * @param    {ActionFields~groupedRecords}   callback
 */
ActionFields.setMethod(function processRecords(_groups, model, records, callback) {

	var that = this,
	    groupTasks,
	    length,
	    groups,
	    group,
	    name;

	if (typeof records == 'function') {
		callback = records;
		records = model;
		model = _groups;
		groups = null;
	} else if (typeof _groups === 'string') {
		groups = [_groups];
	} else if (_groups instanceof Deck) {
		groups = Object.keys(_groups.dict);
	}

	// Get all the groups if none were given
	if (groups == null) {

		// If no groups were defined, add everything of the schema to general
		if (this.groups.insertCount === 0) {

			for (name in this.schema.dict) {
				this.addField(name);
			}
		}

		// Get the names of all the defined groups
		groups = Object.keys(this.groups.dict);
	}

	length = records.length;
	groupTasks = {};

	groups.forEach(function eachGroup(groupName) {

		var tasks = new Array(length);

		records.forEach(function eachRecord(record, index) {
			tasks[index] = function taskRecord(nextRecord) {
				that.processRecord(groupName, model, record, nextRecord);
			};
		});

		groupTasks[groupName] = function taskGroup(next) {
			Function.parallel(tasks, next);
		};
	});

	Function.parallel(groupTasks, function doneProcessingGroups(err, results) {
		callback(err, results);
	});
});

/**
 * Process a single record
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}    groupName
 * @param    {Object}    record
 * @param    {Function}  callback
 */
ActionFields.setMethod(function processRecord(groupName, model, record, callback) {

	var that = this,
	    fields,
	    tasks,
	    temp,
	    id;

	if (typeof groupName !== 'string') {
		callback = record;
		record = model;
		model = groupName;
		groupName = 'general';
	}

	if (record != null && record._id != null) {
		id = record._id;
		temp = {};
		temp[model.name] = record;
		record = temp;
	} else if (record != null && record[model.name] != null && record[model.name]._id != null) {
		id = record[model.name]._id;
	}

	tasks = [];
	fields = this.getGroup(groupName, false).getSorted(false);

	fields.forEach(function eachField(field, index) {

		tasks.push(function taskFieldValue(nextValue) {
			field.actionValue(that.name, record, function gotValue(err, result) {

				if (err != null) {
					return nextValue(err);
				}

				nextValue(null, {field: field, value: result});
			});
		});
	});

	Function.parallel(tasks, function afterFieldTasks(err, results) {

		if (err) {
			return callback(err);
		}

		callback(null, {id: id, fields: results});
	});
});