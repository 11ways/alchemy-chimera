/**
 * The BelongsTo ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var BelongstoChimeraField = ChimeraField.extend(function BelongstoChimeraField(parent, value, container, variables, prefix) {

	var that = this,
	    recordId;

	this.default_options = {};

	if (variables.__urlparams.id) {
		recordId = variables.__urlparams.id;
	} else {
		recordId = Object.path(variables, 'item.value.id');
	}

	if (!recordId) {
		recordId = variables.__recordId || "000000000000000000000000";
	}

	BelongstoChimeraField.super.call(this, parent, value, container, variables, prefix);

	// Store the modelname
	this.modelName = this.field.fieldType.options.modelName;

	// Create a router instance
	this.Router = new hawkejs.constructor.helpers.Router();

	// Construct the base url
	this.baseUrl = Blast.Collection.URL.parse(this.Router.routeUrl('RecordAction', {
		controller: 'editor',
		subject: this.variables.__urlparams.subject,
		action: 'related_data',
		id: recordId
	}));

	// Construct the create url
	this.createUrl = Blast.Collection.URL.parse(this.Router.routeUrl('ModelAction', {
		controller: 'editor',
		subject: this.field.fieldType.options.modelName,
		action: 'create_field_value'
	}));

	if (this.field.options.create && !this.default_options.create) {
		this.default_options.create = function create(input, callback) {

			hawkejs.scene.fetch(that.createUrl, {post: {text: input}}, function gotResult(err, data) {

				if (err) {
					console.error(err);
					return callback();
				}

				callback({value: data._id, text: input});
			});
		};
	}
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
BelongstoChimeraField.setMethod(function renderEdit() {

	var html = '<select class="chimeraField-prime"></select>';

	this.setMainElement(html);
});

/**
 * Create the list input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
BelongstoChimeraField.setMethod(function renderList() {

	var that = this,
	    url = this.baseUrl.clone(),
	    html;

	url.addQuery('fieldpath', this.field.path);
	url.addQuery('display_field_only', true);

	$.get(url, function gotResult(response) {
		html = '<div>' + response + '</div>';
		that.setMainElement(html);
	});

	html = '<div class="chimeraField-temp">' + this.value + '</div>';
	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BelongstoChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $(this.input),
	    coordinates,
	    modelName,
	    initted,
	    baseUrl,
	    options,
	    url;

	modelName = this.modelName;
	baseUrl = this.baseUrl;

	options = Object.assign({
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
				    title,
				    item,
				    i;

				for (i = 0; i < response.items.length; i++) {

					item = response.items[i];

					if (item[modelName]) {
						item = item[modelName];
					}

					title = Object.first(item[response.displayField]) || Object.first(item.title) || Object.first(item.name);

					result.push({
						_id: item._id,
						title: title,
						data: response[i]
					});
				}

				callback(result);

				if (setInitValue && that.variables.data.value) {
					thisSelect.setValue(that.variables.data.value);
				}
			});
		},
		onChange: function changed(value) {
			that.setValue(value);
		}
	}, this.default_options);

	$input.selectize(options);

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
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var HasoneparentChimeraField = BelongstoChimeraField.extend(function HasoneparentChimeraField(parent, value, container, variables, prefix) {
	HasoneparentChimeraField.super.call(this, parent, value, container, variables, prefix);
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
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var EnumChimeraField = BelongstoChimeraField.extend(function EnumChimeraField(parent, value, container, variables, prefix) {
	EnumChimeraField.super.call(this, parent, value, container, variables, prefix);
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
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var HABTMChimeraField = BelongstoChimeraField.extend(function HabtmChimeraField(parent, value, container, variables, prefix) {
	HabtmChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
HABTMChimeraField.setMethod(function renderEdit() {

	var html = '<select multiple class="chimeraField-prime"></select>';

	this.setMainElement(html);
});