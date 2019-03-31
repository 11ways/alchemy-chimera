/**
 * The client side ChimeraFieldWrapper class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}   options
 */
var ChimeraFieldWrapper = Function.inherits('Informer', function ChimeraFieldWrapper(options) {

	if (!options) {
		throw new Error('No options given for Chimera field wrapper');
	}

	// Field data
	this.field = options.field || options.variables.data.field;

	// The name of the field, for debugging purposes mainly
	this.name = this.field.path;

	// The viewname to render
	this.viewname = options.viewname;

	// The value of this field
	if ('value' in options) {
		this.value = options.value;
	} else {
		this.value = options.variables.data.value;
	}

	// The variables passed to the rendering element
	this.variables = options.variables;

	// The container element, with the 'chimeraField-container' CSS class
	this.container = options.container;

	// The entries wrapper
	this.entries_wrapper = options.entries_wrapper || options.container.querySelector('[data-he-name="entries"]');

	// Store this instance on the entries wrapper element and the container
	this.container.CFWrapper = this;
	this.entries_wrapper.CFWrapper = this;

	// Get the entries id
	this.entries_id = this.entries_wrapper.getAttribute('data-entries-id');

	// Get the actual entries (live list)
	this.entries = this.entries_wrapper.getElementsByClassName('cfe-' + this.entries_id);

	// See if this field is nested inside another field
	this.nested_in = options.nested_in;

	// Store the initial value
	this.original_value = this.value;

	// Available prefixes array
	this.prefixes = options.prefixes || this.variables.prefixes;

	// Prefix containers
	this.prefixContainers = null;

	// The currently showing prefix
	this.activePrefix = null;

	// The action name
	this.action = this.field.viewaction;

	// Is this an arrayable field?
	this.isArray = this.field.fieldType.is_array;

	// Is this a translatable field?
	this.isTranslatable = this.field.fieldType.is_translatable;

	// Is this a field translatable field?
	this.fieldTranslatable = this.field.fieldType.field_translatable;
	this.valueTranslatable = this.field.fieldType.value_translatable;

	// Field instances
	this.fields = [];

	// Is this a read-only field?
	if ('read_only' in options) {
		this.readOnly = options.read_only;
	} else {
		this.readOnly = this.variables.__chimeraReadOnly === true;
	}

	this.initFields();
	this.addButtons();
});

/**
 * Static create method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraFieldWrapper.setStatic(function create(options) {
	return new this(options);
});

/**
 * The fieldClass property (Class Constructor)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraFieldWrapper.prepareProperty(function fieldClass() {

	var className,
	    Classes,
	    fnc;

	Classes = __Protoblast.Classes;
	className = Blast.Bound.String.classify(this.viewname) + 'ChimeraField';

	if (Classes[className]) {
		fnc = Classes[className];
	} else {
		fnc = ChimeraField;
	}

	return fnc;
});

/**
 * Get the path to this field value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraFieldWrapper.setMethod(function getNestedPath() {

	var nested,
	    result = '';

	// Originally we only returned the field name:
	// this.parent.nested_in.field.fieldType.name

	// Get the field this is nested in
	nested = this.nested_in;

	// As long as a field is nested, do this
	while (nested) {
		if (result) {
			result = nested.path + '.' + result;
		} else {
			result = nested.path
		}

		if (nested.parent) {
			nested = nested.parent.nested_in;
		} else {
			nested = false;
		}
	}

	return result;
});

/**
 * Get the full path of this value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 */
ChimeraFieldWrapper.setMethod(function getFullPath() {

	var nested = this.getNestedPath();

	if (nested) {
		return nested + '.' + this.name;
	}

	return this.name;
});

/**
 * Create ChimeraField instances
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
ChimeraFieldWrapper.setMethod(function initFields() {

	var instance,
	    elements,
	    element,
	    values,
	    prefix,
	    value,
	    html,
	    key,
	    el,
	    i;

	if (this.isTranslatable) {
		this.prefixContainers = {};

		// Get the prefix elements
		elements = this.entries_wrapper.querySelectorAll('.chimeraField-prefix-intake');

		for (i = 0; i < elements.length; i++) {
			element = elements[i];
			prefix = element.getAttribute('data-prefix');

			if (i == 0) {
				this.activePrefix = prefix;
			}

			this.prefixContainers[prefix] = element;
		}
	}

	if (this.isArray) {
		values = Array.cast(this.value);
	} else {
		values = [];

		if (this.value != null) {
			values[0] = this.value;
		}
	}

	i = 0;

	do {
		this.addValue(values[i], i);
		i++;
	} while (i < values.length);
});

/**
 * Add translate buttons
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.1
 */
