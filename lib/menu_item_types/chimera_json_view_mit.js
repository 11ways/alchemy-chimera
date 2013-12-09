/**
 * The Json view Item Type
 */
alchemy.create('MenuItemType', function ChimeraJsonViewMIT() {

	this.defaultPieceSettings = {
		grouped: true
	};

	/**
	 * Configure this menu piece
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.configure = function configure(data, settings, callback) {

		var entries = {}, modelName, entry, model, grouped, parent = false;

		// Group this into one section?
		grouped = settings.grouped;

		if (grouped) {
			parent = 'ChimeraJsonGroupedModel';
			entry = this.cloneDefaultSettings();
			entry.id = parent;
			entry.title = __('chimera', 'JSON View');
			entry.icon = 'gear';

			// Add this parent entry to the entries object
			entries[parent] = entry;
		}

		for (modelName in alchemy.models) {
			if (alchemy.models[modelName].admin !== false) {

				// Get the model instance
				model = Model.get(modelName);

				// If the model does not use a table, or the admin
				// property is false, do not add it
				if (!model.useTable || (typeof model.admin !== 'undefined' && !model.admin)) {
					continue;
				}

				// Clone the default settings into a new object
				entry = this.cloneDefaultSettings();

				entry.id = 'ChimeraJsonModel' + modelName;
				entry.title = modelName;
				entry.url = Connection.url('Chimera-jsonview::index', {params: {model: modelName.underscore()}});
				entry.parent = parent;

				if (typeof model.icon === 'undefined') {
					// If no icon is defined, use circle-o by default
					entry.icon = 'circle-o';
				} else {
					entry.icon = model.icon;
				}

				entries[entry.id] = entry;
			}
		}

		callback(null, {entries: entries});
	};

});