// Create a new chimera section
var chimera = Router.section('chimera', '/' + alchemy.plugins.chimera.routename);

chimera.get('Dashboard', '/', 'ChimeraStatic#dashboard');

chimera.add(['get', 'post'], 'RecordAction', '/:controller/:subject/:action/:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'DraftAction', '/:controller/:subject/:action/:id', '{controller}ChimeraController#{action}');
chimera.add(['get', 'post'], 'ModelAction', '/:controller/:subject/:action', '{controller}ChimeraController#{action}');

//chimera.get('ListAction', '/:controller/:model/:action')


chimera.get('PageEditor', '/page_editor', 'ChimeraStatic#pageEditor');
