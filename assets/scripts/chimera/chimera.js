hawkejs.scene.after({
	type     : 'set',
	name     : 'page-notification',
}, function onNotification(element, variables, block) {

	let notification = element.querySelector('.notification');

	if (!notification) {
		return;
	}

	setTimeout(() => {
		notification.classList.add('removing');

		setTimeout(() => {
			notification.remove();
		}, 2500);
	}, 4 * 1000);
});

hawkejs.scene.on('rendered', function onRendered(vars, renderer) {

	let manager = vars.get('toolbar_manager');

	if (!manager) {
		return;
	}

	let toolbar = document.querySelector('al-editor-toolbar');
	toolbar.toolbar_manager = manager;
});