hawkejs.scene.on({type: 'set', template: 'chimera/field_wrappers/_wrapper'}, function applyField(element, variables) {

	var options,
	    intake = element.getElementsByClassName('chimeraField-intake')[0],
	    input = intake.getElementsByTagName('input')[0];

	// Create the wrap options
	options = {
		variables: variables,
		container: element,
		viewname: variables.data.field.viewname
	};

	new ChimeraFieldWrapper(options);

	//ChimeraField.create(viewname, element, variables);
});

hawkejs.scene.on({type: 'rendered'}, function rendered(variables, renderData) {

	var key;

	Object.each(variables.__newFlashes, function eachFlash(flash) {
		chimeraFlash(flash);
	});
});

/**
 * The client side ChimeraFieldWrapper class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Object}   options
 */
var ChimeraFieldWrapper = Function.inherits(function ChimeraFieldWrapper(options) {

	if (!options) {
		throw new Error('No options given for Chimera field wrapper');
	}

	// Field data
	if (options.field) {
		this.field = options.field;
	} else {
		this.field = options.variables.data.field;
	}

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

	// Get the intake element, where the actual inputs should go
	if (options.intake) {
		this.intake = $(options.intake);
	} else {
		this.intake = $(this.container.getElementsByClassName('chimeraField-intake')[0]);
	}

	// See if this field is nested inside another field
	if (options.nested_in) {
		this.nested_in = options.nested_in;
	}

	// Store this instance on the intake element
	this.intake[0].CFWrapper = this;

	// Store the initial value
	this.original_value = this.value;

	// Available prefixes array
	if (options.prefixes) {
		this.prefixes = options.prefixes;
	} else {
		this.prefixes = this.variables.prefixes;
	}

	// Prefix containers
	this.prefixContainers = null;

	// The currently showing prefix
	this.activePrefix = null;

	// The action name
	this.action = this.field.viewaction;

	// Is this an arrayable field?
	this.isArray = this.field.fieldType.isArray;

	// Is this a translatable field?
	this.isTranslatable = this.field.fieldType.isTranslatable;

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
 * Get the full path to this field value
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
 * Create ChimeraField instances
 *
 * @param    {String}   name
 */
ChimeraFieldWrapper.setMethod(function initFields() {

	var instance,
	    values,
	    prefix,
	    value,
	    html,
	    key,
	    el,
	    i;

	if (this.isTranslatable) {
		this.prefixContainers = {};

		for (i = 0; i < this.prefixes.length; i++) {
			prefix = this.prefixes[i];

			// Create a prefix intake
			html = '<div class="chimeraField-prefix-intake" data-prefix="' + prefix + '"';

			if (i > 0) {
				html += ' style="display:none;"';
			} else {
				this.activePrefix = prefix;
			}

			html += '></div>';
			el = Blast.parseHTML(html);

			// Store this DOM element in the object
			this.prefixContainers[prefix] = el;

			// Add it to the intake
			this.intake.append(el);
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
		this.addValue(values[i]);
		i++;
	} while (i < values.length);
});

/**
 * Add translate buttons
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraFieldWrapper.setMethod(function addButtons() {

	var that = this,
	    $intake = $(this.intake),
	    $left = $('.chimeraField-left', that.container),
	    el,
	    i;

	if (!$left.length) {
		$left = $(that.container);
	}

	if (this.isArray) {
		el = Blast.parseHTML('<button class="chimeraField-add-entry">+</button>');
		$left.append(el);

		$(el).on('click', function onClickAdd(e) {
			that.addValue();
		});
	}

	if (this.isTranslatable) {
		this.prefixes.forEach(function eachPrefix(prefix) {

			var el = Blast.parseHTML('<button class="chimeraField-prefix-selector">' + prefix + '</button>');
			$left.append(el);

			$(el).on('click', function onClickPrefix(e) {
				that.showPrefix(prefix);
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
			return;
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
 * @param    {Object}   value
 */
ChimeraFieldWrapper.setMethod(function addValue(value) {

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

			that.addPrefixValue(val, prefix);
		});
	} else {
		this.addPrefixValue(value);
	}
});

