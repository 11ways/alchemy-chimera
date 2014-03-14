/**
 * The Notification User Model class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function NotificationUserModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.icon = 'exclamation-circle';
		
		this.title = 'User Notifications';
				
		this.sort = {
			created: 'DESC',
		};
		
		this.belongsTo = {
			User: {
				modelName: 'User',
				foreignKey: 'user_id'
			},
			NotificationMessage: {
				modelName: 'NotificationMessage',
				foreignKey: 'notification_message_id'
			}
		};

		
		this.blueprint = {
			user_id: {
				type: 'ObjectId'
			},
			notification_message_id: {
				type: 'ObjectId'
			},
			read: {
				type: 'Boolean'
			}
		};
		
		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					'user_id',
					'notification_message_id',
					'read'
				]
			}
		};
		
		this.modelIndex = {
			fields: [
				'user_id',
				'notification_message_id',
				'read',
			]
		};
		
		this.actionLists = {
			paginate: ['index'],
			record: ['view']
		};
	};
});