/**
 * The Chimera Static Controller class
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.3.0
 */
var ChimeraStatic = Function.inherits('Alchemy.Controller.Chimera', function Static(conduit) {
	Static.super.call(this, conduit);
});

/**
 * The dashboard action
 *
 * @param   {Conduit}   conduit
 */
ChimeraStatic.setAction(function dashboard(conduit) {
	this.set('pagetitle', 'Dashboard');
	this.render('chimera/dashboard');
});

ChimeraStatic.setAction(function pageEditor(conduit) {
	this.render('chimera/page_editor');
});