O5.plugins.register(function(app) {
	if (app.settings.externalAuth && app.settings.externalAuth.loginURL && app.settings.externalAuth.logoutURL) {
		app.once('render-layout', function(opts) {
			var html;
			if (app.settings.externalAuth.currentUser) {
				html = _.escape(app.settings.externalAuth.currentUser) +
					' <a href="' + app.settings.externalAuth.logoutURL + '" class="log-out">' +
					O5._t('Sign out') + '</a>';
			}
			else {
				html = '<a href="' + app.settings.externalAuth.loginURL + '" class="log-in">' +
					O5._t('Sign in') + '</a>';
			}
			opts.$el.find('.navbar .auth').html(html);
		});
	}
});