ChimeraFieldWrapper.setMethod(function addButtons() {

	var that     = this,
	    $prefixButtons,
	    $intake  = $(this.intake),
	    $left    = $('.chimeraField-left', that.container).first(),
	    el,
	    i;

	if (!$left.length) {
		$left = $(that.container);
	}

	// Look for add-entry buttons
	if (this.isArray) {
		// Get the first add-entry button (so skip buttons in sub schemas)
		el = this.container.querySelector('.chimeraField-add-entry');

		if (el) {
			el.addEventListener('click', function onClick() {
				that.addValue();
			});
		}
	}

	if (this.isTranslatable && this.prefixes && this.prefixes.length > 1) {
		this.prefixes.forEach(function eachPrefix(prefix) {

			var $prefix_button,
			    prefix_button,
			    is_first;

			if (!$prefixButtons) {
				$prefixButtons = $('.chimeraField-prefix-buttons', $left);
				is_first = true;

				if (!$prefixButtons.length) {
					$prefixButtons = $('<div class="chimeraField-prefix-buttons"></div>');
					$left.append($prefixButtons);
				}
			}

			prefix_button = Blast.parseHTML('<button class="chimeraField-prefix-selector btn btn-default">' + alchemy.__('chimera-prefix', prefix) + '</button>');
			$prefixButtons.append(prefix_button);
			$prefix_button = $(prefix_button);

			if (is_first) {
				prefix_button.classList.add('active');
			}

			$prefix_button.on('click', function onClickPrefix(e) {
				that.showPrefix(prefix);

				$prefix_button.siblings().removeClass('active');
				$prefix_button.addClass('active');
			});
		});
	}

});

/**
 * Get all the fields of a single prefix
 *
 * @param    {String}   prefix
 */
ChimeraFieldWrapper.setMethod(function getPrefixFields(prefix) {

	var result = [],
	    field,
	    i;

	for (i = 0; i < this.fields.length; i++) {
		field = this.fields[i];

		if (field.prefix == prefix) {
			result.push(field);
		}
	}

	return result;
});

/**
 * Get the data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Boolean}   changesOnly
 */
ChimeraFieldWrapper.setMethod(function getData(changesOnly) {

	var that = this,
	    result = {};

	this.fields.forEach(function eachField(field) {

		var value = field.getData();

		if (changesOnly && Object.alike(value, field.originalValue)) {
			// If the field is an array, we will have to return everything
			// otherwise things can get screwed up
			if (!that.isArray) {
				return;
			}
		}

		Object.setPath(result, field.path, value);
	});

	return result;
});

/**
 * Enable the given prefix
 *
 * @param    {String}   prefix
 */
ChimeraFieldWrapper.setMethod(function showPrefix(prefix) {

	var key,
	    el;

	if (this.activePrefix == prefix) {
		return;
	}

	for (key in this.prefixContainers) {
		el = this.prefixContainers[key];

		if (key == prefix) {
			el.style.display = '';
		} else {
			el.style.display = 'none';
		}
	}

	this.activePrefix = prefix;
});

/**
 * Add a value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}   value
 * @param    {Number}   index
 */
ChimeraFieldWrapper.setMethod(function addValue(value, index) {

	var that = this,
	    prefixes,
	    prefix;

	if (this.isTranslatable) {

		// Get the basic prefixes
		prefixes = this.prefixes.slice(0);

		// Add prefixes from within the value
		if (Object.isObject(value)) {
			for (prefix in value) {
				if (prefix.length < 128 && prefixes.indexOf(prefix) == -1) {
					prefixes.push(prefix);
				}
			}
		}

		prefixes.forEach(function eachPrefix(prefix) {

			var val;

			if (value) {
				val = value[prefix];
			}

			that.addPrefixValue(val, index, prefix);
		});
	} else {
		this.addPrefixValue(value, index);
	}
});

/**
 * Add a prefix value
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Object}   value
 * @param    {Number}   index
 * @param    {String}   prefix
 */
ChimeraFieldWrapper.setMethod(function addPrefixValue(value, index, prefix) {

	var instance,
	    options,
	    fields;

	fields = this.getPrefixFields(prefix);

	if (this.fieldClass.multipleValues && this.fields.length) {
		return fields[0].addValue(value);
	}

	try {
		options = {
			parent: this,
			value: value,
			prefix: prefix,
			original_index: index
		};

		instance = new this.fieldClass(options);
	} catch (err) {
		console.error('Failed to create field:', err)
	}
});

/**
 * Set a prefix value
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {Object}   value
 * @param    {Number}   index
 * @param    {String}   prefix
 */
ChimeraFieldWrapper.setMethod(function setPrefixValue(value, index, prefix) {

	var instance,
	    options,
	    fields;

	fields = this.getPrefixFields(prefix);

	if (this.fieldClass.multipleValues && this.fields.length) {
		return fields[0].addValue(value);
	}

	try {
		options = {
			parent: this,
			value: value,
			prefix: prefix,
			original_index: index,
			local_add: true
		};

		instance = new this.fieldClass(options);
	} catch (err) {
		console.error('Failed to create field:', err)
	}
});

/**
 * Remove the given child from the array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {ChimeraField}   child
 * @param    {Boolean}        force
 */
ChimeraFieldWrapper.setMethod(function removeFromArray(child, force) {

	var index;

	if (!this.isArray && !force) {
		return;
	}

	index = this.fields.indexOf(child);

	if (index < 0) {
		return;
	}

	this.fields.splice(index, 1);
});

/**
 * Add the child to the correct intake element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {ChimeraField}   child
 */
ChimeraFieldWrapper.setMethod(function addEntry(child) {

	var wrapper;

	if (child.prefix) {
		wrapper = this.prefixContainers[child.prefix];
	} else {
		wrapper = this.entries_wrapper;
	}

	wrapper.appendChild(child.entry);
});