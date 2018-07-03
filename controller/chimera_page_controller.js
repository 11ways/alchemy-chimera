/**
 * The Chimera Page Controller class
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.2.0
 * @version       0.5.0
 */
var Page = Function.inherits('Alchemy.Controller.Chimera.Editor', function Page(conduit, options) {
	Page.super.call(this, conduit, options);
});

Page.setAction(function edit(conduit) {
	this.render('chimera/page/edit');
});