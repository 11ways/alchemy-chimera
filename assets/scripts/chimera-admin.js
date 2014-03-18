(function() {

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

// Apply datepicker
hawkejs.spot.introduced('hawkejs[data-chimera-input] input.datepicker', function(elements) {

	var $pickers = $(elements);

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
		//$this.addClass('picked');
	});

	$pickers.on('change.dp', function(e) {
		var $this   = $(this),
		    $hidden = $this.siblings('input[type="hidden"]');

		$hidden.val(e.date.toISOString());
	});
});

// Apply timeago
hawkejs.spot.introduced('.timeago', function(elements) {
	$(elements).timeago();
});

// Apply select2
hawkejs.spot.introduced('input.select2-form-control[data-url]', function(elements) {

	$(elements).each(function() {

		var $this      = $(this),
		    assocUrl   = $this.data('url'),
		    multiple   = ($this.data('select-type') === 'multiple'),
		    echoQuery  = $this.data('echo-query');

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
					$.post(assocUrl, {init: true, id: id}, function(data) {
						if (multiple) {
							callback(data.results)
						} else {
							callback(data.results[0]);
						}
					});
				}
			},
			formatResult: function(item) {
				return item.formatted || String(item.text);
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
})

$(document).ready(function() {

	// @todo: integrate into i18n
	// Intercept i18n elements that are created later
	hawkejs.spot.introduced('hawkejs[data-i18n]', function(elements){

		var $el, i;

		for (i = 0; i < elements.length; i++) {
			$el = $(elements[i]);

			if (!$el.html()) {
				hawkejs.serialDrones.i18n(function(){}, $el);
			}
		}
	});

	$('body').on('click', '[data-toggle] > a', function(e) {

		var $this = $(this),
		    $li   = $this.parent('li');

		e.preventDefault();
		e.stopPropagation();

		$li.toggleClass($li.attr('data-toggle'));
	});
});

hawkejs.event.on({create: 'implementation', name: 'chimera/model_editor_filters'}, function(query, payload) {

	var $filters = $('#hawkejs-implement-chimera__model_editor_filters.filters');

	$('#filters-collapse').on('click', function() {
		$('#collapse-filters').collapse('toggle');
	});

});

// Enable nanoscroller
hawkejs.event.on({create: 'block', name: 'admin-main'}, function(query, payload) {

	var $nanos = $('.nano');

	// Enable nanoScroller
	$nanos.nanoScroller();

	// Force a nanoScroller reset every 5 seconds
	setInterval(function nanoResetter() {
		$nanos.nanoScroller('reset');
	}, 5000);

	// Reset on every click
	$nanos.click(function(e) {
		setTimeout(function() {
			$nanos.nanoScroller('reset');
		}, 100);
	});
});

// Apply notification listeners
hawkejs.event.on('chimera-notifications', function(query) {

	$('.notification a').on('click', function(e){

		var $this = $(this),
		    notification_user_id,
		    unread_count,
		    url;

		// If unread
		if($this.data('usermessageid')){

			notification_user_id = $this.data('usermessageid');

			$this.removeData('usermessageid');
			$this.children('.unread').html('');
			
			// Update unread count
			unread_count = $('.badge-important').html();

			if(unread_count > 1){
				$('.badge-important').html(unread_count-1);
			} else {
				$('.badge-important').html('');
			}
			
			//do magical ajax stuff with notification_user_id
			url = '/chimera/admin/update_notification/'+notification_user_id;

			$.ajax({
				url: url,
				success: function( data ) {
				},
				error: function() {
				}
			});
		}
	});
});

hawkejs.event.on('create-chimera-filters', function(query, payload) {

	var filterFields = [],
	    fields = payload.fields,
	    modelName = payload.modelName,
	    filters   = payload.filters,
	    $filters  = $('#filters'),
	    $filterrows = $('tr', $filters),
	    $filterInput = $('#chimera-filters-input'),
	    $filterselect,
	    fieldMap = {},
	    filterConditions = [];

	/**
	 * Apply the filter & show settings to the current index
	 */
	function applyFormFilters(){

		var url = window.location.origin + window.location.pathname,
		    filters = [],
		    options = {},
		    data = {};

		$('#filters tr').each(function(){
			
			var filter = {},
			    $this  = $(this);

			filter.fieldPath = $this.find('.filter[data-filter-field]').data('filter-field');
			filter.condition = $this.find('select').val();
			filter.value = $this.find('.filter[data-filter-field]').val();

			if (filter.fieldPath) {
				filters.push(filter);
			}
		});

		// Get the amount of items to show, default to 20
		options.show = $('select[name="data[' + modelName + '][show]"]').val() || 20;
		
		// Get the search query
		options.search = $('input[name="data[' + modelName + '][search]"]').val() || false;

		// Do an AND or an OR search?
		options.andor = $('input[name="data[' + modelName + '][andor]"]:checked').val() || 'and';

		// Add the actual filters
		options.filters = filters;

		// Store everything in the data object under the current model name
		data[modelName] = options;

		// Load the page over ajax
		hawkejs.goToAjaxViewWithHistory(url, false, {data: data});
	}

	/**
	 * Create filter conditions
	 */
	function createConditions(filter){

		var $filtersTable    = $('table', $filters),
		    filtercount      = 0,
		    $andor           = $('#andor'),
		    cleanFilterName,
		    cleanTitle,
		    html;

		cleanFilterName = filter.fieldPath.replace('.', '_').toLowerCase()+filtercount;
		cleanTitle = filter.title.replace(/\&nbsp;/g, '');

		filtercount++;

		html = '<tr class="tr-'+ cleanFilterName +'" >';
		html += '<td><a class="btn btn-default btn-xs trash" data-filter-field="'+ filter.fieldPath +'"><i class="fa fa-trash-o"></i></a></td>';
		html += '<td>' + cleanTitle + '</td>';
		html += '<td>';

		if(!filter.value){
			filter.value = '';
		}

		html += '<select name="" id="select-'+ cleanFilterName +'" class="form-control-nos2">';
		html +=	'<option value="like">Contains</option>';
		html +=	'<option value="is">Equals</option>';
		html +=	'<option value="notlike">Doesn\'t contain</option>';
		html +=	'<option value="isnot">Is not equal to</option>';
		html +=	'</select>';
		html +=	'</td>';

		// Get the input field
		$.post('/chimera/editor/' + modelName.underscore() + '/filterInput/' + filter.fieldPath, function(result) {

			var template,
			    payload,
			    fieldHtml;

			payload = {
				data: result.data,
				id: 'input-' + cleanFilterName,
				filter: filter,
				modelName: result.modelName,
				fieldName: result.fieldName,
				fieldPath: result.fieldPath
			};

			template = hawkejs.getTemplate('chimera_filter_input/' + result.filterFieldName + '_filter_input');

			// Remove hawkejs specific code
			template = template.slice(32);
			template = template.slice(0, template.length-21)

			fieldHtml = hawkejs.ejs.render(template, payload);

			html += '<td>' + fieldHtml + '</td></tr>';
			$filtersTable.append(html);

			$('#filters-group').hide();

			if(filter.condition){
				$('#select-'+ cleanFilterName).val(filter.condition);
			}

			if(filter.value && filter.condition){
				$('#input-'+ cleanFilterName).show();
				$('#filterbtn, #applybtn, #clearbtn').show();
				$andor.show();
			}

			//BIND EVENTS:
			//CONDITION SELECT CHANGE EVENT: SHOWS/HIDES INPUT
			$('#input-'+ cleanFilterName).show();
			$('#filterbtn, #applybtn, #clearbtn').show();
			$andor.show();

			//INPUT KEYUP EVENT: ENABLES/DISABLES BUTTONS
			$('#input-'+ cleanFilterName).on('change', function(e){

				var $this   = $(this),
				    disable = false;

				if ($this.val() === '') {
					disable = true;
				}

				if(disable){
					$('#applybtn, #filterbtn').addClass("disabled");
					$andor.hide();
				} else {
					$('#applybtn, #filterbtn').removeClass("disabled");
					$andor.show();
				}
			});

			//TRASH CLICK EVENT: REMOVES FILTER AND ADDS BACK TO FILTER SELECT
			$('.trash').on('click', function(e){
				$(this).parent().parent().remove();
				$('#applybtn, #filterbtn').removeClass("disabled");
			});
		});
	}

	// Apply the change of amount of items to show on the page
	$('#show').on('change', applyFormFilters);

	// Toggle the filter collapse
	$('#filters-collapse').on('click', function(e){
		$('#collapse-filters').collapse('toggle');
	});

	$('#applybtn, #clearbtn').hide();

	// Create the filter fields for select2
	Object.each(fields, function(group, alias) {

		fieldMap[alias+'.__all'] = alias;

		filterFields.push({id: alias + '.__all', text: '<b>' + alias + '</b>', modelGroup: true, modelName: group.modelName});

		Object.each(group.fields, function(title, name) {

			fieldMap[alias+'.'+name] = title;

			filterFields.push({id: alias + '.' + name, text: '&nbsp;&nbsp;&nbsp;' + title});
		});
	});

	// Apply select2 to the input
	$filterInput.select2({
		data: filterFields,
		escapeMarkup: function(text){return text;}
	});

	$filterselect = $('#s2id_chimera-filters-input');

	// Hide the select by default
	$filterselect.hide();

	// Add the new filter when it has been chosen in the select
	$filterInput.on('change', function(){

		var filterData = $filterInput.select2('data'),
		    filterName = filterData.text,
		    fieldName  = filterData.id,
		    filter;

		if (filterName !== '- Column -') {

			$filterselect.hide();
			$filterInput.select2('val', '');

			filter = {title: filterName, fieldPath: fieldName, type: 'test'};

			createConditions(filter);
		}
	});

	//SHOW FILTERS SELECT ON 'ADD FILTER' CLICK
	$('#filterbtn').on('click', function(e) {
		e.preventDefault();
		$filterselect.show();
		$('#filterbtn, #applybtn').addClass("disabled");
	});

	//WHEN CLICKING CLEAR: REMOVE ALL FILTERS, ENABLE APPLY BUTTON
	$('#clearbtn').on('click', function(e){
		e.preventDefault();
		$('#clearbtn i').addClass('fa-spin');
		$('.trash').each(function(){
			$(this).parent().parent().remove();
			if ( $(".filter:hidden").length === 0){
				$('#applybtn, #filterbtn').removeClass("disabled");
				$('#andor').show();
			}
		});
		$('#applybtn').click();
	});

	$('#andor .radio').on('change', function(){
		$('#applybtn').removeClass("disabled");
	});

	$('#applybtn').on('click', function(e){
		e.preventDefault();
		applyFormFilters();
	});
	
	$('.search-input').on('keyup', function(e){
		if(e.keyCode === 13){
			e.preventDefault();
			applyFormFilters();
		}
	});
	$('.search-btn').on('click', function(e){
		e.preventDefault();
		applyFormFilters();
	});

	// Apply the previously set filters
	if (filters && typeof filters == 'object') {

		filters.forEach(function(filter) {
			filter.title = fieldMap[filter.fieldPath];
			
			createConditions(filter);
		});

		$('#collapse-filters').collapse('show');
		$('#applybtn, #clearbtn').show();
	}

});

function applyChimeraFields(query, payload) {

	var dataDo = function dataDo($element) {
		hawkejs.event.emit($element.attr('data-emit'), $element);
	};

	// Make the enter button apply the inline pagination
	$('input[data-pagination-filter]').keyup(function(e) {

		var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

		if(key == 13) {
			e.preventDefault();
			$('[data-apply-pagination]').click();
		}
	});

	// Apply ckeditor to textarea's
	$('#hawkejs-insert-block-admin-content .textfield').ckeditor();

	// Add an "Add entry" button to arrayable fields
	$('#hawkejs-insert-block-admin-content hawkejs[data-chimera-field][data-array]').each(function() {

		var $this     = $(this),
		    $empty    = $('[data-chimera-empty-input]', $this),
		    emptyHtml = $empty.html();

		$empty.remove();

		emptyHtml = '<hawkejs data-chimera-input>' + emptyHtml + '</hawkejs>'
		
		// Add an add button
		$('[data-chimera-add-entry]', $this).click(function(e) {

			var $button = $(this),
			    $inputs = $('>[data-chimera-input]', $this),
			    $last   = $inputs.last(),
			    cloneHtml,
			    $new;

			// Replace possible %INCREMENT% tags
			cloneHtml = emptyHtml.replace(/%INCREMENT%/g, $inputs.length);

			e.preventDefault();

			// Create a new jquery object
			$new = $(cloneHtml);

			// Add it before the button
			$button.before($new);

			$('[data-emit]', $new).each(function() {
				dataDo($(this));
			});
		})
	});

	// Emit events that have a 'data-emit' attribute
	$('#hawkejs-insert-block-admin-content [data-emit]').each(function() {
		dataDo($(this));
	});

	// Apply pagination
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

	// Apply select2 on select fields
	$('select.form-control').select2();

	// Apply the mentions field (wip)
	$('textarea.mention').each(function() {

		var $this   = $(this),
		    items   = hawkejs.parse(($this.siblings('.mention-source').html())),
		    $hidden = $this.siblings('.mention-hidden');

		$this.mentionsInput({
			minChars: 0,
			useCurrentVal: true,
			onDataRequest:function (query, callback) {

				var data = items;

				data = _.filter(data, function(item) {
					return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
				});

				callback.call(this, data);
			}
		});

		// Store the marked up value on changes
		$this.change(function() {
			$this.mentionsInput('val', function(result){
				$hidden.val(result);
			});
		});
	});

	// i18n static string stuff
	var $title = $('#mainTitle');

	if ($title.text().indexOf('Static String: Edit record') > -1) {

		// Disable the domain & key field when editing
		$('#AdminField-domain').attr('disabled', true);
		$('#AdminField-key').attr('disabled', true);

		// Go directly to the english tab
		$('a[href^="#chitab-en"]').tab('show')
	}

}

// Add add buttons to array fields
hawkejs.event.on({create: 'block', name: 'admin-content'}, applyChimeraFields);
hawkejs.event.on({create: 'block', name: 'tempeditor'}, applyChimeraFields);

}());