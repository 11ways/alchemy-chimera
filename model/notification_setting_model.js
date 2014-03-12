/**
 * The Notification Setting Model class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
/*Model.extend(function NotificationSettingModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.icon = 'cog';
		
		this.title = 'Notification Settings';
		
		this.belongsTo = {
			User: {
				modelName: 'User',
				foreignKey: 'written_by'
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
				type: 'Enum'//all - only from admin - none
			}
		};
	};
});*/