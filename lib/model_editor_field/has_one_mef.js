/**
 * The Has One field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('Select2MEF', function HasOneMEF() {

	this.input = function input(callback) {

		var that       = this,
		    assoc      = this.fieldConfig.assoc,
		    assocModel = this.getModel(this.fieldConfig.assoc.modelName),
		    conditions = {},
		    record     = that.item[that.model.modelName];

		this.fieldView = 'select2';

		that.value = {
			select: 'single',
			value: that.value,
			url: that.module.getActionUrl('assocOptions', {
				model: that.model.modelName.underscore(),
				fieldName: that.fieldName
			})
		};

		callback();
	};

});