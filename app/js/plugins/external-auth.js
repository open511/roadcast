O5.plugins.register(function(app) {
	if (app.settings.auth) {
		var html;
		if (app.settings.auth.displayName && app.settings.auth.logoutURL) {
			html = _.escape(app.settings.auth.displayName) +
				'<span><a href="' + app.settings.auth.logoutURL + '" class="log-out">' +
				O5._t('Sign out') + '</a></span>';
		}
		else if (app.settings.auth.loginURL) {
			html = '<span><a href="' + app.settings.auth.loginURL + '" class="log-in">' +
				O5._t('Sign in') + '</a></span>';
		}
		if (html) app.layout.$el.find('.navbar .auth').append($(html));
	}
});