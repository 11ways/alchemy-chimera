/**
 * The Chimera Static Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.2.0
 */
var ChimeraStatic = Function.inherits('Controller', function ChimeraStaticController(conduit) {

	Controller.call(this, conduit);
});

/**
 * The dashboard action
 *
 * @param   {Conduit}   conduit
 */
ChimeraStatic.setMethod(function dashboard(conduit) {
	this.set('pagetitle', 'Dashboard');
	this.render('chimera/dashboard');
});

ChimeraStatic.setMethod(function pageEditor(conduit) {
	this.render('chimera/page_editor');
});