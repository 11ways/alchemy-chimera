/**
 * The Geopoint ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
GeopointChimeraField = ChimeraField.extend(function GeopointChimeraField(parent, value, container, variables, prefix) {
	GeopointChimeraField.super.call(this, parent, value, container, variables, prefix);
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