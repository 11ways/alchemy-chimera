
// Admin Sections go here
alchemy.plugins.admin.sections = {};

alchemy.sputnik.before('static', function() {
	pr('This is the admin plugin wanting to do something BEFORE the static stage'.red);
	pr(Plugin)
});