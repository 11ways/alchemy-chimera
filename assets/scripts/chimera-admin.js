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

		if (date.valueOf()) {
			// Set the beginning value on the hidden field
			$hidden.val(date.toISOString());
		}

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

// Add add buttons to array fields
hawkejs.event.on({create: 'block', name: 'admin-content'}, function(query, payload) {

	$('#hawkejs-insert-block-admin-content hawkejs[data-chimera-field][data-array]').each(function() {

		var $this = $(this),
		    $last = $('[data-chimera-input]', $this).last(),
		    $empty = $('[data-chimera-empty-input]', $this);

		$empty = $(hawkejs.utils.decode($empty.html()));
		
		// Add an add button
		$('[data-chimera-add-entry]', $this).click(function(e) {
			e.preventDefault();
			$last.after($empty.clone());
		})
	});

	$('[data-apply-pagination]').click(function(e) {

		var $this = $(this),
		    conditions = {},
		    url;

		e.preventDefault();

		$('[data-pagination-filter]').each(function() {

			var $input = $(this),
			    name   = $input.attr('data-pagination-filter'),
			    val    = $input.val();

			// Do not query for empty strings
			if (val !== '') {
				conditions[name] = {value: $input.val()};
			}
		});

		url = window.location.origin + window.location.pathname;
		hawkejs.goToAjaxView(url, {filter: JSON.stringify(conditions)});
	});

	$('select.form-control').select2();

	$('input.select2-form-control[data-url]').each(function() {

		var $this = $(this),
		    assocUrl = $this.data('url'),
		    multiple = ($this.data('select-type') === 'multiple');

		$this.select2({
			allowClear: true,
			multiple: multiple,
			ajax: {
				url: assocUrl,
				cache: true,
				type: 'POST',
				dataType: 'json',
				quietMillis: 200,
				data: function(term, page) {
					return {
						q: term,
						page_limit: 10,
						page: page
					}
				},
				results: function (data, page) {
					return data;
				}
			},
			initSelection: function (element, callback) {
				
				var id = $(element).val();

				if (multiple) {
					id = String(id).split(',');
				}

				if (id) {
					$.post(assocUrl, {id: id}, function(data) {
						if (multiple) {
							callback(data.results)
						} else {
							callback(data.results[0]);
						}
					});
				}
			}
		});

		$this.select2('container').find('ul.select2-choices').sortable({
			containment: 'parent',
			start: function() {
				$this.select2('onSortStart');
			},
			update: function() {
				$this.select2('onSortEnd');
			}
		});
	});


});