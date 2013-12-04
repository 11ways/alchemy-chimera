/**
 * The Admin Navigation model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AdminNavigationModel (){

	this.positions = {
		common: 'Common',
		section: 'Section'
	};

	this.types = {
		link: 'Link',
		section: 'Section',
		page: 'Page'
	};

	this.blueprint = {
		position: 'String',
		section : 'String', // Optional
		name    : 'String',
		title   : 'String', // Should be translatable
		type    : 'String',
		owner   : 'ObjectId', // The user who made this
		public  : 'Boolean',  // Can other users use this?
		target  : 'ObjectId'  // The group who will HAVE to see this
	};
});