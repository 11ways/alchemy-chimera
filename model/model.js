var Model = alchemy.classes.Model;

console.log('Setting static property ...');

Model.prepareStaticProperty(function chimera() {
	return new alchemy.classes.ChimeraConfig(this);
});