/**
 * The List Property type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('PropertyType', function ListPropertyType() {

	this.blueprint = {
		values: {
			type: 'Object',
			fieldType: 'blueprint',
			blueprint: {
				name: {
					type: 'String'
				},
				title: {
					type: 'String',
					translatable: true
				}
			},
			array: true
		}
	};

});