O5.plugins.register(function(app) {
	if (app.settings.externalAuth) {
		var html;
		if (app.settings.externalAuth.currentUser && app.settings.externalAuth.logoutURL) {
			html = _.escape(app.settings.externalAuth.currentUser) +
				' <a href="' + app.settings.externalAuth.logoutURL + '" class="log-out">' +
				O5._t('Sign out') + '</a>';
		}
		else if (app.settings.externalAuth.loginURL) {
			html = '<a href="' + app.settings.externalAuth.loginURL + '" class="log-in">' +
				O5._t('Sign in') + '</a>';
		}
		if (html) app.layout.$el.find('.navbar .auth').html(html);
	}
});