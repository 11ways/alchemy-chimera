hawkejs.scene.on({type: 'set', template: 'chimera/field_wrappers/_wrapper'}, function applyField(element, variables) {

	var intake = element.getElementsByClassName('chimeraField-intake')[0],
	    input = intake.getElementsByTagName('input')[0],
	    viewname;

	viewname = variables.data.field.viewname;

	//console.log('Should create CF:', viewname, element, variables);

	new ChimeraFieldWrapper(viewname, element, variables)

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
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var ChimeraFieldWrapper = Function.inherits(function ChimeraFieldWrapper(viewname, container, variables) {

	// The viewname to render
	this.viewname = viewname;

	// The container element, with the 'chimeraField-container' CSS class
	this.container = container;

	// Get the intake element, where the actual inputs should go
	this.intake = $(container.getElementsByClassName('chimeraField-intake')[0]);

	// Store this instance on the intake element
	this.intake[0].CFWrapper = this;

	// The variables passed to the rendering element
	this.variables = variables;

	// Available prefixes array
	this.prefixes = variables.prefixes;

	// Prefix containers
	this.prefixContainers = null;

	// The currently showing prefix
	this.activePrefix = null;

	// Field data
	this.field = variables.data.field;

	// The action name
	this.action = this.field.viewaction;

	// Is this an arrayable field?
	this.isArray = this.field.fieldType.isArray;

	// Is this a translatable field?
	this.isTranslatable = this.field.fieldType.isTranslatable;

	// Field instances
	this.fields = [];

	// Is this a read-only field?
	this.readOnly = variables.__chimeraReadOnly === true;

	this.initFields();
	this.addButtons();

	console.log('WRAPPER', this.viewname, this.action, this.container, variables);

});

/**
 * The fieldClass property (Class Constructor)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
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
		values = Array.cast(this.variables.data.value);
	} else {
		values = [];

		if (this.variables.data.value != null) {
			values[0] = this.variables.data.value;
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
 * @since    1.0.0
 * @version  1.0.0
 */
ChimeraFieldWrapper.setMethod(function addButtons() {

	var that = this,
	    $intake = $(this.intake),
	    $left = $('.chimeraField-left', that.container),
	    el,
	    i;

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
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Boolean}   changesOnly
 */
ChimeraFieldWrapper.setMethod(function getData(changesOnly) {

	var that = this,
	    result = {};

	this.fields.forEach(function eachField(field) {

		if (changesOnly && field.value == field.originalValue) {
			return;
		}

		Object.setPath(result, field.path, field.value);
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

	var prefix;

	if (this.isTranslatable) {
		for (prefix in value) {
			this.addPrefixValue(value[prefix], prefix)
		}
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

	console.log('Creating field with prefix', prefix, 'value:', value);

	instance = new this.fieldClass(this, value, this.container, this.variables, prefix);
});

/**
 * Remove the given child from the array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var ChimeraField = Function.inherits(function ChimeraField(parent, value, container, variables, prefix) {

	var action;

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
	this.field = variables.data.field;

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

	this.render();
	this.addButtons();
	this['init' + action]();

	if (this.readOnly) {
		this.setReadOnly(true);
	}
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

	var result = this.variables.data.field.path;

	if (this.index !== false) {
		result += '.' + this.index;
	}

	if (this.prefix) {
		result += '.' + this.prefix;
	}

	return result;
});

/**
 * Add element to the wrapper
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Element}   element
 */
ChimeraField.setMethod(function setMainElement(element) {

	if (typeof element == 'string') {
		element = Blast.parseHTML(element);
	}

	// Store the main element under the input property
	this.input = element;
	this.$input = $(element);

	this.input.classList.add('chimeraField-prime');

	// And add it to the wrapper
	this.addElement(element);

	return element;
});

/**
 * Render the element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
ChimeraField.setMethod(function render() {
	this['render' + this.actionType]();
});

/**
 * Add extra buttons
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
 */
ChimeraField.setMethod(function renderEdit() {

	var html = '<input class="chimeraField-string" type="text">';

	this.setMainElement(html);
});

/**
 * Create the view input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
ChimeraField.setMethod(function renderView() {
	return this.renderEdit();
});

/**
 * Create the list input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
ChimeraField.setMethod(function renderList() {
	var html = '<div>' + this.value + '</div>';
	this.setMainElement(html);
});

/**
 * Render the element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * @since    1.0.0
 * @version  1.0.0
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

/**
 * The Geopoint ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
GeopointChimeraField = ChimeraField.extend(function GeopointChimeraField(container, variables) {
	GeopointChimeraField.super.call(this, container, variables);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
GeopointChimeraField.setMethod(function renderEdit() {

	var html = '<div class="geopoint-div geopoint-edit"></div>';

	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
GeopointChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = this.$input,
	    coordinates,
	    value;

	options = {
		minZoom: 1,
		maxZoom: 16,
		dragging: true,
		editable: true
	};

	value = this.value || {};

	coordinates = value.coordinates || [];

	result = applyGeopoint($input, coordinates[0], coordinates[1], options);

	if (!result) {
		throw new Error('Map wrapper could not be created');
	}

	map = result[0];
	marker = result[1];

	marker.on('dragend', function afterDrag() {
		var coordinates = marker.getLatLng();
		that.setValue([coordinates.lat, coordinates.lng]);
		//$el.data('new-value', [coordinates.lat, coordinates.lng]);
	});
});

/**
 * Initialize the list field
 *
 * @param    {Mixed}   value
 */
GeopointChimeraField.setMethod(function initList() {

	var that = this,
	    $input = $('.geopoint-list', this.intake),
	    options,
	    coordinates,
	    value;

	options = {
		dragging: false
	};

	value = this.value || {};

	coordinates = value.coordinates || [];

	result = applyGeopoint($input, coordinates[0], coordinates[1], options);
});

function applyGeopoint($el, lat, lng, _options) {

	var markOptions,
	    options,
	    marker,
	    lat,
	    lng,
	    map;

	if ($el == null) {
		throw new Error('Wrapper element not found, can\'t create map');
	}

	// Skip this map if the coordinates are not numbers
	if (!isFinite(lat) || !isFinite(lng)) {
		lat = 51.044821;
		lng = 3.738785;
	}

	options = {
		dragging: false,
		touchZoom: false,
		center: [lat+0.0012, lng],
		zoomControl: false,
		attributionControl: false,
		scrollWheelZoom: 'center',
		minZoom: 13,
		maxZoom: 15,
		zoom: 14
	};

	Object.assign(options, _options);

	// Add the point to the map
	map = L.map($el[0], options);

	L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
		attribution: '',
		maxZoom: 16
	}).addTo(map);

	markOptions = {};

	if (options.editable === true) {
		markOptions.draggable = true;
	}

	marker = L.marker([lat, lng], markOptions).addTo(map);

	return [map, marker];
}

/**
 * The Password ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var PasswordChimeraField = ChimeraField.extend(function PasswordChimeraField(container, variables) {
	PasswordChimeraField.super.call(this, container, variables);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
PasswordChimeraField.setMethod(function renderEdit() {

	var html = '<input class="chimeraField-string chimeraPassword-first" type="password" placeholder="Enter a new password">';
	html += '<input class="chimeraField-string chimeraPassword-second" type="password" placeholder="Repeat the same password">';

	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
PasswordChimeraField.setMethod(function initEdit() {

	var that = this,
	    $first = $('.chimeraPassword-first', this.intake),
	    $second = $('.chimeraPassword-second', this.intake);

	$first.add($second).change(function onFirstChange() {

		if ($first.val() == $second.val()) {
			that.setValue($first.val());
		} else {
			that.setValue(null);
		}
	});
});

/**
 * The Text ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var TextChimeraField = ChimeraField.extend(function TextChimeraField(container, variables) {
	TextChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TextChimeraField.setMethod(function initEdit() {
	
	var that = this,
	    name,
	    editor, id;


	var editor = CKEDITOR.inline(that.intake.find('.chimeraField-wysiwyg')[0], {
		extraPlugins: 'sourcedialog',
		filebrowserBrowseUrl: '/boeckeditor',
		allowedContent: 'img form input param pre flash br a td p span font em strong table tr th td style script iframe u s li ul div[*]{*}(*)'
	});

	editor.on('focus', function () {
		editor.setReadOnly(!!that.readOnly);
	});

	this.ckeditor = editor;

	editor.on('change', function onCkChange() {
		that.setValue(editor.getData());
	});

	return;

	name = '.medium-editor';
	id = $(name, this.intake)[0].id;

	editor = new MediumEditor(name, {
		buttons: ['bold', 'italic', 'underline', 'strikethrough', 'anchor', 'media', 'image', 'header1', 'header2', 'quote', 'pre'],
		extensions: {
			'h2k': new MediumButton({label:'h2k', start:'<h2>', end:'</h2>'}),
			'media': new MediumButton({label: 'Media', action: function initPickMedia() {

				var elementId = 'media-' + Date.now();

				pickMediaId(function (err, id) {

					var img = $('#' + elementId);
					img.attr('src', '/media/image/' + id);

				});

				return '<img id="' + elementId + '"></img>';
			}})
		}
	});

	var Router = new hawkejs.constructor.helpers.Router(),
	    uploadUrl = Router.routeUrl('Media::uploadsingle');

	$(name).mediumInsert({
		editor: editor,
		addons: {
			images: {
				imagesUploadScript: uploadUrl
			},
			embeds: {},
			tables: {}
		}
	});

	$(name).on('input', function onTextEdit(){
		if($(this)[0].id === id){
			that.setValue($(this)[0].innerHTML);
		}
	});
});

/**
 * Make the CKEditor instance read-only
 *
 * @param    {Boolean}   value
 */
TextChimeraField.setMethod(function setReadOnly(value) {
	var that = this;
	this.readOnly = value;
});

/**
 * The BelongsTo ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var BelongstoChimeraField = ChimeraField.extend(function BelongstoChimeraField(container, variables) {
	BelongstoChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BelongstoChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $('.chimeraField-prime', this.intake).first(),
	    coordinates,
	    modelName,
	    baseUrl,
	    initted,
	    Router,
	    url;

	// Create a new Router helper instance
	Router = new hawkejs.constructor.helpers.Router();
	modelName = this.field.fieldType.options.modelName;

	baseUrl = Blast.Collection.URL.parse(Router.routeUrl('RecordAction', {
		controller: 'editor',
		subject: this.variables.__urlparams.subject,
		action: 'related_data',
		id: this.variables.__urlparams.id
	}));

	$input.selectize({
		valueField: '_id',
		labelField: 'title',
		searchField: 'title',
		preload: true,
		create: false,
		render: {
			item: function selectedItem(item) {
				return '<div><span>' + item.title + '</span></div>';
			},
			option: function shownOption(item, escape) {
				return '<div><span>' + item.title + '</span></div>';
			}
		},
		load: function load(query, callback) {

			var url = baseUrl.clone(),
			    thisSelect = this,
			    setInitValue;

			url.addQuery('fieldpath', that.field.path);

			if (!initted) {
				initted = true;
				setInitValue = true;
			}

			$.get(url, function gotResult(response) {

				var result = [],
				    item,
				    i;

				for (i = 0; i < response.length; i++) {

					item = response[i];

					if (item[modelName]) {
						item = item[modelName];
					}

					result.push({
						_id: item._id,
						title: item.title || item.name,
						data: response[i]
					});
				}

				callback(result);

				if (setInitValue && that.variables.data.value) {
					thisSelect.setValue(that.variables.data.value);
				}
			}, 'json');
		},
		onChange: function changed(value) {
			that.setValue(value);
		}
	});

	this.selectizeInstance = $input[0].selectize;
});

/**
 * Set the new value for this field.
 * Only new values will be sent to the server on save.
 *
 * @param    {Mixed}   value
 */
BelongstoChimeraField.setMethod(function setReadOnly(value) {
	this.selectizeInstance.disable(value);
});

/**
 * The HasOneParent ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var HasoneparentChimeraField = BelongstoChimeraField.extend(function HasoneparentChimeraField(container, variables) {
	HasoneparentChimeraField.super.call(this, container, variables);
});

/**
 * The Enum ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var EnumChimeraField = BelongstoChimeraField.extend(function EnumChimeraField(container, variables) {
	EnumChimeraField.super.call(this, container, variables);
});

/**
 * The HasAndBelongsToMany ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var HABTMChimeraField = BelongstoChimeraField.extend(function HabtmChimeraField(container, variables) {
	HabtmChimeraField.super.call(this, container, variables);
});

hawkejs.scene.on({type: 'set', name: 'pageCentral', template: 'chimera/editor/view'}, applySave);
hawkejs.scene.on({type: 'set', name: 'pageCentral', template: 'chimera/editor/edit'}, applySave);
hawkejs.scene.on({type: 'set', name: 'pageCentral', template: 'chimera/editor/add'}, applySave);

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

	$editor = $('.chimeraEditor', el).first();
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
					if (entry.value != null) {
						Object.setPath(data, entry.field.path, entry.value);
					}
				});
			});
		}

		$intakes.each(function() {

			var $wrapper = $(this),
			    instance = this.CFWrapper;

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

/**
 * The Boolean ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
BooleanChimeraField = ChimeraField.extend(function BooleanChimeraField(container, variables) {
	BooleanChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BooleanChimeraField.setMethod(function initEdit() {
	
	var that = this,
	    $input = $('.chimeraEditor-input', this.intake);
	
	$input.change(function onBooleanEdit() {
		that.setValue($input.is(':checked'));
	});

});

/**
 * The Datetime ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
DatetimeChimeraField = ChimeraField.extend(function DatetimeChimeraField(container, variables) {
	DatetimeChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
DatetimeChimeraField.setMethod(function initEdit() {
	
	var that = this;
	
	applyDateField(that, 'datetime');

});

/**
 * The Date ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
DateChimeraField = ChimeraField.extend(function DateChimeraField(container, variables) {
	DateChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
DateChimeraField.setMethod(function initEdit() {
	
	var that = this;
	
	applyDateField(that, 'date', {time: false});

});

/**
 * The Time ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
TimeChimeraField = ChimeraField.extend(function TimeChimeraField(container, variables) {
	TimeChimeraField.super.call(this, container, variables);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TimeChimeraField.setMethod(function initEdit() {
	
	var that = this;
	
	applyDateField(that, 'time', {date: false});

});


function applyDateField(that, type, options) {

	var $el = that.intake,
	    $wrapper = $('.chimeraEditor-' + type + '-edit', $el),
	    calender,
	    value;

	value = $wrapper.data('value');

	if (value != null) {
		value = new Date(value);
	}

	options = Object.assign({weekStart: 1, initialValue: value}, options);

	// Apply `rome`
	calender = rome($wrapper[0], options);

	this.romeCalender = calender;

	calender.on('data', function dateChange(dateString) {
		var newdate = calender.getDate();
		that.setValue(newdate);
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

$(document).ready(function() {
	vex.defaultOptions.className = 'vex-theme-flat-attack';
});