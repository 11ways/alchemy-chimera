/**
 * Chimera Model Configuration Class:
 * Every model class has access to this via
 * the `chimera` static property
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  1.0.0
 *
 * @param    {Model}   ModelClass
 */
const Config = Function.inherits('Alchemy.Base', 'Alchemy.Chimera', function Config(ModelClass) {

	// The modal class constructor
	this.ModelClass = ModelClass;

	// The different default field sets
	this.field_sets = {};
});

/**
 * Get the fieldset for a specific action
 *
 * @deprecated
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  1.0.0
 *
 * @return   {FieldSet}
 */
Config.setMethod(function getActionFields(name) {
	return this.getFieldSet(name);
});

/**
 * Get a named fieldset
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  1.0.0
 *
 * @return   {FieldSet}
 */
Config.setMethod(function getFieldSet(name) {

	if (name == null) {
		throw new Error('No action group name was given');
	}

	let set = this.field_sets[name];

	if (!set) {
		set = new Classes.Alchemy.Criteria.FieldSet(name, this.ModelClass);
		this.field_sets[name] = set;
	}

	return set;
});

/**
 * Get the widget configuration for the given action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {String}   action
 * @param    {Conduit}  conduit
 *
 * @return   {Object}
 */
Config.setMethod(function getWidgetConfig(action, conduit) {

	let fieldset,
	    widgets;

	// @TODO: get the possible user-modified widget config!

	let result = {};

	if (action == 'edit') {
		fieldset = this.getFieldSet('edit');

		let field_widgets = [];

		let field;

		for (field of fieldset) {
			field_widgets.push({
				type   : 'alchemy_field',
				config : {
					field : field.name,
				}
			});
		}

		field_widgets.push({
			type   : 'html',
			config : {
				html : '<button type="submit">Submit</button>'
			}
		});

		widgets = [
			{
				"type": "column",
				"config": {
					"widgets": [
						{
							"type": "header",
							"config": {
								"level": 1,
								"content": this.ModelClass.title + ' edit',
							}
						}, {
							"type": "alchemy_form",
							"config": {
								model     : this.ModelClass.type_name,
								view_type : 'edit',
								widgets   : field_widgets
							}
						}
					]
				}
			}
		];

	} else {
		fieldset = this.getFieldSet('list');

		widgets = [
			{
				"type": "column",
				"config": {
					"widgets": [
						{
							"type": "header",
							"config": {
								"level": 1,
								"content": this.ModelClass.title
							}
						}, {
							"type": "alchemy_table",
							"config": {
								fieldset     : fieldset,
								page_size    : 10,
								id           : 'aft-' + this.ModelClass.type_name,
								recordsource : {
									route      : 'Chimera.Editor#records',
									parameters : {
										model  : this.ModelClass.type_name
									}
								}
							}
						}
					]
				}
			}
		];
	}

	result.widgets = widgets;

	console.log('Widget config', result, 'for', this);

	return result;
});