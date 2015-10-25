// Create a new chimera section
var chimera = Router.section('chimera', '/' + alchemy.plugins.chimera.routename);

chimera.get('Dashboard', '/', 'ChimeraStatic#dashboard');

// Non-subject link
chimera.add(['get', 'post'], 'IdActionLink', '/:controller/:action/[ObjectId]:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'ActionLink', '/:controller/:action', '{controller}ChimeraController#{action}');

chimera.add(['get', 'post'], 'RecordAction', '/:controller/:subject/:action/[ObjectId]:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'DraftAction', '/:controller/:subject/:action/[ObjectId]:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'ModelAction', '/:controller/:subject/:action', '{controller}ChimeraController#{action}');

chimera.add(['get', 'post'], 'SettingsAction', '/:subject', 'SettingsChimeraController#index');

chimera.get('PageEditor', '/page_editor', 'ChimeraStatic#pageEditor');

// Add the dashboard to the menu deck
alchemy.plugins.chimera.menu.set('dashboard', {
	title: 'Dashboard',
	route: 'chimera@Dashboard',
	parameters: {},
	icon: {svg: 'chimera/home'}
}, 9999);

// Add the users to the menu
alchemy.plugins.chimera.menu.set('users', {
	title: 'Users',
	route: 'chimera@ModelAction',
	parameters: {
		controller: 'Editor',
		subject: 'user',
		action: 'index'
	},
	icon: {svg: 'chimera/office-worker'}
}, 9000);

// Set user data for chimera
chimera.use(function setChimeraData(req, res, next) {

	// Always set the user data
	req.conduit.internal('UserData', req.conduit.session('UserData') || {});

	// Skip the rest if it's an ajax call
	if (req.conduit.ajax) {
		return next();
	}

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