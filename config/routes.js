var chimera_section,
    chimera_menu;

// Create a new chimera section
chimera_section = Router.section('chimera', '/' + alchemy.plugins.chimera.routename);

// Link to the dashboard
chimera_section.add({
	title      : __('chimera', 'Dashboard'),
	name       : 'Dashboard',
	methods    : 'get',
	paths      : '/',
	handler    : 'Chimera.Static#dashboard',
	breadcrumb : 'chimera.dashboard'
});

chimera_section.add({
	name       : 'IdActionLink',
	methods    : ['get', 'post'],
	paths      : '/{controller}/{action}/{[ObjectId]id}',
	handler    : 'Chimera.{controller}#{action}',
	breadcrumb : 'chimera.{controller}.{action}.{id}'
});

chimera_section.add({
	name       : 'ActionLink',
	methods    : ['get', 'post'],
	paths      : '/{controller}/{action}',
	handler    : 'Chimera.{controller}#{action}',
	breadcrumb : 'chimera.{controller}.{action}'
});

chimera_section.add({
	name       : 'RecordAction',
	methods    : ['get', 'post'],
	paths      : '/{controller}/{subject}/{action}/{[ObjectId]id}',
	handler    : 'Chimera.{controller}#{action}',
	breadcrumb : 'chimera.{controller}.{subject}.{action}.{id}'
});

chimera_section.add({
	name       : 'ModelAction',
	methods    : ['get', 'post'],
	paths      : '/{controller}/{subject}/{action}',
	handler    : 'Chimera.{controller}#{action}',
	breadcrumb : 'chimera.{controller}.{subject}'
});

chimera_section.add({
	name       : 'SettingsAction',
	methods    : ['get', 'post'],
	paths      : '/settings',
	handler    : 'Chimera.Settings#index',
	breadcrumb : 'chimera.settings'
});

chimera_section.get('PageEditor', '/page_editor', 'Chimera.Static#pageEditor');

// @TODO: add this to the chimera router
Router.socket('al-rcommand-action', 'TaskChimera#action');

// alchemy.plugins.chimera.menu_items.addItem('route', {
// 	title      : 'Dashboard',
// 	route      : 'chimera@Dashboard',
// 	parameters : {}
// });


// Set user data for chimera
chimera_section.use(function setChimeraData(req, res, next) {

	// Always set the user data
	req.conduit.internal('UserData', req.conduit.session('UserData') || {});

	// Set the theme to use
	req.conduit.view_render.setTheme(alchemy.plugins.chimera.view_settings.theme);

	// Skip the rest if it's an ajax call
	if (req.conduit.ajax) {
		return next();
	}

	// req.conduit.getModel('Menu').getPosition('chimera_main_sidebar', function gotMainSidebarMenu(err, result) {
	// 	// Do nothing on an error,
	// 	if (err) {
	// 		return console.error('ERROR: ' + err);
	// 	}
	// });

	// Send the ACL layout options to the client
	req.conduit.expose('chimera-view-setting', alchemy.plugins.chimera.view_settings);

	// var chimera_menu = [];

	// chimera_menu.push({
	// 	title: 'Dashboard',
	// 	route: 'chimera@Dashboard',
	// 	parameters: {},
	// 	icon: {svg: 'chimera/home'}
	// });

	// chimera_menu.push({
	// 	title: 'Dashboard2',
	// 	route: 'chimera@Dashboard',
	// 	parameters: {},
	// 	children: [
	// 		{
	// 			title: 'Child',
	// 			route: 'chimera@Dashboard',
	// 			parameters: {},
	// 			icon: {svg: 'chimera/home'}
	// 		}
	// 	]
	// });

	req.conduit.set('chimera_menu', alchemy.plugins.chimera.menu);
	req.conduit.set('project_title', alchemy.plugins.chimera.title || 'Chimera');

	next();
});

Router.get('ChimeraCmsRedirect', '/cms', function(conduit) {
	conduit.redirect('/' + alchemy.plugins.chimera.routename);
});

Router.get('ChimeraAdminRedirect', '/admin', function(conduit) {
	conduit.redirect('/' + alchemy.plugins.chimera.routename);
});