/**
 * The Chimera Property Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function ChimeraPropertyModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.icon = 'tags';
		
		this.title = 'Property Types';
		
		this.types = alchemy.shared('Chimera.propertyTypes');

		this.blueprint = {
			name: {
				type: 'String',
				rules: {
					notempty: {message: 'This field should not be empty!'}
				},
				index: {
					unique: true,
					name: 'name',
					sparse: false,
					order: 'asc'
				}
			},
			type: {
				type: 'Enum',
				rules: {
					notempty: {message: 'This field should not be empty!'}
				}
			},
			title: {
				type: 'String',
				translatable: true
			},
			settings: {
				type: 'Object',
				fieldType: 'blueprint'
			}
		};
		
		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: ['name', 'type']
			},
			translations: {
				fields: ['title']
			},
			settings: {
				title: __('chimera', 'Settings'),
				fields: [
					{
						field: 'settings',
						type: 'blueprint',
						origin: 'type'
					}
				]
			}
		};

		this.modelIndex = {
			fields: ['name', 'type']
		};
	};

});