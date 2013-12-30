$(document).ready(function() {
	$('body').on('click', '[data-toggle]', function(e) {
		var $this = $(this);

		e.preventDefault();

		$this.toggleClass($this.attr('data-toggle'));

	});
});

hawkejs.event.on({create: 'block'}, function(query, payload) {
	
	var timeOptions = {
		pickDate: true,
		pickTime: true,
		pick12HourFormat: false,
		format: 'YYYY/MM/DD HH:mm',
		icons: {
			time: 'fa fa-clock-o',
			date: 'fa fa-calendar',
			up: 'fa fa-arrow-up',
			down: 'fa fa-arrow-down'
		}
	};
	
	var $pickers = $('[data-hawkejs-block="content"] input.datepicker').not('.picked');

	$pickers.each(function() {

		var $this   = $(this),
		    $hidden = $this.siblings('input[type="hidden"]'),
		    value   = $this.val(),
		    date    = new Date(value);

		// Set the datetimepicker
		$this.datetimepicker(timeOptions);
		$this.data('DateTimePicker').setDate(date);

		// Enable the hidden field
		$hidden.attr('name', $this.attr('name'));

		// Set the beginning value on the hidden field
		$hidden.val(date.toISOString());

		// Make sure the datepicker field value doesn't get submitted
		$this.attr('name', '');

		// Make sure this doesn't get picked again
		$this.addClass('picked');
	});

	$pickers.on('change.dp', function(e) {
		var $this   = $(this),
		    $hidden = $this.siblings('input[type="hidden"]');

		$hidden.val(e.date.toISOString());
	});

});