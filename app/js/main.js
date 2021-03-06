(function() {

O5 = window.O5 || {};
O5.utils = {};
O5.prototypes = {};
if (!window.console) {
	window.console = {
		log: function() {}
	};
}

O5.init = function(opts) {

		var app = _.extend({
			settings: {
				inside: 'body',
				pushState: false
			}
		}, Backbone.Events);

		_.extend(app.settings, opts);

		O5.app = app;

		$(document).ajaxError(function(e, xhr, settings, exception) {
			if (xhr.readyState !== 4) return; // For now, don't handle requests that were
											  // aborted before completing
			errorText = xhr.responseText;
			if (xhr.status === 404)
				errorText = O5._t("That event couldn't be found.");
			O5.utils.notify(errorText, 'error');
			if (window.jsErrors) window.jsErrors.push(xhr.responseText);
		});

		if (app.settings.sentryDSN && window.Raven) {
			Raven.config(app.settings.sentryDSN).install();
			if (app.settings.auth && app.settings.auth.displayName)
				Raven.setUserContext({name: app.settings.auth.displayName});
		}

		app.layout = new O5.prototypes.Layout(app.settings.inside, app);
		var $el = app.layout.$el;

		app.events = new O5.RoadEvents([], {
			url: app.settings.eventsURL
		});

		app.detailViewer = new O5.views.EventDetailView({app: app});
		app.map = new O5.views.MapView({
			app: app,
			el: app.layout.$map[0]
		});
		app.listview = new O5.views.ListView({
			app: app,
			el: app.layout.$listContainer[0]
		});

		O5.plugins.init(app, {
			screenSize: app.layout.screenSize
		});

		app.map.render();
		app.listview.render();

		var filterWidget = new O5.views.FilterView({app:app});
		$el.find('.navbar .buttons').append(filterWidget.el);
		filterWidget.render();

		app.on('display', function(event) {
			app.detailViewer.displayEvent(event);
			app.layout.setLeftPane(app.detailViewer);
			event.navigateTo();
		});

		// Creating filterManager also fetches all events
		app.filterManager = new O5.prototypes.FilterManager({
			app: app
		});

		app.router = new O5.prototypes.Router();

		Backbone.history.start({
			pushState: app.settings.pushState,
			root: app.settings.rootURL
		});

		return app;

};

var registered_plugins = [];
O5.plugins = {

	register: function(plugin) {
		registered_plugins.push(plugin);
	},

	init: function(app, opts) {
		var plugins = registered_plugins;
		if (opts.screenSize === 'small') {
			plugins = _.where(plugins, { supportsSmallScreens: true });
		}
		for (var i = 0; i < plugins.length; i++) {
			new plugins[i](app);
		}
	}
};
})();
