/* 
	Depends on Twitter's Typeahead.js and Bloodhound

	Currently supports only the "prefetch" mode: supply the URL to a JSON array of strings
	containing the autocomplete values.

	You can:

	(1) Use O5.widgets.text_autocomplete as a widget type, and set autocomplete_url in the field
	settings.

	(2) Add an "autocomplete" object to the app settings, of the format { field_name: autocomplete_url }
*/

O5.plugins.register(function(app) {

	var bloodhound_engines = {};

	var AutocompleteTextWidget = O5.widgets.text.extend({
		initialize: function() {
			O5.widgets.text.prototype.initialize.call(this);

			if (this.options.autocomplete_url) {
				var bloodhound = bloodhound_engines[this.options.autocomplete_url];
				if (!bloodhound) {
					bloodhound_engines[this.options.autocomplete_url] = bloodhound = new Bloodhound({
						prefetch: this.options.autocomplete_url,
						datumTokenizer: Bloodhound.tokenizers.whitespace,
						queryTokenizer: Bloodhound.tokenizers.whitespace
					});
				}
				var self = this;
				this.$el.one('focus', function() {
					bloodhound.initialize();
					self.$el.typeahead({highlight: true}, {
						source: bloodhound.ttAdapter(),
						displayKey: function(x) { return x; }
					});
					self.$el.focus();
				});
			}
		}
	});

	if (app.settings.autocomplete) {
		app.on('editor-field-definitions', function(opts) {
			_.each(app.settings.autocomplete, function(url, key) {
				var field = O5.utils.getFieldDef(key, opts.fields);
				field.widget = AutocompleteTextWidget;
				field.autocomplete_url = url;
			});
		});
	}

	O5.widgets.text_autocomplete = AutocompleteTextWidget;

});