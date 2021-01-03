/**
 * The base Chimera Controller class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  1.0.0
 */
let ChimeraController = Function.inherits('Alchemy.Controller', 'Alchemy.Controller.Chimera', function Chimera(conduit, options) {

	Chimera.super.call(this, conduit, options);

	// Set the theme
	if (alchemy.plugins.chimera.theme) {
		this.view_render.setTheme(alchemy.plugins.chimera.theme);
	}
});