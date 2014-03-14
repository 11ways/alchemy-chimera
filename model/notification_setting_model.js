/**
 * The Notification Setting Model class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function NotificationSettingModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.icon = 'cog';
		
		this.title = 'Notification Settings';
		
		this.get_notifications = {
			'all': __('chimera', 'Receive all notifications'),
			'admin_only': __('chimera', 'Only receive notifications from administrators'),
			'none': __('chimera', 'Don\'t receive any notifications'),
		};
		
		this.hasOneParent = {
			User: {
				modelName: 'User',
				foreignKey: 'user_id'
			}
		};
		
		this.blueprint = {
			user_id: {
				type: 'ObjectId',
				index: {
					unique: true
				}
			},
			can_mail: {
				type: 'Boolean'
			},
			get_notifications: {
				type: 'Enum'
			}
		};
		
		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					'can_mail',
					'get_notifications'
				]
			}
		};

		this.modelIndex = {
			fields: [
				'user_id',
				'can_mail',
				'get_notifications',
			]
		};
		
		this.actionLists = {
			paginate: ['index'],
			record: ['view', 'edit']
		};
	};
});