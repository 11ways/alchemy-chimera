alchemy.connect('Admin_Controller_Action_Id', '/admin/:controller/:action/:id', {routeClass: 'admin', order: 1});
alchemy.connect('Admin_Controller_Action', '/admin/:controller/:action', {routeClass: 'admin', order: 1});
alchemy.connect('Admin_Controller_Index', '/admin/:controller', {action: 'index', routeClass: 'admin', order: 1});
alchemy.connect('Admin', '/admin', {controller: 'admin', action: 'dashboard', inflect: false, order: 1});