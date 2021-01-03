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
 * @version  1.0.0
 *
 * @param    {Conduit}   conduit
 */
ChimeraStatic.setAction(function sidebar(conduit) {

	let widgets = [],
	    config;

	let models = Model.getAllChildren();
	models.sortByPath(1, 'model_name');

	for (let model of models) {
		widgets.push({
			type   : 'link',
			config : {
				route : 'Chimera.Editor#index',
				parameters: [
					{name: 'model', value: model.type_name},
				],
				content: model.title
			}
		});
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

	this.render('chimera/sidebar');
});