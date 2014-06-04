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
				rules: {
					notempty: {message: 'This field should not be empty!'}
				}
			},
			link: {
				type: 'String'
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
		if(typeof record.written_by == 'undefined'){
			record.written_by = this.render.req.session.user._id;
		}
		if(typeof record.sent == 'undefined'){
			record.sent = false;
		}
		//TODO: ONLY SET TO TRUE WHEN USER CLICKED SEND + CANT EDIT IF ALREADY SENT
		record.sent = true;
		this.parent();
	};
	
	
	/*
	 * After save: created a notification for each selected member / each member in the selected acl group
	 * Take user settings into account
	 * 
	 * @author   Kjell Keisse   <kjell@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 * 
	 */
	this.afterSave = function afterSave(next, record, errors) {
		this.parent('afterSave', null, function(){
			var users = {}, 
				or = {},
				conditions = {};
				
			
			if(record.sent){
				//ADD SELECTED ACL GROUPS TO CONDITIONS
				if(typeof record.acl_group_id !== 'undefined'){
					for(var i = 0; i<record.acl_group_id.length; i++){
						var group_id = record.acl_group_id[i];
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
						var user_id = record.user_id[i];
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
				Model.get('User').find('all', {conditions: conditions}, function(err, items) {
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
	
	/*
	 * Create a notification message
	 * 
	 * @author   Kjell Keisse   <kjell@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 * 
	 * message = string
	 * type = string (info / warning / danger / success)
	 * who = string (acl_group name)
	 * link = string
	 * external = boolean
	 * mail = booleon
	 * 
	 */
	this.notify = function notify(message, type, who, link, external, mail) {

		var or = {},
			conditions = {},
			notification_message = {},
			users_acl_group = '',
			users = [];
		
		//set default values
		if(!message){
			message = 'Something has changed!';
		}
		if(!who){
			who = 'Superuser';
		}
		if(!mail){
			mail = false;
		}
		if(!external){
			external = false;
		}
		if(!link){
			link = '';
		}
		if(!type || (type!== 'info' && type!== 'warning' && type!== 'danger' && type!== 'success')){
			type = 'info';
		}
		
		notification_message.message = message;
		notification_message.notification_type = type;
		notification_message.link = link;
		notification_message.external_link = external;
		notification_message.send_mail = mail;
		notification_message.sent = true;
		
		//get all acl groups
		Model.get('AclGroup').find('all', function(err, items) {
			
			//find root acl id and who acl id
			var root_acl_id = '';
			for(var i=0; i<items.length; i++){
				var acl_group = items[i].AclGroup;
				if(acl_group.root === true){
					root_acl_id = acl_group._id;
				}
				
				if(acl_group.name === who){
					users_acl_group = acl_group._id;
				}
			}
			//if no user group is found for "who", use superuser
			if(users_acl_group === ''){
				users_acl_group = root_acl_id;
			}
			
			or = {};
			or['acl_group_id'] = root_acl_id;
			conditions['$or'] = or;
						
			//find superadmin _id for message written_by
			Model.get('User').find('first', {fields: ['User._id'], conditions: conditions, sort: {username: 'ASC'}}, function(err, record) {
				notification_message.written_by = record[0].User._id;
				
				or = {};
				or['acl_group_id'] = users_acl_group;
				conditions['$or'] = or;
				
				//find users belonging to "who" usergroup
				Model.get('User').find('all', {fields: ['User._id'], conditions: conditions}, function(err, items) {
					for(var i=0; i<items.length; i++){
						users.push(items[i].User._id);
					}
					notification_message.user_id = users;
					
					//save notificationmessage
					Model.get('NotificationMessage').save(notification_message, function(err, result){
						pr(err);
					});
				});
			});
		});
		
	};
	
	function empty(object) {
		for (var property in object) {
			if (object.hasOwnProperty(property))
				return false;
		}

		return true;
	}
	
});