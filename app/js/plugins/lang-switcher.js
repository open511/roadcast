O5.plugins.register(function(app) {

	var change_language = function(lang_code) {
		var endpoint = app.settings.rootURL + 'helpers/i18n/setlang/';
		$.post(endpoint, {language: lang_code}, function() { window.location.reload(true); });
	};

	if (app.settings.languagesAvailable && app.settings.languagesAvailable.length > 1) {
		var choices = _.filter(app.settings.languagesAvailable, function(lang) { return lang[0] !== O5.language; });
		var $links = $(document.createElement('span'));
		_.each(choices, function(choice) {
			var $link = $(document.createElement('a'));
			$link.text(choice[1])
			$link.attr('data-lang', choice[0])
			$link.on('click', function (e) {
				e.preventDefault();
				change_language(choice[0]);
			});
			$links.append($link)
		});
		if (choices) {
			app.layout.$el.find('.navbar .auth').prepend($links);	
		}
	}
});