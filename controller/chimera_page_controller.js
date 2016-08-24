/**
 * The Chimera Page Controller class
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.2.0
 * @version       0.3.0
 */
var Page = Function.inherits('Alchemy.EditorChimeraController', function PageChimeraController(conduit, options) {
	PageChimeraController.super.call(this, conduit, options);
});

Page.setMethod(function edit(conduit) {

	this.render('chimera/page/edit');
});