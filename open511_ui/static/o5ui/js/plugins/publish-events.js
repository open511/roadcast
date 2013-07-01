(function() {

	O5.plugins = O5.plugins || {};
	O5.plugins.publishEvents = {

		changeEditorFieldDefinitions: function(fields, roadEvent) {
			fields.unshift({
				name: '!published',
				label: O5._t('Published'),
				type: 'boolean',
				widget: 'checkbox',
				tab: 'basics'
			});
		}
	};

})();