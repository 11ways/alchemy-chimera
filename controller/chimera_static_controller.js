/**
 * The Chimera Static Controller class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  1.0.0
 */
const ChimeraStatic = Function.inherits('Alchemy.Controller.Chimera', 'Static');

/**
 * The dashboard action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.0.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(function dashboard(conduit) {
	this.set('pagetitle', 'Dashboard');
	this.render('chimera/dashboard');
});

/**
 * The sidebar action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.2.2
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(function sidebar(conduit) {

	let widgets = [],
	    config;

	if (Array.isArray(alchemy.plugins.chimera.sidebar_menu)) {

		for (let entry of alchemy.plugins.chimera.sidebar_menu) {

			if (!entry.model && !entry.href) {
				continue;
			}

			let model,
			    title = entry.title;

			if (entry.model) {
				model = Model.get(entry.model);
			}

			if (!title) {
				if (model) {
					title = model.constructor.title;
				}

				if (!title && entry.href) {
					title = entry.href;
				}
			}

			if (entry.href) {
				widgets.push({
					type   : 'link',
					config : {
						link_type : 'href',
						link_settings : {
							href   : entry.href,
						},
						text: title
					}
				});
			} else {

				widgets.push({
					type   : 'link',
					config : {
						link_type : 'route',
						link_settings: {
							route : 'Chimera.Editor#index',
							parameters: [
								{name: 'model', value: model.constructor.type_name},
							],
						},
						text: title
					}
				});
			}
		}

	} else {

		let models = Model.getAllChildren();
		models.sortByPath(1, 'model_name');

		for (let model of models) {
			let entry = {
				type   : 'link',
				config : {
					link_type: 'route',
					link_settings: {
						route : 'Chimera.Editor#index',
						parameters: [
							{name: 'model', value: model.type_name},
						],
					},
					text: model.title
				}
			};

			console.log(entry)

			widgets.push(entry);
		}
	}

	config = [
		{
			"type": "navigation",
			"config": {
				"widgets": widgets
			}
		}
	];

	this.set('navigation_widgets', config);

	this.renderSegment('chimera/sidebar');
});