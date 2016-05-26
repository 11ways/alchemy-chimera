var Model = alchemy.classes.Model;

/**
 * Prepare the static `chimera` config property
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type     {alchemy.classes.ChimeraConfig}
 */
Model.prepareStaticProperty(function chimera() {
	return new alchemy.classes.ChimeraConfig(this);
});

/**
 * Return the static chimera property inside an instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type     {alchemy.classes.ChimeraConfig}
 */
Model.setProperty(function chimera() {
	return this.constructor.chimera;
});