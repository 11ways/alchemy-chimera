hawkejs.scene.on({type: 'set', template: 'chimera/field_wrappers/_wrapper'}, function applyField(element, variables) {

	var intake = element.getElementsByClassName('chimeraField-intake')[0],
	    input = intake.getElementsByTagName('input')[0],
	    viewname;

	viewname = variables.data.field.viewname;

	ChimeraField.create(viewname, element, variables);
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
 * @param    {DOMElement}   container
 * @param    {Object}       variables
 */
var ChimeraField = Function.inherits(function ChimeraField(container, variables) {

	var action;

	// The container element, with the 'chimeraField-container' CSS class
	this.container = container;

	// The variables passed to the rendering element
	this.variables = variables;

	// Field value
	this.value = variables.data.value;

	// Field data
	this.field = variables.data.field;

	// Action type
	this.action = this.field.viewaction;

	// The intake x-hawkejs element
	this.intake = $(container.getElementsByClassName('chimeraField-intake')[0]);

	// Set the value path
	this.intake.data('path', variables.data.field.path);

	action = Blast.Bound.String.classify(String(this.action));

	this['init' + action]();
});

/**
 * Create a ChimeraField instance
 *
 * @param    {String}   name
 */
ChimeraField.setStatic(function create(viewname, container, variables) {

	var className,
	    Classes,
	    fnc;

	Classes = __Protoblast.Classes;
	className = Blast.Bound.String.classify(viewname) + 'ChimeraField';

	if (Classes[className]) {
		fnc = Classes[className];
	} else {
		fnc = ChimeraField;
	}

	return new fnc(container, variables);
});

/**
 * Set the new value for this field.
 * Only new values will be sent to the server on save.
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function setValue(value) {
	this.intake.data('new-value', value);
});

/**
 * Initialize the field in the edit action
 *
 * @param    {Mixed}   value
 */
ChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $('.chimeraField-prime', this.intake);

	$input.change(function onDefaultEdit() {
		that.setValue($input.val());
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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
GeopointChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $('.chimeraField-prime', this.intake),
	    coordinates;

	options = {
		minZoom: 1,
		maxZoom: 16,
		dragging: true,
		editable: true
	};

	coordinates = this.value.coordinates || [];

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
	    coordinates;

	options = {
		dragging: false
	};

	coordinates = this.value.coordinates || [];

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
TextChimeraField = ChimeraField.extend(function TextChimeraField(container, variables) {
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

	// Use CKEDITOR instead of medium editor
	CKEDITOR.disableAutoInline = true;

	var editor = CKEDITOR.inline(that.intake.find('.medium-editor').attr('id'), {
		filebrowserBrowseUrl: '/boeckeditor'
	});

	editor.on('focus', function () {
		editor.setReadOnly(false);
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

	$save.click(function onClick(e) {

		var $fieldwrappers,
		    data,
		    obj;

		if (preventDuplicate === true) {
			throw new Error('Already pressed save button');
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
			    value = $wrapper.data('new-value');

			if (value != null) {
				Object.setPath(obj, 'data.' + $wrapper.data('path'), value);
			}
		});

		var editurl = document.location.href;

		hawkejs.scene.openUrl($save.attr('href'), null, obj, function(err, result) {

			console.log(err, result);
			window.location = editurl;
		});

		e.preventDefault();
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

	calender.on('data', function dateChange(dateString) {
		var newdate = calender.getDate();
		that.setValue(newdate);
	});
}


hawkejs.scene.on({type: 'set', template: 'chimera/sidebar'}, sidebarCollapse);

function sidebarCollapse(el) {

	var childclass = '',
	    $active = $(el.querySelectorAll('.sideNav .active')),
	    $section = $('.section');

	// Open active section
	toggleMenu($active.parent().parent().prev());
	
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

$(document).ready(function() {
	vex.defaultOptions.className = 'vex-theme-flat-attack';
});