hawkejs.scene.on({type: 'set', entry: 'chimera/field_wrappers/_wrapper'}, function applyField(element, variables) {

	// Ignore nested wrappers
	if (element.classList.contains('chimeraField-is-nested')) {
		return;
	}

	hawkejs.require(['chimera/chimera_field_wrapper', 'chimera/chimera_field'], function loaded(err) {

		var options;

		if (err) {
			throw err;
		}

		// Create the wrap options
		options = {
			variables: variables,
			container: element,
			viewname: variables.data.field.viewname
		};

		new ChimeraFieldWrapper(options);
	});
});

hawkejs.scene.on({type: 'rendered'}, function rendered(variables, renderData) {

	var key;

	Object.each(variables.__newFlashes, function eachFlash(flash) {
		chimeraFlash(flash);
	});
});

hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/view'}, applySave);
hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/edit'}, applySave);
hawkejs.scene.on({type: 'set', name: 'chimera-cage', template: 'chimera/editor/add'}, applySave);

/**
 * Apply save functionality when clicking on the "save" button
 */
function applySave(el, variables) {

	var preventDuplicate,
	    variables,
	    isDraft,
	    $editor,
	    $save_close,
	    $saves,
	    $save;

	isDraft = this.filter.template === 'chimera/editor/add';

	$editor = $('.chimera-editor', el).first();
	$save = $('.action-save', $editor);
	$save_close = $('.action-saveClose', $editor);
	$saves = $('.action-save, .action-saveClose', $editor);

	if (variables.__chimeraReadOnly) {
		$save.remove();
		$save_close.remove();
		return;
	}

	$saves.click(function onClick(e) {

		var $fieldwrappers,
		    containers,
		    $this = $(this),
		    data,
		    obj;

		e.preventDefault();

		if (preventDuplicate === true) {
			//return chimeraFlash('Save ignored:<br>Save already in progress');
		}

		// Get all the non-nested containers
		containers = $editor[0].querySelectorAll('.chimeraField-container:not(.chimeraField-is-nested)');

		data = {};
		obj = {
			create: isDraft,
			data: data
		};

		if (isDraft) {
			// Set the initial passed-along-by-server values first
			Object.each(variables.groups, function eachGroup(group, name) {
				group[0].fields.forEach(function eachField(entry) {
					return doFieldEntry(entry);
				});
			});

			function doFieldEntry(entry, base_path) {

				var subgroup,
				    subentry,
				    subpath,
				    path,
				    i,
				    j;

				if (base_path) {
					path = base_path;
				}

				if (!path) {
					path = '';
				} else {
					path += '.';
				}

				path += entry.field.path;

				if (entry.field.fieldType.constructor.type_name == 'schema') {

					if (entry.field.fieldType.isArray) {
						if (!entry.value) {
							// Entry is empty (subschema?)
						} else {
							for (i = 0; i < entry.value.length; i++) {
								subgroup = entry.value[i];
								subpath = base_path += '.' + i;

								subgroup.fields.forEach(function eachSubField(entry) {
									return doFieldEntry(entry, subpath);
								});
							}
						}
					} else if (entry.value) {

						subgroup = entry.value[0];

						subgroup.fields.forEach(function eachSubField(entry) {
							return doFieldEntry(entry, base_path);
						});
					}
				} else if (entry.value != null) {
					Object.setPath(data, path, entry.value);
				}
			}
		}

		containers.forEach(function eachFieldContainer(container) {

			var instance = container.CFWrapper,
			    sub_data;

			if (!instance) {
				console.log('Found no instance on', container);
				return;
			}

			// Skip nested wrappers,
			// this could mess up the data
			if (instance.nested_in) {
				return;
			}

			sub_data = instance.getData(true);

			Object.merge(data, sub_data);
		});

		if (Object.isEmpty(obj.data)) {
			chimeraFlash('Save ignored:<br>No modifications were made');

			// Go back to the index page
			// (unfortunately back to page 1)
			alchemy.openUrl('chimera@ModelAction', {
				parameters: {
					controller : 'editor',
					subject    : variables.modelName,
					action     : 'index'
				}
			});

			return;
		}

		var editurl = document.location.href;

		var save_options = {
			post    : obj,
			history : false
		};

		if (isDraft) {
			save_options.history = true;
		}

		hawkejs.scene.openUrl($this.attr('href'), save_options, function saved(err, result) {

			if (err != null && result != null) {
				preventDuplicate = false;
				chimeraFlash('Something went wrong: ' + result);
			}

			// @todo: go to the correct url
			//hawkejs.scene.reload(editurl);
		});

		preventDuplicate = true;
	});
}

hawkejs.scene.on({type: 'set', template: 'chimera/sidebar'}, sidebarCollapse);

function sidebarCollapse(el) {

	var childclass = '',
	    $active = $(el.querySelectorAll('.sideNav .active')),
	    $section = $('.section'),
	    $links = $('a', el);

	// Open active section
	toggleMenu($active.parent().parent().prev());

	$links.click(function(e) {
		var $this = $(this);

		if ($this.hasClass('section')) {
			return;
		}

		$links.removeClass('active');
		$this.addClass('active');
	});
	
	// Open clicked section
	$section.on('click', function onMenuParentClick(e){
		e.preventDefault();
		toggleMenu($(this));
	}); 

	// Handle opening/closing of sections
	function toggleMenu(section){
		childclass = '.'+section.data('childclass');

		if(section.attr('data-after') == '\u25B6'){
			section.attr('data-after', '\u25BC');
		} else {
			section.attr('data-after', '\u25B6');
		}

		$(childclass).toggleClass('hidden');
	}
}

hawkejs.scene.on({type: 'set', template: 'chimera/editor/remove'}, removeRecord);

function removeRecord(el) {

	var url;

	$('.remove-btn').on('click', function(e){
		e.preventDefault();
		url = $(this).attr('href');

		hawkejs.scene.openUrl(url, {post: {sure: 'yes'}}, function(result) {
			
		});
	});

}

function chimeraFlash(flash) {

	var chimera_options,
	    className,
	    element,
	    obj;

	if (typeof vex == 'undefined') {
		console.log('"vex" not found, flash:', flash);
		return;
	}

	chimera_options = hawkejs.scene.exposed.chimera_options || {};

	if (typeof flash == 'string') {
		flash = {
			message: flash
		}
	}

	if (flash.className) {
		className = ' ' + flash.className;
	} else {
		className = '';
	}

	obj = {
		className: 'vex-theme-bottom-right-corner vex-chimera-flash' + className,
		message: flash.message
	};

	element = vex.dialog.alert(obj);

	setTimeout(function closeVexFlash() {
		vex.close(element.data('id'))
	}, flash.timeout || chimera_options.notification_timeout || 2500);
}

// $(document).ready(function() {
// 	vex.defaultOptions.className = 'vex-theme-flat-attack';
// });