// Create a new chimera section
var chimera = Router.section('chimera', '/' + alchemy.plugins.chimera.routename);

chimera.get('Dashboard', '/', 'ChimeraStatic#dashboard');

chimera.add(['get', 'post'], 'RecordAction', '/:controller/:subject/:action/:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'DraftAction', '/:controller/:subject/:action/:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'ModelAction', '/:controller/:subject/:action', '{controller}ChimeraController#{action}');

chimera.add(['get', 'post'], 'SettingsAction', '/:subject', 'SettingsChimeraController#index');

//chimera.get('ListAction', '/:controller/:model/:action')


chimera.get('PageEditor', '/page_editor', 'ChimeraStatic#pageEditor');

chimera.use(function setUserData(req, res, next) {
	req.conduit.internal('UserData', req.conduit.session('UserData') || {});
	next();
});

Router.get('ChimeraCmsRedirect', '/cms', function(conduit) {
	conduit.redirect('/' + alchemy.plugins.chimera.routename);
});

Router.get('ChimeraAdminRedirect', '/admin', function(conduit) {
	conduit.redirect('/' + alchemy.plugins.chimera.routename);
});