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
	    ck_options,
	    editor,
	    name,
	    id;

	ck_options = {
		extraPlugins          : 'sourcedialog',
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
		removeButtons: 'Underline,Strike,Subscript,Superscript,Anchor,Styles,Specialchar,NewPage,Flash,HorizontalRule,CreateDiv,Smiley,SpecialChar,PageBreak,Iframe'
	};

	if (this.parent.field && this.parent.field.options && this.parent.field.options.use_br) {
		ck_options.enterMode = CKEDITOR.ENTER_BR;
	}

	editor = CKEDITOR.inline(that.input, ck_options);

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