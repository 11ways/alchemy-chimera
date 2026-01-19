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
 * @version  1.4.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(async function dashboard(conduit) {

	const DashboardConfig = this.getModel('Chimera.DashboardConfig');

	let user_id = conduit.session('UserData')?.$pk;
	let config;
	let is_user_dashboard = false;

	// First, try to find a user-specific dashboard
	if (user_id) {
		config = await DashboardConfig.find('first', {
			conditions: {
				user_id: user_id,
			}
		});

		if (config) {
			is_user_dashboard = true;
		}
	}

	// Fall back to the default dashboard
	if (!config) {
		config = await DashboardConfig.find('first', {
			conditions: {
				is_default: true,
			}
		});
	}

	// If no default exists, create one
	if (!config) {
		config = DashboardConfig.createDocument({
			name       : 'Default Dashboard',
			is_default : true,
			widgets    : null,
		});

		await config.save();

		// Re-fetch to ensure we have the full document with _id
		config = await DashboardConfig.findByPk(config.$pk);
	}

	// Get the toolbar manager (created by ChimeraController base class)
	let manager = this.toolbar_manager;

	// Set the document on the manager for editing
	manager.setDocument(config);

	// Add dashboard-specific info and buttons to the toolbar manager
	manager.is_user_dashboard = is_user_dashboard;
	manager.has_user_id = !!user_id;

	// Add dashboard management buttons
	if (user_id) {
		if (is_user_dashboard) {
			// User has a custom dashboard - show reset button
			manager.addTemplateToRender('buttons', 'chimera/toolbar/reset_dashboard_button');
		} else {
			// User is viewing default - show customize button
			manager.addTemplateToRender('buttons', 'chimera/toolbar/customize_dashboard_button');
		}
	}

	this.set('pagetitle', 'Dashboard');
	this.set('dashboard_config', config);
	this.set('is_user_dashboard', is_user_dashboard);
	this.setToolbarManagerVariable();
	this.render('chimera/dashboard');
});

/**
 * Create a personalized dashboard for the current user
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(async function customizeDashboard(conduit) {

	const DashboardConfig = this.getModel('Chimera.DashboardConfig');

	let user_id = conduit.session('UserData')?.$pk;

	if (!user_id) {
		return conduit.error(new Error('You must be logged in to customize the dashboard'));
	}

	// Check if user already has a custom dashboard
	let existing = await DashboardConfig.find('first', {
		conditions: {
			user_id: user_id,
		}
	});

	if (existing) {
		return conduit.end({
			success: true,
			message: 'You already have a customized dashboard',
			pk: existing.$pk,
		});
	}

	// Find the default dashboard to copy from
	let default_config = await DashboardConfig.find('first', {
		conditions: {
			is_default: true,
		}
	});

	// Create a new dashboard for this user
	let user_dashboard = DashboardConfig.createDocument({
		name       : 'My Dashboard',
		is_default : false,
		user_id    : user_id,
		widgets    : default_config?.widgets || null,
	});

	await user_dashboard.save();

	conduit.end({
		success: true,
		message: 'Dashboard customized',
		pk: user_dashboard.$pk,
	});
});

/**
 * Reset the user's dashboard back to default
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(async function resetDashboard(conduit) {

	const DashboardConfig = this.getModel('Chimera.DashboardConfig');

	let user_id = conduit.session('UserData')?.$pk;

	if (!user_id) {
		return conduit.error(new Error('You must be logged in to reset the dashboard'));
	}

	// Find and remove the user's custom dashboard
	let user_dashboard = await DashboardConfig.find('first', {
		conditions: {
			user_id: user_id,
		}
	});

	if (user_dashboard) {
		await user_dashboard.remove();
	}

	conduit.end({
		success: true,
		message: 'Dashboard reset to default',
	});
});

/**
 * The sidebar action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.2.6
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
								{
									name: 'model',
									value: Plugin.modelNameToUrl(model.constructor.model_name),
								},
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

		widgets.push({
			type   : 'link',
				config : {
					link_type: 'route',
					link_settings: {
						route : 'Chimera.Settings#editor',
					},
					text: new Classes.Alchemy.Microcopy('alchemy.settings'),
				}
		});

		for (let model of models) {

			// Skip abstract classes (like `App`)
			// or models without any chimera configuration
			if (model.is_abstract || !model.chimera.has_configuration) {
				continue;
			}

			let entry = {
				type   : 'link',
				config : {
					link_type: 'route',
					link_settings: {
						route : 'Chimera.Editor#index',
						parameters: [
							{
								name: 'model',
								value: Plugin.modelNameToUrl(model.model_name),
							},
						],
					},
					text: model.title
				}
			};

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