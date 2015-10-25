/**
 * The Text ChimeraField class
 *
 * @constructor
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
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
 * Create the edit input element
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 */
TextChimeraField.setMethod(function renderEdit() {
	var html = '<div class="chimeraField-prime chimeraField-wysiwyg" contenteditable="true">' + (this.value || '') + '</div>';
	this.setMainElement(html);
});

/**
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TextChimeraField.setMethod(function initEdit() {
	
	var that = this,
	    name,
	    editor, id;


	var editor = CKEDITOR.inline(that.input, {
		extraPlugins: 'sourcedialog',
		filebrowserBrowseUrl: '/boeckeditor',
		allowedContent: true
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