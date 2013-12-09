$(document).ready(function() {
	$('body').on('click', '[data-toggle]', function(e) {
		var $this = $(this);

		e.preventDefault();

		$this.toggleClass($this.attr('data-toggle'));

	});
});