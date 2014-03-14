alchemy.connect('Admin', '/' + alchemy.plugins.chimera.routename + '/my_settings', {controller: 'admin', action: 'my_settings', inflect: false, order: 1});
alchemy.connect('Admin', '/' + alchemy.plugins.chimera.routename + '/settings', {controller: 'admin', action: 'website_settings', inflect: false, order: 1});

alchemy.connect('Admin_Controller_Action_Id', '/' + alchemy.plugins.chimera.routename + '/:controller/:action/:id', {routeClass: 'admin', order: 1});
alchemy.connect('Admin_Controller_Action', '/' + alchemy.plugins.chimera.routename + '/:controller/:action', {routeClass: 'admin', order: 1});
alchemy.connect('Admin_Controller_Index', '/' + alchemy.plugins.chimera.routename + '/:controller', {action: 'index', routeClass: 'admin', order: 1});
alchemy.connect('Admin', '/' + alchemy.plugins.chimera.routename, {controller: 'admin', action: 'dashboard', inflect: false, order: 1});

alchemy.connect('Admin', '/' + alchemy.plugins.chimera.routename  + '/admin/update_notification/:id', {routeClass: 'admin', order: 1});