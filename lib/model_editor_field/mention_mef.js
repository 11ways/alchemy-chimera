/**
 * The Has One field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function MentionMEF() {

	this.input = function input(callback) {

		var that = this,
		    mentions,
		    mentionSource,
		    entry,
		    key;
pr('Getting: ' + this.fieldName + 'Mentions')

		mentionSource = that.context[this.fieldName + 'Mentions'];
		this.fieldView = 'mention';

		mentions = [];

		if (mentionSource) {
			for (key in mentionSource) {
				entry = {};
				entry.id = key;
				entry.name = mentionSource[key];
				entry.type = 'entry';

				mentions.push(entry);
			}
		}

		that.value = {
			mentions: mentions,
			value: that.value
		};

		callback();
	};

});