/**
 * The Chimera Page Controller class
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         1.0.0
 * @version       1.0.0
 */
var Page = Function.inherits('EditorChimeraController', function PageChimeraController(conduit, options) {
	PageChimeraController.super.call(this, conduit, options);
});

Page.setMethod(function edit(conduit) {

	this.render('chimera/page/edit');
});