/**
 * The Chimera DashboardConfig Model
 * Stores widget configurations for the Chimera dashboard
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
const DashboardConfig = Function.inherits('Alchemy.Model.Chimera', 'DashboardConfig');

/**
 * Configure the schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.3.0
 * @version  1.3.0
 */
DashboardConfig.constitute(function addFields() {

	// Name of this dashboard configuration
	this.addField('name', 'String', {
		title: 'Name',
		required: true,
	});

	// The widget configuration
	this.addField('widgets', 'Widgets', {
		title: 'Widgets',
	});

	// Is this the default dashboard?
	this.addField('is_default', 'Boolean', {
		title: 'Default',
		default: false,
	});

	// Optional: belongs to a specific user for per-user dashboards
	this.belongsTo('User', {
		title: 'User',
		description: 'If set, this is a user-specific dashboard',
	});
});
