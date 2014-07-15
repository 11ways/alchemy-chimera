var fields = alchemy.shared('Chimera.modelEditorFields');

Model.prototype.getModelEditorField = function getModelEditorField(name, cache) {

	var info,
	    type,
	    model,
	    config,
	    augment,
	    assocType;

	// See if it's already available in the possible cache
	if (cache && cache[name]) return cache[name];

	// Get info on the wanted field
	info = alchemy.getFieldInfo(name, this);

	if (info.modelName == this.modelName) {
		model = this;
	} else {
		model = this.getModel(info.modelName);
	}

	// Get the blueprint config
	config = model.blueprint[info.field];

	if (config) {

		if (config.fieldType) {
			type = fields[config.fieldType.underscore()];
		}

		if (!type && config.assocType) {
			assocType = config.assocType.toLowerCase();

			switch(assocType) {

				case 'hasandbelongstomany':
					assocType = 'habtm';
					break;

				case 'belongsto':
				case 'hasone':
				case 'hasonechild':
				case 'hasoneparent':
					assocType = 'has_one';
					break;

				case 'hasmany':
					assocType = 'has_many';
					break;

				default:
					assocType = 'object_id';
					break;
			}

			type = fields[assocType];
		}

		if (!type) {
			type = config.type.underscore();
			type = fields[type];
		}

		if (!type) {
			type = fields['string'];
		}

		// Inject the __augment__ object into this new object
		augment = alchemy.inject({}, this.__augment__);

		// augment the view instance
		type = alchemy.augment(type, augment);

		// Attach the model
		type.model = model;

		// Attach the config
		type.config = config;

		// Attach the info
		type.info = info;

		return type;
	}
};

// Use the filter modal everywhere, because the inline filter is broken
Model.prototype.useSeparateFilterPage = true;