/**
 * Add a prefix value
 *
 * @param    {Object}   value
 */
ChimeraFieldWrapper.setMethod(function addPrefixValue(value, prefix) {

	var instance,
	    fields;

	fields = this.getPrefixFields(prefix);

	if (this.fieldClass.multipleValues && this.fields.length) {
		return fields[0].addValue(value);
	}

	try {
		instance = new this.fieldClass(this, value, this.container, this.variables, prefix);
	} catch (err) {
		console.error('Failed to create field:', err)
	}
});

/**
 * Remove the given child from the array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {ChimeraField}   child
 */
ChimeraFieldWrapper.setMethod(function removeFromArray(child) {

	var index;

	if (!this.isArray) {
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
 * @version  0.2.0
 *
 * @param    {ChimeraField}   child
 */
ChimeraFieldWrapper.setMethod(function addEntry(child) {

	var intake;

	if (child.prefix) {
		intake = $(this.prefixContainers[child.prefix]);
	} else {
		intake = this.intake;
	}

	intake.append(child.entry);
});

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
var ChimeraField = Function.inherits(function ChimeraField(parent, value, container, variables, prefix) {

	var that = this,
	    action;

	// The parent wrapper
	this.parent = parent;

	// Make the instance self-register in the parent
	this.parent.fields.push(this);

	// The container element, with the 'chimeraField-container' CSS class
	this.container = container;

	// The variables passed to the rendering element
	this.variables = variables;

	// Field value
	this.value = value;

	// The original value
	this.originalValue = value;

	// Field data
	this.field = parent.field;

	// The prefix of the field
	this.prefix = prefix;

	this.readOnly = parent.readOnly;
	this.isArray = parent.isArray;
	this.isTranslatable = parent.isTranslatable;

	// Construct another wrapper div
	this.entry = Blast.parseHTML('<div class="chimeraField-entry"></div>');

	// Add it to the parent
	this.parent.addEntry(this)

	// The prime element
	this.input = null;
	this.$input = null;

	// Set the value path
	//this.intake.data('path', this.path);

	action = Blast.Bound.String.classify(String(this.parent.action));

	this.actionType = action;

	__Protoblast.setImmediate(function() {

		that.render();
		that.addButtons();

		that['init' + action]();

		if (that.readOnly) {
			that.setReadOnly(true);
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
 * @version  0.2.0
 */
ChimeraField.setMethod(function render() {
	this['render' + this.actionType]();
});

/**
 * Add extra buttons
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function addButtons() {

	var that = this,
	    el;

	if (this.isArray && this.actionType == 'Edit') {
		el = this.addElement('<button class="chimeraField-remove-entry">x</button>');

		$(el).on('click', function onClickRemoveEntry(e) {
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
 */
ChimeraField.setMethod(function renderEdit() {
	var html = '<input class="chimeraField-string" type="text">';

	this.setMainElement(html);
});

/**
 * Create the view input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function renderView() {
	return this.renderEdit();
});

/**
 * Create the list input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.2.0
 */
ChimeraField.setMethod(function renderList() {
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
 * Initialize the field in the edit action
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function initEdit() {

	var that = this;

	// Set the value on the generated input
	this.$input.val(this.value);

	// Listen to changes
	this.$input.change(function onDefaultEdit() {
		that.setValue(that.$input.val());
	});
});

/**
 * Initialize the field in the add action
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function initAdd() {
	return this.initEdit();
});

/**
 * Initialize the field in the list action
 *
 * @param    {Mixed}   value
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

hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/view'}, applySave);
hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/edit'}, applySave);
hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/add'}, applySave);

/**
 * Apply save functionality when clicking on the "save" button
 */
function applySave(el, variables) {

	var preventDuplicate,
	    variables,
	    isDraft,
	    $editor,
	    $save;

	isDraft = this.filter.template === 'chimera/editor/add';

	$editor = $('.chimera-editor', el).first();
	$save = $('.action-save', $editor);

	if (variables.__chimeraReadOnly) {
		$save.remove();
		return;
	}

	$save.click(function onClick(e) {

		var $fieldwrappers,
		    data,
		    obj;

		e.preventDefault();

		if (preventDuplicate === true) {
			return chimeraFlash('Save ignored:<br>Save already in progress');
		}

		$intakes = $('.chimeraField-intake', $editor);
		data = {};
		obj = {
			create: isDraft,
			data: data
		};

		if (isDraft) {
			// Set the initial passed-along-by-server values first
			Object.each(variables.groups, function eachGroup(group, name) {
				group[0].fields.forEach(function eachField(entry) {

					var i, j,
					    subgroup,
					    subentry;

					console.log('Entry:', entry)

					if (entry.field.fieldType.typename == 'Schema' && entry.field.fieldType.isArray) {
						// @todo: this hasn't really been tested,
						// and it probably only works 1 level deep
						for (i = 0; i < entry.value.length; i++) {
							subgroup = entry.value[i];

							for (j = 0; j < subgroup.fields.length; j++) {
								subentry = subgroup.fields[j];

								if (subentry.value != null) {
									Object.setPath(data, entry.field.path + '.' + i + '.' + subentry.field.path, subentry.value);
								}
							}
						}
					} else {
						if (entry.value != null) {
							Object.setPath(data, entry.field.path, entry.value);
						}
					}
				});
			});
		}

		$intakes.each(function() {

			var $wrapper = $(this),
			    instance = this.CFWrapper;

			// Skip nested wrappers,
			// this could mess up the data
			if (instance.nested_in) {
				return;
			}

			Object.merge(data, instance.getData(true));
		});

		if (Object.isEmpty(obj.data)) {
			return chimeraFlash('Save ignored:<br>No modifications were made');
		}

		var editurl = document.location.href;

		hawkejs.scene.openUrl($save.attr('href'), {post: obj, history: false}, function(err, result) {

			if (err != null && result != null) {
				preventDuplicate = false;
				chimeraFlash('Something went wrong: ' + result);
			}

			// @todo: go to the correct url
			//hawkejs.scene.reload(editurl);
		});

		preventDuplicate = true;
	});
}

hawkejs.scene.on({type: 'set', template: 'chimera/sidebar'}, sidebarCollapse);

function sidebarCollapse(el) {

	var childclass = '',
	    $active = $(el.querySelectorAll('.sideNav .active')),
	    $section = $('.section'),
	    $links = $('a', el);

	// Open active section
	toggleMenu($active.parent().parent().prev());

	$links.click(function(e) {
		var $this = $(this);

		if ($this.hasClass('section')) {
			return;
		}

		$links.removeClass('active');
		$this.addClass('active');
	});
	
	// Open clicked section
	$section.on('click', function onMenuParentClick(e){
		e.preventDefault();
		toggleMenu($(this));
	}); 

	// Handle opening/closing of sections
	function toggleMenu(section){
		childclass = '.'+section.data('childclass');

		if(section.attr('data-after') == '\u25B6'){
			section.attr('data-after', '\u25BC');
		} else {
			section.attr('data-after', '\u25B6');
		}

		$(childclass).toggleClass('hidden');
	}
}

hawkejs.scene.on({type: 'set', template: 'chimera/editor/remove'}, removeRecord);

function removeRecord(el) {

	var url;

	$('.remove-btn').on('click', function(e){
		e.preventDefault();
		url = $(this).attr('href');

		hawkejs.scene.openUrl(url, {post: {sure: 'yes'}}, function(result) {
			
		});
	});

}

function chimeraFlash(flash) {

	var className,
	    element,
	    obj;

	if (typeof vex == 'undefined') {
		console.log('"vex" not found, flash:', flash);
		return;
	}

	if (typeof flash == 'string') {
		flash = {
			message: flash
		}
	}

	if (flash.className) {
		className = ' ' + flash.className;
	} else {
		className = '';
	}

	obj = {
		className: 'vex-theme-bottom-right-corner vex-chimera-flash' + className,
		message: flash.message
	};

	element = vex.dialog.alert(obj);

	setTimeout(function closeVexFlash() {
		vex.close(element.data('id'))
	}, flash.timeout || 2000);
}

// $(document).ready(function() {
// 	vex.defaultOptions.className = 'vex-theme-flat-attack';
// });