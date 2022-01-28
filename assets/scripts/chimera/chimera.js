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