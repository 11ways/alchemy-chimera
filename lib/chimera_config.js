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
 * @version  1.2.1
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

		let action_widgets = [];
		let field;

		let groups = {
			main : {
				title   : 'Main',
				widgets : [],
			},
		};

		for (field of fieldset) {

			let field_group = groups.main;

			let field_widget ={
				type   : 'alchemy_field',
				config : {
					field           : field.name,
					purpose         : field.options.purpose,
					mode            : field.options.mode,
					readonly        : field.options.readonly,
					view            : field.options.view,
					wrapper         : field.options.wrapper,
					data_src        : field.options.data_src,
					title           : field.options.title,
					widget_settings : field.options.widget_settings || {},
				}
			};

			if (field.options.group) {
				field_group = groups[field.options.group];

				if (!field_group) {
					field_group = {
						widgets : [],
					};

					groups[field.options.group] = field_group;
				}
			}

			field_group.widgets.push(field_widget);
		}

		if (Object.size(groups) == 1) {
			action_widgets.include(groups.main.widgets);
		} else {
			let tabs = [];

			for (let name in groups) {
				let group = groups[name];

				let tab = {
					name     : name,
					title    : name.titleize(),
					contents : group.widgets,
				};

				tabs.push(tab);
			}

			action_widgets.push({
				type   : 'alchemy_tabs',
				config : {
					tabs : tabs,
				}
			});
		}

		action_widgets.push({
			type   : 'hawkejs_template',
			config : {
				sourcecode : `
					<al-button class="btn btn-submit" behaviour="submit">
						<al-state state-name="default">
							<al-icon icon-style="duotone" icon-name="floppy-disk"></al-icon>
							{%t "save" %}
						</al-state>
						<al-state state-name="error">
							<al-icon icon-style="duotone" icon-name="skull" icon-flags="shake"></al-icon>
							{%t "error" action="save" %}
						</al-state>
						<al-state state-name="done">
							<al-icon icon-style="duotone" icon-name="badge-check" icon-flags="beat"></al-icon>
							{%t "saved" %}
						</al-state>
						<al-state state-name="busy">
							<al-icon icon-style="duotone" icon-name="spinner" icon-flags="spin"></al-icon>
							{%t "saving" %}
						</al-state>
					</al-button>
				`
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
						},
						{
							type: "row",
							config: {
								widgets: [
									{
										type: "column",
										config: {
											widgets: [
												{
													"type": "alchemy_form",
													"config": {
														model     : this.ModelClass.type_name,
														purpose   : 'edit',
														widgets   : action_widgets
													}
												}
											]
										}
									},
									/*{
										type: 'column',
										config: {
											wrapper_class_names: 'toc-col',
											widgets: [
												{
													type: "table_of_contents",
													config: {
														parent_selector: 'al-widgets-row',
														elements_selector: 'al-field',
														title_selector: 'al-label'
													}
												}
											]
										}
									}*/
								]
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
							"type": "alchemy_table",
							"config": {
								fieldset     : fieldset,
								page_size    : 25,
								show_filters : true,
								id           : 'aft-' + this.ModelClass.type_name,
								use_url_pagination : true,
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

	return result;
});