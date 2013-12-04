/**
 * The Connection Menu Item Type
 */
alchemy.create('MenuItemType', function AdminModelsMIT() {

	/**
	 * Configure this menu piece
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.configure = function configure(data, settings, callback) {

		var entries = {}, modelName, entry;

		for (modelName in alchemy.models) {
			if (alchemy.models[modelName].admin !== false) {

				// Clone the default settings into a new object
				entry = this.cloneDefaultSettings();

				entry.id = 'AdminModel' + modelName;
				entry.title = modelName;
				entry.url = Connection.url('Admin_Controller_Index', {params: {controller: modelName.underscore()}});

				entries[entry.id] = entry;
			}
		}

		callback(null, {entries: entries});
	};

});