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
 * Initialize the field
 *
 * @param    {Mixed}   value
 */
TextChimeraField.setMethod(function initEdit() {
	
	var that = this,
	    name,
	    editor, id;


	var editor = CKEDITOR.inline(that.intake.find('.chimeraField-wysiwyg')[0], {
		extraPlugins: 'sourcedialog',
		filebrowserBrowseUrl: '/boeckeditor',
		allowedContent: 'img form input param pre flash br a td p span font em strong table tr th td style script iframe u s li ul div[*]{*}(*)'
	});

	editor.on('focus', function () {
		editor.setReadOnly(!!that.readOnly);
	});

	this.ckeditor = editor;

	editor.on('change', function onCkChange() {
		that.setValue(editor.getData());
	});

	return;

	name = '.medium-editor';
	id = $(name, this.intake)[0].id;

	editor = new MediumEditor(name, {
		buttons: ['bold', 'italic', 'underline', 'strikethrough', 'anchor', 'media', 'image', 'header1', 'header2', 'quote', 'pre'],
		extensions: {
			'h2k': new MediumButton({label:'h2k', start:'<h2>', end:'</h2>'}),
			'media': new MediumButton({label: 'Media', action: function initPickMedia() {

				var elementId = 'media-' + Date.now();

				pickMediaId(function (err, id) {

					var img = $('#' + elementId);
					img.attr('src', '/media/image/' + id);

				});

				return '<img id="' + elementId + '"></img>';
			}})
		}
	});

	var Router = new hawkejs.constructor.helpers.Router(),
	    uploadUrl = Router.routeUrl('Media::uploadsingle');

	$(name).mediumInsert({
		editor: editor,
		addons: {
			images: {
				imagesUploadScript: uploadUrl
			},
			embeds: {},
			tables: {}
		}
	});

	$(name).on('input', function onTextEdit(){
		if($(this)[0].id === id){
			that.setValue($(this)[0].innerHTML);
		}
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