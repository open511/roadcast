(function() {
O5 = window.O5 || {};
O5.utils = {};
O5.prototypes = {};
O5.init = function(opts) {

		var app = _.extend({
			settings: {
				enableEditing: false,
				elementSelector: '#main',
				pushState: false,
				timezone: '-05:00'
			}
		}, Backbone.Events);

		_.extend(app.settings, opts);

		O5.app = app;

		$(document).ajaxError(function(e, xhr, settings, exception) {
			O5.utils.notify(xhr.responseText, 'error');
		});

		O5.plugins.init(app);

		app.layout = new O5.prototypes.Layout($(app.settings.elementSelector), app);
		app.layout.draw();
		var $el = app.layout.$el;

		var $window = $(window);
		$window.resize(function() {
			app.layout.change({
				height: $window.height(),
				width: $window.width()
			});
		});

		var events = new O5.RoadEvents();
		app.events = events;

		app.detailViewer = new O5.views.EventDetailView({app: app});
		app.map = new O5.views.MapView({app: app});
		app.listview = new O5.views.ListView({app: app});

		app.layout.addMainView(app.map);
		app.layout.addMainView(app.listview);

		app.layout.setMainView(app.map);

		app.map.render();
		app.listview.render();

		var filterWidget = new O5.views.FilterView({app:app});
		$el.find('.navbar .buttons').append(filterWidget.el);
		filterWidget.render();

		$('.mainpane-selector').on('click', 'button', function(e) {
			e.preventDefault();
			var view, $this = $(e.target);
			if ($this.hasClass('map-selector')) {
				view = app.map;
			}
			else if ($this.hasClass('list-selector')) {
				view = app.listview;
			}
			else { return; }
			app.layout.setMainView(view);
			$('.mainpane-selector button.active').removeClass('active');
			$this.addClass('active');
		});

		app.filterManager = new O5.prototypes.FilterManager({
			app: app
		});

		events.on('add', function(event, collection, options) {
			app.map.addRoadEvent(event);
		});

		app.on('selection', function(event) {
			app.detailViewer.displayEvent(event);
			app.layout.setLeftPane(app.detailViewer);
			event.navigateTo();
		});

		if (app.settings.enableEditing) {
			app.editor = new O5.views.EventEditorView({app: app});
			app.on('edit', function(event) {
				app.editor.selectEvent(event);
				app.layout.setLeftPane(app.editor);
			});
			var createButton = app.editor.renderCreateButton();
			if (createButton) $el.find('.navbar .buttons').prepend(createButton);
		}

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
