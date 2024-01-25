// Create a new chimera section.
// By default this will be /chimera
let chimera_section = Router.section('chimera', '/chimera');

chimera_section.requirePermission('chimera');

// Link to the dashboard
chimera_section.add({
	title      : __('chimera', 'Dashboard'),
	name       : 'Dashboard',
	methods    : 'get',
	paths      : '/',
	handler    : 'Chimera.Static#dashboard',
});

// Settings editor
chimera_section.add({
	name            : 'Chimera.Settings#editor',
	methods         : ['post', 'get'],
	paths           : '/settings',
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
