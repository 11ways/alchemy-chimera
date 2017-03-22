/**
 * The BelongsTo ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}                options
 * @param    {ChimeraFieldWrapper}   options.parent
 * @param    {DOMElement}            options.container
 * @param    {Object}                options.variables
 * @param    {Mixed}                 options.value
 * @param    {String}                options.prefix
 * @param    {Number}                options.original_index
 */
var BelongstoChimeraField = Function.inherits('ChimeraField', function BelongstoChimeraField(options) {

	var that = this,
	    nested_path,
	    urlparams,
	    recordId,
	    subject;

	BelongstoChimeraField.super.call(this, options);

	urlparams = this.variables.__urlparams || {};
	this.default_options = {};

	if (urlparams.id) {
		recordId = urlparams.id;
	} else {
		recordId = Object.path(this.variables, 'item.value.id');
	}

	if (!recordId) {
		recordId = Object.path(this.variables, 'data.root_id');

		if (!recordId) {
			recordId = this.variables.__recordId || "000000000000000000000000";
		}
	}

	// Store the modelname
	this.modelName = this.field.fieldType.options.modelName;

	// Get the subject
	subject = urlparams.subject;

	if (!subject) {
		subject = Object.path(this.variables, 'data.root_model');
	}

	if (!subject) {
		subject = this.field.model_name || this.modelName;
	}

	if (!this.modelName) {
		this.modelName = subject;
	}

	// Create a router instance
	this.Router = new hawkejs.constructor.helpers.Router();

	// Construct the base url
	this.baseUrl = Blast.Collection.URL.parse(this.Router.routeUrl('RecordAction', {
		controller: 'editor',
		subject: subject,
		action: 'related_data',
		id: recordId
	}));

	// Get the path of the value it's nested in
	nested_path = Object.path(this.variables, 'data.nested_path');

	if (nested_path) {
		if (this.nested_path) {
			nested_path += '.' + this.nested_path;
		}
	} else {
		nested_path = this.getNestedPath();
	}

	// If this is a nested field, add that info
	// @todo: this will only work for 1 level, not multiple...
	if (nested_path) {
		this.baseUrl.addQuery('nested_in', nested_path);
	}

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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
BelongstoChimeraField.setMethod(function initEdit() {

	var that = this,
	    $input = $(this.input),
	    init_value_has_been_set = false,
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
		placeholder: '-- empty --',
		preload: true,
		create: false,
		render: {
			item: function selectedItem(item) {
				return '<div><span>' + item.title + '</span></div>';
			},
			option: function shownOption(item, escape) {
				return '<div class="option"><span>' + item.title + '</span></div>';
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

			hawkejs.scene.fetch(url, function gotResult(err, response) {

				var result = [],
				    title,
				    items,
				    item,
				    i;

				if (err) {
					throw err;
				}

				if (Array.isArray(response)) {
					items = response;
				} else {
					items = response.items;
				}

				for (i = 0; i < items.length; i++) {

					item = items[i];

					if (item[modelName]) {
						item = item[modelName];
					}

					title = Object.first(item[response.displayField]) || Object.first(item.title) || Object.first(item.name);

					result.push({
						_id: item._id,
						title: title,
						data: items[i]
					});
				}

				callback(result);

				// @TODO: that.value is sometimes an empty object in new records, why is that?
				if (setInitValue && that.value && !Object.isEmpty(that.value)) {
					thisSelect.setValue(that.value);
				}

				init_value_has_been_set = true;
			});
		},
		onChange: function changed(value) {
			that.setValue(value, init_value_has_been_set);
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
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}                options
 * @param    {ChimeraFieldWrapper}   options.parent
 * @param    {DOMElement}            options.container
 * @param    {Object}                options.variables
 * @param    {Mixed}                 options.value
 * @param    {String}                options.prefix
 * @param    {Number}                options.original_index
 */
var HasoneparentChimeraField = BelongstoChimeraField.extend(function HasoneparentChimeraField(options) {
	HasoneparentChimeraField.super.call(this, options);
});

/**
 * The Enum ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}                options
 * @param    {ChimeraFieldWrapper}   options.parent
 * @param    {DOMElement}            options.container
 * @param    {Object}                options.variables
 * @param    {Mixed}                 options.value
 * @param    {String}                options.prefix
 * @param    {Number}                options.original_index
 */
var EnumChimeraField = BelongstoChimeraField.extend(function EnumChimeraField(options) {
	EnumChimeraField.super.call(this, options);
});

/**
 * The HasAndBelongsToMany ChimeraField class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Object}                options
 * @param    {ChimeraFieldWrapper}   options.parent
 * @param    {DOMElement}            options.container
 * @param    {Object}                options.variables
 * @param    {Mixed}                 options.value
 * @param    {String}                options.prefix
 * @param    {Number}                options.original_index
 */
var HABTMChimeraField = BelongstoChimeraField.extend(function HabtmChimeraField(options) {
	HabtmChimeraField.super.call(this, options);
});