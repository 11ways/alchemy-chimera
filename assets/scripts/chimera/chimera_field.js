/**
 * The client side base ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var ChimeraField = Function.inherits(function ChimeraField(options) {

	var that = this,
	    action;

	if (!options) {
		throw new Error('ChimeraField can\'t be created without options');
	}

	// The parent wrapper
	this.parent = options.parent;

	// Make the instance self-register in the parent
	this.parent.fields.push(this);

	// The container element, with the 'chimeraField-container' CSS class
	this.container = options.container || this.parent.container;

	// The variables passed to the rendering element
	this.variables = options.variables || this.parent.variables;

	// Field value
	this.value = options.value;

	// The original value
	this.originalValue = this.value;

	// The original value index
	this.original_index = options.original_index;

	// Identify local-added fields (by clicking + button)
	this.is_local_add = this.original_index == null;

	// Set the entry wrapper
	if (!this.is_local_add) {
		this.entry = this.parent.entries[this.original_index];
	}

	// Field data
	this.field = this.parent.field;

	// The prefix of the field
	this.prefix = options.prefix;

	this.readOnly = this.parent.readOnly;
	this.isArray = this.parent.isArray;
	this.isTranslatable = this.parent.isTranslatable;

	action = Blast.Bound.String.classify(String(this.parent.action));

	this.actionType = action;

	__Protoblast.setImmediate(function() {

		// @TODO: render only needs to happen when new values are added
		if (that.is_local_add) {
			that.render(function done(err) {
				if (err) {
					throw err;
				}

				that.doInit();
			});
		} else {
			that.doInit();
		}
	});
});

/**
 * Each ChimeraField handles a single value by default
 *
 * @type   {Boolean}
 */
ChimeraField.setStaticProperty('multipleValues', false);

/**
 * The index of this value inside the array.
 * Is always false if it isn't an arrayable field
 */
ChimeraField.setProperty(function index() {

	if (!this.parent.isArray) {
		return false;
	}

	return this.parent.fields.indexOf(this);
});

/**
 * Get the input element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 */
ChimeraField.setProperty(function input() {

	if (!this._input && this.entry) {
		this._input = this.entry.querySelector('.chimeraField-prime');
	}

	return this._input;
}, function setInput(element) {
	this._input = element;
});

/**
 * The path of this value
 */
ChimeraField.setProperty(function path() {

	var result = this.field.path;

	if (this.index !== false) {
		result += '.' + this.index;
	}

	if (this.prefix) {
		result += '.' + this.prefix;
	}

	return result;
});

/**
 * Return the nested path
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setProperty(function nested_path() {
	return this.getNestedPath();
});

/**
 * Get the path of the value it's nested in
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function getNestedPath() {
	return this.parent.getNestedPath();
});

/**
 * Get a text representation
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.1
 * @version  0.2.1
 */
ChimeraField.setMethod(function getText(mixed) {

	var result;

	// See if mixed is not an object (and not null)
	if (typeof mixed != 'object') {
		result = mixed;
	} else if (mixed) {
		// Mixed is an object, but not null
		// @TODO: show translations?
		result = Object.first(mixed);
	} else {
		result = mixed;
	}

	return String(result);
});

/**
 * Get the value to store in the database
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function getData() {
	return this.value;
});

/**
 * Add element to the wrapper
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Element}   element
 */
ChimeraField.setMethod(function addElement(element) {

	var arr,
	    i;

	if (typeof element == 'string') {
		element = Blast.parseHTML(element);
	}

	arr = Array.cast(element);

	for (i = 0; i < arr.length; i++) {
		this.entry.appendChild(arr[i]);
	}

	return arr[0];
});

/**
 * Set the main element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Element}   element
 */
ChimeraField.setMethod(function setMainElement(element) {

	var elements;

	if (typeof element == 'string') {
		element = Blast.parseHTML(element);
	}

	// If there already is a main element, remove it now!
	if (this.input) {
		this.input.remove();
	}

	elements = Array.cast(element);
	element = elements[0];

	// Store the main element under the input property
	this.input = element;
	this.$input = $(element);

	this.input.classList.add('chimeraField-prime');

	// And add it to the wrapper
	this.addElement(element);

	if (elements[1]) {
		this.addElement(elements[1]);
	}

	return element;
});

