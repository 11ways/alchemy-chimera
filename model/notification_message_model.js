/**
 * The Notification Message Model class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
/*Model.extend(function NotificationMessageModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.icon = 'exclamation-circle';
		
		this.title = 'Notification Messages';
		
		this.belongsTo = {
			User: {
				modelName: 'User',
				foreignKey: 'written_by'
			}
		};
		
		this.hasAndBelongsToMany = {
			NotificationUser: {
				modelName: 'NotificationUser',
				foreignKey: 'user_notification_id'
			}
		};
		
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
			users: {
				type: 'Object'
			},
			message: {
				type: 'String',
				translatable: true,
				rules: {
					notempty: {message: 'This field should not be empty!'}
				}
			},
			link: {
				type: 'String',
				translatable: true
			},
			notification_type: {
				type: 'Enum'
			},
			image_id: {
				type: 'ObjectId',
				fieldType: 'media_file'
			},
			mail: {
				type: 'Boolean'
			},
			written_by: {
				type: 'ObjectId'
			},
			sent: {
				type: 'Boolean'
			}
		};
	};
});*/