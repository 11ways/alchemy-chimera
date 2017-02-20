hawkejs.scene.on({type: 'set', template: 'chimera/field_wrappers/_wrapper'}, function applyField(element, variables) {

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
	    $save;

	isDraft = this.filter.template === 'chimera/editor/add';

	$editor = $('.chimera-editor', el).first();
	$save = $('.action-save', $editor);

	if (variables.__chimeraReadOnly) {
		$save.remove();
		return;
	}

	$save.click(function onClick(e) {

		var $fieldwrappers,
		    containers,
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

				if (entry.field.fieldType.typename == 'Schema' && entry.field.fieldType.isArray) {
					for (i = 0; i < entry.value.length; i++) {
						subgroup = entry.value[i];
						subpath = base_path += '.' + i;

						subgroup.fields.forEach(function eachSubField(entry) {
							return doFieldEntry(entry, subpath);
						});
					}
				} else if (entry.value != null) {
					Object.setPath(data, path, entry.value);
				}
			}
		}

		containers.forEach(function eachFieldContainer(container) {

			var instance = container.CFWrapper;

			if (!instance) {
				console.log('Found no instance on', container);
				return;
			}

			// Skip nested wrappers,
			// this could mess up the data
			if (instance.nested_in) {
				return;
			}

			Object.merge(data, instance.getData(true));
		});

		if (Object.isEmpty(obj.data)) {
			return chimeraFlash('Save ignored:<br>No modifications were made');
		}

		var editurl = document.location.href;

		hawkejs.scene.openUrl($save.attr('href'), {post: obj, history: false}, function(err, result) {

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

	var className,
	    element,
	    obj;

	if (typeof vex == 'undefined') {
		console.log('"vex" not found, flash:', flash);
		return;
	}

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
	}, flash.timeout || 2000);
}

// $(document).ready(function() {
// 	vex.defaultOptions.className = 'vex-theme-flat-attack';
// });