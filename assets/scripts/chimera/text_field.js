/**
 * The Text ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {ChimeraFieldWrapper}   parent
 * @param    {Mixed}                 value
 * @param    {DOMElement}            container
 * @param    {Object}                variables
 * @param    {String}                prefix
 */
var TextChimeraField = ChimeraField.extend(function TextChimeraField(parent, value, container, variables, prefix) {
	TextChimeraField.super.call(this, parent, value, container, variables, prefix);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TextChimeraField.setMethod(function initEdit() {

	var that = this,
	    field_options = this.parent.field && this.parent.field.options,
	    ck_options,
	    editor,
	    name,
	    id,
	    i;

	if (!field_options) {
		field_options = {};
	}

	if (field_options.inline == null) {
		field_options.inline = false;
	}

	ck_options = {};

	ck_options = {
		filebrowserBrowseUrl  : '/boeckeditor',
		allowedContent        : true,
		toolbarGroups         : [
			{"name":"styles",      "groups":["styles"]},
			{"name":"basicstyles", "groups":["basicstyles"]},
			{"name":"links",       "groups":["links"]},
			{"name":"paragraph",   "groups":["list","blocks"]},
			{"name":"document",    "groups":["mode"]},
			{"name":"insert",      "groups":["insert"]},
		],
		removeButtons: 'Underline,Strike,Subscript,Superscript,Anchor,Styles,Specialchar,NewPage,Flash,HorizontalRule,CreateDiv,Smiley,SpecialChar,PageBreak,Iframe,Sourcedialog'
	};

	ck_options.extraAllowedContent = 'p(*)[*]{*};div(*)[*]{*};li(*)[*]{*};ul(*)[*]{*}';
	ck_options.pasteFilter = 'h1 h2 p ul ol li; img[!src, alt]; a[!href]';
	CKEDITOR.dtd.$removeEmpty.i = 0;

	if (field_options.use_br) {
		ck_options.enterMode = CKEDITOR.ENTER_BR;
	}

	if (field_options.contents_css) {
		ck_options.contentsCss = Array.cast(field_options.contents_css);
	}

	if (field_options.height) {
		ck_options.height = field_options.height;
	}

	if (field_options.inline === false) {

		if (!field_options.contents_css) {
			ck_options.contentsCss = ['/stylesheets/website.css'];
		}

		for (i = 0; i < ck_options.contentsCss.length; i++) {
			ck_options.contentsCss[i] = String(new Blast.Classes.RURL(ck_options.contentsCss[i], window.location));
		}

		if (!that.input) {
			throw new Error('Unable to find input element, can not create ckeditor instance');
		}

		if (!ck_options.height) {
			if (that.input.clientHeight > 100) {
				if (that.input.clientHeight > 450) {
					ck_options.height = 450;
				} else {
					ck_options.height = that.input.clientHeight;
				}
			} else {
				ck_options.height = 200;
			}

			if (ck_options.height < 200) {
				ck_options.height = 200;
			}
		}

		editor = CKEDITOR.replace(that.input, ck_options);
	} else {
		ck_options = {};
		editor = CKEDITOR.inline(that.input, ck_options);
	}

	editor.on('paste', function(evt) {
		evt.data.dataValue = evt.data.dataValue
			.replace(/\&nbsp;/gi, ' ');
	});

	editor.on('focus', function () {
		editor.setReadOnly(!!that.readOnly);
	});

	this.ckeditor = editor;

	editor.on('change', function onCkChange() {
		that.setValue(editor.getData());
	});
});

/**
 * Make the CKEditor instance read-only
 *
 * @param    {Boolean}   value
 */
TextChimeraField.setMethod(function setReadOnly(value) {
	var that = this;
	this.readOnly = value;
});