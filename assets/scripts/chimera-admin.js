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

hawkejs.spot.introduced('.fillwidth', function(elements) {

	$(elements).each(function() {

		return;

		var $this      = $(this),
		    $parent    = $this.parent(),
		    $siblings  = $this.siblings(),
		    totalWidth = $parent.innerWidth(),
		    usedWidth  = 0;

		if (!totalWidth) {
			totalWidth = $parent.parent().innerWidth();
		}

		for (var i = 0; i < $siblings.length; i++) {
			usedWidth += $($siblings[i]).outerWidth();
		}

		$this.width(totalWidth-usedWidth);
	});

});

// Make errors clickable (for stack traces)
hawkejs.spot.introduced('.alchemy-error', function(elements) {

	$(elements).on('click', 'div.message', function(e) {

		var $this = $(this);
		$this.parents().find('.stack').toggle();
	});

});

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

// Apply select2 once the inputs appear
hawkejs.spot.appeared('input.select2-form-control[data-url]', {parent: true}, function(elements) {

	$(elements).each(function() {

		var $this      = $(this),
		    assocUrl   = $this.data('url'),
		    multiple   = ($this.data('select-type') === 'multiple'),
		    echoQuery  = $this.data('echo-query');

		$this.select2({
			// Allow the user to remove a selected option
			allowClear: true,
			placeholder: ' ',

			// Allow multiple selections?
			multiple: multiple,

			// Ajax settings
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

				var $element = $(element),
				    id       = $element.val();

				// No need to query the server for simple string types
				if ($element.data('string-type')) {
					callback({id: id, text: id, formatted: id});
					return;
				}

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
			},
			escapeMarkup: function(m) { return m; }
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

(function() {

	var openTab;

	// Remember which tab was opened before a save
	hawkejs.spot.introduced('#hawkejs-insert-block-admin-content button.savemodeledit', function(elements) {

		$(elements).click(function(e) {
			
			// Get the href of the open tab
			openTab = $('#hawkejs-insert-block-admin-content .grouptabs li.active a').attr('href');

			// Remove the trailing uid
			openTab = openTab.replace(/[\s\d]+$/, '');
		});

	});

	// When a new tab is inserted
	hawkejs.spot.introduced('#hawkejs-insert-block-admin-content .grouptabs', function(elements) {

		// If no openTab is defined, do nothing
		if (!openTab) {
			return;
		}

		// Activate the tab
		$('a[href^="' + openTab + '"]', $(elements)).tab('show');
	});

	hawkejs.spot.introduced('[data-remove-row]', function(elements) {

		$(elements).click(function(e) {

			var $this = $(this);

			$this.parents('tr').remove();

			e.preventDefault();
		});
	});


	var activeButton;

	hawkejs.spot.introduced('button[data-modal-url]', function(elements) {

		$(elements).click(function(e) {

			var $this = $(this);

			e.preventDefault();

			activeButton = $this;

			hawkejs.goToAjaxView($this.data('modal-url'), {modal: true}, undefined, function(payload){

			});
		});
	});

	hawkejs.spot.introduced('.selectpicker', function(elements) {
		$(elements).selectpicker();
	});

	hawkejs.spot.introduced('#tempeditor .btn.modalsubmit', function(elements) {

		$(elements).click(function(e) {

			// Prevent the browser from submitting the form
			e.preventDefault();

			// Turn the submit button into a jQuery object
			var $this = $(this);

			// Get the parent form
			var $form = $this.parents('form');

			// Get the wanted action
			var action = $form.attr('action');

			// Get the wanted method
			var method = $form.attr('method').toLowerCase();

			// Get the data
			var getData, postData;

			var href = action;

			function handleModalResponse(variables, textStatus, jqXHR) {

				if (!activeButton) {
					if (console) {
						console.error('Could not determine modal origin');
					}
					return;
				}

				var item   = variables.item[variables.modelName],
				    $input = activeButton.parents('.select2group').find('.select2-form-control'),
				    original;

				if (item) {

					// Get the original value
					original = $input.select2('val');

					// If it's an array, add the new value
					if (Array.isArray(original)) {
						$input.select2('val', original.concat(item._id));
					} else {
						// Replace the original value
						$input.select2('val', item._id);
					}

					// Hide the modal
					$this.parents('.modal').modal('hide');
				}

			};

			if (getData) href = hawkejs.buildUrl(href, getData);

			if (method === 'get') {
				getData = $form.jsonify();
			} else if (method === 'post') {
				postData = $form.jsonify();
			}

			// Is POST data is given, turn it into a JSON post
			if (postData) {
				$.ajax(href, {
					data: JSON.stringify(postData),
					contentType : 'application/json',
					type: 'POST',
					success: handleModalResponse,
					headers: {
						'x-hawkejs-request': true
					}
				});
			} else {
				// Get the variables we need to build this page
				$.ajax(href, {
					type: 'GET',
					success: handleModalResponse,
					headers: {
						'x-hawkejs-request': true
					}
				});
			}
		});

	});

}());

// Show a modal when menu piece config data is loaded
hawkejs.event.on({create: 'block', name: 'tempeditor'}, function(identifier, data) {
	$('#tempeditor div.modal').modal();
});

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

hawkejs.event.on('create-chimera-filters-modal', function(query, payload) {

	var filterFields = [],
	    fields = payload.fields,
	    modelName = payload.modelName,
	    filters   = payload.filters,
	    $filters  = $('#filters'),
	    $filterrows = $('tr', $filters),
	    $filterInput = $('#chimera-filters-input'),
	    $modal = $('#filterModal'),
	    $filterselect,
	    fieldMap = {},
	    filterConditions = [];

	/**
	 * Apply the filter & show settings to the current index
	 */
	function applyFormFilters(doSearch, doClear){

		var url = window.location.origin + window.location.pathname,
		    filters = [],
		    options = {},
		    seenFields = {},
		    cookie;

		if (doSearch == null) {
			doSearch = true;
		}

		if (doClear == null) {
			doClear = false;
		}

		if (!doClear) {
			$('.filters tr').each(function(){

				var filter = {},
				    $this  = $(this),
				    fieldPath;

				// Get the fieldPath
				fieldPath = $this.find('.filter[data-filter-field]').data('filter-field');

				// Add it to the seenFields, where we keep track of what fields have been shown in the modal dialog
				seenFields[fieldPath] = true;

				// And now add it to the filter object
				filter.fieldPath = fieldPath;
				filter.condition = $this.find('select').val();
				filter.value = $this.find('.filter[data-filter-field]').val();

				if (filter.fieldPath && filter.value!== '') {
					filters.push(filter);
				}
			});

			// Get the cookie data
			cookie = document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(modelName + '_cfilters').replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1");

			// If the cookie is found, see if we need to apply any previous settings not shown in the modal dialog
			if (cookie) {
				cookie = decodeURIComponent(cookie);
				cookie = '{' + cookie.after('{');

				try {
					cookie = JSON.parse(cookie);

					cookie.filters.forEach(function(cfilter) {

						// If the fieldpath in the condition was not seen when traversing
						// over the tr's, this means the user did not open that tab and so
						// the settings should be re-applied
						if (!seenFields[cfilter.fieldPath]) {
							filters.push(cfilter);
						}
					});
				} catch(err) {
					console.error(err);
				}
			}
		}

		// Get the amount of items to show, default to 20
		options.show = $('select[name="data[' + modelName + '][show]"]').val() || 20;

		// Get the search query
		if (doSearch) {
			options.search = $('input[name="data[' + modelName + '][search]"]').val() || false;
		} else {
			options.search = false;
		}

		// Do an AND or an OR search?
		options.andor = $('#andor input:checked').val() || 'and';

		// Add the actual filters
		options.filters = filters;

		// Load the page over ajax
		hawkejs.goToAjaxViewWithHistory(url, false, {data: options});
		
		//for export
		var substr = window.location.pathname.split('/');
		if(substr[substr.length-1] === 'export'){
			$('#export-filters').val(JSON.stringify(filters));
			$('.export-submit-btn').click();
		}
	}

	/**
	 * Create filter conditions
	 */
	function createConditions(filter, table){

		var filtercount      = 0,
		    $andor           = $('#andor'),
		    cleanFilterName,
		    cleanTitle,
		    html;

		cleanFilterName = filter.fieldPath.replace('.', '_').toLowerCase()+filtercount;
		cleanTitle = filter.title.replace(/\&nbsp;/g, '');

		filtercount++;

		html = '<tr class="tr-'+ cleanFilterName +'" >';
		html += '<td style="width:35%">' + cleanTitle + '</td>';
		html += '<td style="width:30%">';

		if(!filter.value){
			filter.value = '';
		}

		html += '<select name="" id="select-'+ cleanFilterName +'" class="selectpicker" data-width="100%">';
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

			template = hawkejs.getTemplate('chimera_filter_input/' + (result.filterFieldName||'default') + '_filter_input');

			// Remove hawkejs specific code
			template = template.slice(32);
			template = template.slice(0, template.length-21);

			fieldHtml = hawkejs.ejs.render(template, payload);

			html += '<td style="width:35%">' + fieldHtml + '</td></tr>';
			table.append(html);
			
			$('#filters-group').hide();

			if(filter.condition){
				$('#select-'+ cleanFilterName).val(filter.condition);
			}

			if(filter.value && filter.condition){
				$('#input-'+ cleanFilterName).show();
				$('#filterbtn, #applybtn, #clearbtn').show();
				$andor.show();
			}
			
			// Apply the previously set filters
			if (Array.isArray(filters)) {
				filters.forEach(function(filter) {
					if(filter.fieldPath === payload.fieldPath){
						$('#'+payload.id).val(filter.value);
						var selectid = payload.id.replace("input", "select");
						$('#'+selectid).val(filter.condition);
					}
				});
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

				if (!disable){
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

	// Create the filter fields for select2
	Object.each(fields, function(group, alias) {
		fieldMap[alias+'.__all'] = alias;

		filterFields.push({id: alias + '.__all', text: '<b>' + alias + '</b>', modelGroup: true, modelName: group.modelName});

		Object.each(group.fields, function(field, name) {

			var title;

			if (typeof field === 'object') {
				title = hawkejs.helpers.__(field.domain, field.key);
			} else {
				title = field;
			}

			if(field.alias){
				fieldMap[field.alias+'.'+name] = field.key;

				filterFields.push({id: field.alias + '.' + name, text: '&nbsp;&nbsp;&nbsp;' + title});
			} else {

				fieldMap[alias+'.'+name] = field;

				filterFields.push({id: alias + '.' + name, text: '&nbsp;&nbsp;&nbsp;' + title});
			}
		});
	});
	
	var newPanelGroup = false,
	    $filterModalBody = $('#filter-modal-body'),
	    currentParentI = 0;

	filterFields.forEach(function(filterField, i) {

		var filter,
		    created,
		    parent,
		    html;
		
		if(filterField.modelGroup){

			if(i !== 0){
				newPanelGroup = true;
				currentParentI = i;
				html = '</table></div></div></div>';
			} else {
				html = '';
			}

			html+= '<div class="panel panel-default">';
			html+= '<a data-toggle="collapse" data-parent="#accordion" href="#collapse'+i+'"><div class="panel-heading" ><h4 class="panel-title">'+filterField.text+'</h4></div></a>';
			html+= '<div id="collapse'+i+'" class="panel-collapse collapse"><div class="panel-body"><table id="table-collapse'+i+'" class="filters">';

			$filterModalBody.append(html);

		} else {

			parent = currentParentI;
			newPanelGroup = false;
			filter = {title: filterField.text, fieldPath: filterField.id, type: 'test'};
			
			$('[href="#collapse'+parent+'"]').click(function(e) {

				if (created) {
					return;
				}

				created = true;
				createConditions(filter, $('#table-collapse'+parent));
			});
		}

		if(i === filterFields.length-1 ){
			html = '</table></div></div></div>';
			$filterModalBody.append(html);
		}
	});

	$modal.on('click', '#applybtn', function(e){
		e.preventDefault();
		applyFormFilters();
	});

	$('.search-btn').on('click', function(e){
		e.preventDefault();
		applyFormFilters();
	});

	//WHEN CLICKING CLEAR: REMOVE ALL FILTERS
	$('#clearbtn').on('click', function(e){
		e.preventDefault();
		applyFormFilters(false, true);
	});

	$('.search-input').on('keydown', function(e){
		if(e.keyCode === 13){
			e.preventDefault();
			e.stopPropagation();
			applyFormFilters(true, true);
		}
	});

});


function applyChimeraFields(query, payload) {

	var $target;

	if (payload.origin) {
		$target = $("[data-hawkejs-from-template='" + payload.origin.replace('/','__') + "']");
	} else {
		$target = $(window.document);
	}

	var dataDo = function dataDo($element) {
		hawkejs.event.emit($element.attr('data-emit'), $element);
	};

	// Disable enter on the entire form
	$target.find('form').keydown(function(e) {
		var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

		if (key == 13) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	});

	// Make the enter button apply the inline pagination
	$target.find('input[data-pagination-filter]').keyup(function(e) {

		var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

		if(key == 13) {
			e.preventDefault();
			$('[data-apply-pagination]').click();
		}
	});

	// Apply ckeditor to textarea's
	try {
		$('#hawkejs-insert-block-admin-content .textfield').ckeditor();
	} catch(err) {
		console.log('Error applying ckeditor:');
		console.log(err);
	}

	// Add an "Add entry" button to arrayable fields
	$target.find('hawkejs[data-chimera-field][data-array]').each(function() {

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
	$target.find('[data-emit]').each(function() {
		dataDo($(this));
	});

	// Apply pagination
	$target.find('[data-apply-pagination]').click(function(e) {

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
	$target.find('select.form-control').select2();

	// Apply the mentions field (wip)
	$target.find('textarea.mention').each(function() {

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
	var $title = $target.find('#mainTitle');

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