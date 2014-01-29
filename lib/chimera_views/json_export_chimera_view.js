/**
 * The export page
 *
 * @author   Kjell Keisse   <kjell@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ChimeraView', function JsonExportChimeraView() {

    /**
     * Build the view
     *
     * @author   Kjell Keisse   <kjell@codedor.be>
     * @since    0.0.1
     * @version  0.0.1
     */
    this.build = function build(render, options) {

        var that = this,
                paginate = Component.get('Paginate'),
                fields = [],
                excludeFields,
                fieldName,
                model,
                i;

        if (typeof options !== 'object') {
            options = {};
        }

        excludeFields = options.excludeFields;

        if (!Array.isArray(excludeFields)) {
            excludeFields = [];
        }

        // Get the model instance
        if (typeof options.model === 'object') {
            model = options.model;
        } else if (typeof options.model === 'string') {
            model = this.getModel(options.model);
        } else {
            model = this.getModel(render.req.params.model);
        }

        // Add the model name to the routeVars
        render.viewVars.routeVars.model = model.modelName.underscore();
        render.viewVars.modelName = model.modelName;

        // Field information
        render.viewVars.fieldInfo = options.fieldInfo || {};

        // Default field type
        render.viewVars.defaultFieldType = options.defaultFieldType || 'default';

        // If default fields have been given, clone that array
        if (Array.isArray(options.defaultFields)) {
            fields = options.defaultFields.slice(0);
        }

        // Use only the fields given in the options
        if (Array.isArray(options.fields)) {
            for (i = 0; i < options.fields.length; i++) {
                // Only add this field if it doesn't exist yet
                if (fields.indexOf(options.fields[i]) == -1 && excludeFields.indexOf(options.fields[i]) == -1) {
                    fields.push(options.fields[i]);
                }
            }
        } else {
            // Add every field in the blueprint to the fields array
            for (fieldName in model.blueprint) {

                // Only add this field if it doesn't exist yet
                if (fields.indexOf(fieldName) == -1 && excludeFields.indexOf(fieldName) == -1) {
                    fields.push(fieldName);
                }
            }
        }

        // Make sure the translation behaviour gets disabled
        model.disableTranslations = true

            // Expose the (non-sensitive) fields object to the view
            render.viewVars.fields = fields;

            // Render the default view
            render('chimera/json_export');


    };
});