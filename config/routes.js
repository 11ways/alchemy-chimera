// Create a new chimera section.
// By default this will be /chimera
let chimera_section = Router.section('chimera', '/' + alchemy.plugins.chimera.base_path);

chimera_section.requirePermission('chimera');

// Link to the dashboard
chimera_section.add({
	title      : __('chimera', 'Dashboard'),
	name       : 'Dashboard',
	methods    : 'get',
	paths      : '/',
	handler    : 'Chimera.Static#dashboard',
});
// Editor index action
chimera_section.add({
	name       : 'Chimera.Editor#index',
	methods    : 'get',
	paths      : '/editor/{model}/index',
	breadcrumb : 'chimera.editor.{model}'
});

// Editor add action
chimera_section.add({
	name       : 'Chimera.Editor#add',
	methods    : ['get', 'post'],
	paths      : '/editor/{model}/add',
	breadcrumb : 'chimera.editor.{model}.add'
});

// Editor edit action
chimera_section.add({
	name       : 'Chimera.Editor#edit',
	methods    : ['get', 'post'],
	paths      : '/editor/{model}/edit/{pk}',
	breadcrumb : 'chimera.editor.{model}.edit.{pk}'
});

// Editor trash action
chimera_section.add({
	name       : 'Chimera.Editor#trash',
	methods    : ['get', 'post'],
	paths      : '/editor/{model}/trash/{pk}',
	breadcrumb : 'chimera.editor.{model}.trash.{pk}'
});

// Editor data action
chimera_section.add({
	name            : 'Chimera.Editor#records',
	methods         : ['post'],
	paths           : '/api/editor/{model}/records',
	is_system_route : true,
});

// Sidebar
chimera_section.add({
	name            : 'Chimera.Static#sidebar',
	methods         : ['get'],
	paths           : '/api/content/sidebar',
	is_system_route : true,
});

alchemy.sputnik.after('base_app', () => {

	let prefixes = Prefix.all();
	let preview_paths = {
		'': '/editor/{model}/preview/{pk}',
	};

	for (let prefix in prefixes) {
		preview_paths[prefix] = '/editor/{model}/preview/{pk}';
	}

	// Preview action
	chimera_section.add({
		name       : 'Chimera.Editor#preview',
		methods    : ['get', 'post'],
		paths      : preview_paths,
		breadcrumb : 'chimera.editor.{model}.preview.{pk}'
	});
});

return
var chimera_menu;

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
	req.conduit.renderer.setTheme(alchemy.plugins.chimera.view_settings.theme);

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