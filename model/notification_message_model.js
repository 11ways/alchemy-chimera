/**
 * The Notification Message Model class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function NotificationMessageModel() {

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'message';

		this.icon = 'exclamation-circle';
		
		this.title = 'Notification Messages';
		
		this.notification_types = {
			'info': 'Info (blue)',
			'warning': 'Warning (yellow)',
			'danger': 'Danger (red)',
			'success': 'Success (green)'
		};
		
		this.belongsTo = {
			User: {
				modelName: 'User',
				foreignKey: 'written_by'
			}
		};
		
		this.hasAndBelongsToMany = {
			User: {
				modelName: 'User',
				foreignKey: 'user_id'
			},
			AclGroup: {
				modelName: 'AclGroup',
				foreignKey: 'acl_group_id'
			}
		};
		
		this.blueprint = {
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
			external_link: {
				type: 'Boolean'
			},
			notification_type: {
				type: 'Enum'
			},
			image_id: {
				type: 'ObjectId',
				fieldType: 'media_file'
			},
			send_mail: {
				type: 'Boolean'
			},
			written_by: {
				type: 'ObjectId'
			},
			sent: {
				type: 'Boolean'
			}
		};
		
		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					'acl_group_id',
					'user_id',	
					'message',
					'link',
					'external_link',
					'notification_type',
					'image_id',
					'send_mail'
				]
			}
		};

		this.modelIndex = {
			fields: [
				'message',
				'notification_type',
				'written_by',
				'sent'
			]
		};
		
		this.actionLists = {
			paginate: ['index', 'add'],
			record: ['view']
		};
	};
	
	this.beforeSave = function beforeSave(next, record, options) {
		record.written_by = this.render.req.session.user._id;
		if(typeof record.sent == 'undefined'){
			record.sent = false;
		}
		//TODO: ONLY SET TO TRUE WHEN USER CLICKED SEND + CANT EDIT IF ALREADY SENT
		record.sent = true;
		this.parent();
	};
	
	this.afterSave = function afterSave(next, record, errors) {
		this.parent('afterSave', null, function(){
			var users = {}, 
				or = {},
				conditions = {};
				
			
			if(record.sent){
				//ADD SELECTED ACL GROUPS TO CONDITIONS
				if(typeof record.acl_group_id !== 'undefined'){
					for(var i = 0; i<record.acl_group_id.length; i++){
						var group_id = new RegExp('.*?' + record.acl_group_id[i] + '.*?', 'i');
						if(typeof or['User.acl_group_id'] == 'undefined'){
							or['User.acl_group_id'] = [];
						}
						or['User.acl_group_id'].push(group_id);
					}
					pr('CREATE NOTIFICATION_USER RECORDS FOR SELECTED ACL GROUPS');
				}

				//ADD SELECTED USERS TO CONDITIONS
				if(typeof record.user_id !== 'undefined'){
					for(var i = 0; i<record.user_id.length; i++){
						var user_id = new RegExp('.*?' + record.user_id[i] + '.*?', 'i');
						if(typeof or['User._id'] == 'undefined'){
							or['User._id'] = [];
						}
						or['User._id'].push(user_id);
					}
				}

				if (!empty(or)) {
					conditions['$or'] = or;
				}

				//FIND USERS
				Model.get('User').find('all', {fields: ['User._id', 'User.email', 'NotificationSetting.can_mail', 'NotificationSetting.get_notifications'], conditions: conditions}, function(err, items) {
					var notifications = [];
					var mail_to = [];
					//LOOP USERS AND ADD THEM TO NOTIFICATIONS OBJECT
					for(var i=0; i<items.length; i++){
						var user = items[i];
						var notification_settings = user.NotificationSetting;
						
						if(notification_settings && notification_settings.get_notifications == 'none'){
							continue; //IF USER DOENST WANT NOTIFICATIONS
						}
						
						// @TODO: IF ( RECORD.WRITTEN_BY = NOT ADMIN && USER.NOTIFICATIONSETTINGS = ADMIN_ONLY ) : CONTINUE 
						
						
						var notification = {};
						notification.NotificationUser = {};
						notification.NotificationUser.notification_message_id = record._id;
						notification.NotificationUser.user_id = user.User._id;
						notification.NotificationUser.read = false;
						
						notifications.push(notification);
						
						//only send mail to users who allow it, also mail if user doesnt have settings
						if(record.send_mail && notification_settings && notification_settings.can_mail || record.send_mail && notification_settings==null){
							mail_to.push(user.User.email);
						}
					}
					
					if(notifications.length > 0){
						Model.get('NotificationUser').save(notifications, function(err, results) {
							if(err){
								pr(err);
							}
						});
					}
					
					// @TODO: SEND MAILS
					if(mail_to.length > 0){
						pr('SEND MAILS TO '+mail_to);
					}

				});
			}

			next();
		}, record, errors);
	};
	
	this.notify = function notify(message, type, who, link, external, mail) {
		pr(message);
		
		//who: 
		//default = administrators
		//accept = everything in aclgroup
		
		//type = warning/danger/success/info
		
		//mail = true/false
		
		//sent=true
		
		//written_by = Superuser
		
		//link = string
		
		//external = boolean
		
	};
	
	function empty(object) {
		for (var property in object) {
			if (object.hasOwnProperty(property))
				return false;
		}

		return true;
	}
	
});