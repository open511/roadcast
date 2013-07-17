(function() {
O5 = window.O5 || {};
O5.utils = {};
O5.prototypes = {};
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
			O5.utils.notify(xhr.responseText, 'error');
		});

		O5.plugins.init(app);

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

		app.map.render();
		app.listview.render();

		var filterWidget = new O5.views.FilterView({app:app});
		$el.find('.navbar .buttons').append(filterWidget.el);
		filterWidget.render();


		app.filterManager = new O5.prototypes.FilterManager({
			app: app
		});

		app.on('selection', function(event) {
			app.detailViewer.displayEvent(event);
			app.layout.setLeftPane(app.detailViewer);
			event.navigateTo();
		});

		// (this line results in fetching all the events)
		app.filterManager.setFilters({});

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

	init: function(app) {
		for (var i = 0; i < registered_plugins.length; i++) {
			new registered_plugins[i](app);
		}
	}
};
})();
