/**
 * The chimera-dashboard-button element
 * A button that handles "customize" and "reset" dashboard actions
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 */
const DashboardButton = Function.inherits('Alchemy.Element.Form.Button', 'Alchemy.Element.Chimera', 'DashboardButton');

/**
 * Set the custom element prefix to 'chimera'
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 */
DashboardButton.setStatic('custom_element_prefix', 'chimera');

/**
 * The action to perform: 'customize' or 'reset'
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 */
DashboardButton.setAttribute('action');

/**
 * The element has been added to the dom for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 */
DashboardButton.setMethod(function introduced() {

	// Call parent introduced first (sets up click/keyup listeners)
	introduced.super.call(this);

	// Listen to the activate event (emitted by parent Button class on click)
	this.addEventListener('activate', async e => {
		await this.handleAction();
	});
});

/**
 * Handle the dashboard action
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.4.0
 * @version  1.4.0
 */
DashboardButton.setMethod(async function handleAction() {

	let action = this.action;

	if (!action || (action !== 'customize' && action !== 'reset')) {
		console.error('Invalid dashboard button action:', action);
		return;
	}

	this.setState('busy');

	let route_name = action === 'customize'
		? 'Chimera.Static#customizeDashboard'
		: 'Chimera.Static#resetDashboard';

	try {
		await this.hawkejs_helpers.Alchemy.getResource({
			name   : route_name,
			method : 'post',
		});

		this.setState('done');

		// After a short delay, replace this button with the opposite action button
		setTimeout(() => {
			let template = action === 'customize'
				? 'chimera/toolbar/reset_dashboard_button'
				: 'chimera/toolbar/customize_dashboard_button';

			hawkejs.renderToElements(template, {}, (err, elements) => {

				if (err) {
					console.error('Failed to render replacement button:', err);
					return;
				}

				if (elements && elements.length > 0) {
					this.replaceWith(elements[0]);
				}
			});
		}, 500);

	} catch (err) {
		console.error('Failed to execute dashboard action:', err);
		this.setState('error', 3000, 'default');
	}
});