/**
 * Render the element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.3.0
 */
ChimeraField.setMethod(function render(callback) {

	var that = this,
	    render_function,
	    placeholder;

	// Construct the expected render function name
	render_function = 'render' + this.actionType;

	// If there is a custom render function, execute that
	if (typeof this[render_function] == 'function') {
		return this[render_function](callback);
	}

	// Print the field, get the placeholder
	placeholder = hawkejs.scene.helpers.Chimera.printField({field: this.field, value: this.value}, {print_wrapper: false});

	// Resolve the placeholder
	placeholder.getContent(function gotContent(err, html) {

		var entries;

		if (err) {
			return callback(err);
		}

		// Still not done: we only want the entries block
		entries = placeholder.parent.blocks.entries;

		// Get the html
		entries.joinBuffer(function gotResult(err, html) {

			var entry_element;

			if (err) {
				return callback(err);
			}

			// Get the new entry element
			entry_element = Array.cast(Blast.parseHTML(html))[0];

			// Set it
			that.entry = entry_element;

			that.parent.addEntry(that);

			callback(null);
		});
	});
});

/**
 * Add extra buttons
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
ChimeraField.setMethod(function addButtons() {

	var that = this,
	    el;

	if (this.isArray && this.actionType == 'Edit') {
		el = this.addElement('<button class="chimeraField-remove-entry">x</button>');

		el.addEventListener('click', function onClickRemoveEntry(e) {
			that.remove();
		});
	}
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function}   callback
 */
ChimeraField.setMethod(function _renderEdit(callback) {
	var html = '<input class="chimeraField-string" type="text">';

	this.setMainElement(html);
});

/**
 * Create the view input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function}   callback
 */
ChimeraField.setMethod(function _renderView() {
	return this.renderEdit();
});

/**
 * Create the list input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function}   callback
 */
ChimeraField.setMethod(function _renderList() {
	var html = '<div>' + this.value + '</div>';
	this.setMainElement(html);
});

/**
 * Render the element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function}   callback
 */
ChimeraField.setMethod(function _render(callback) {

	var that = this,
	    fieldElement,

	fieldElement = [
		// The expected element to use
		'chimera/fields/' + this.parent.viewname + '_' + this.parent.action,
		// The fallback element
		'chimera/fields/default_' + this.parent.action
	];

	hawkejs.render(fieldElement, {value: this.value}, callback);
});

/**
 * Remove this value (from an array field)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function remove() {

	if (!this.isArray) {
		return;
	}

	// Remove the element
	this.entry.remove();

	// Remove the instance from the parent
	this.parent.removeFromArray(this);
});

/**
 * Set the new value for this field.
 * Only new values will be sent to the server on save.
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function setValue(value) {
	this.value = value;
});

/**
 * Start the appropriate initialization
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
ChimeraField.setMethod(function doInit() {

	var init_action;

	// Add optional buttons (language prefixes)
	this.addButtons();

	// Construct the expected init name
	init_action = 'init' + this.actionType;

	if (typeof this[init_action] == 'function') {
		this[init_action]();
	}

	if (this.readOnly) {
		this.setReadOnly(true);
	}
});

/**
 * Initialize the field in the edit action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Mixed}   value   Optional value to override
 */
ChimeraField.setMethod(function initEdit(value) {

	var that = this;

	// Override the value if given
	if (typeof value !== 'undefined') {
		this.input.value = value;
	}

	// Add change listener
	this.input.addEventListener('change', function onChange() {
		that.setValue(that.input.value);
	});
});

/**
 * Initialize the field in the add action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function initAdd(value) {
	return this.initEdit(value);
});

/**
 * Initialize the field in the list action
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function initList() {
	return;
});

/**
 * Set the new value for this field.
 * Only new values will be sent to the server on save.
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function setReadOnly(value) {

	var $prime = this.$input;
	$prime.attr('disabled', value);

	if (value) {
		$prime.addClass('chimera-read-only');
	} else {
		$prime.removeClass('chimera-read-only');
	}
});