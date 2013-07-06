(function() {
window.O5 = window.O5 || {};
window.O5.utils = {};
window.O5.prototypes = {};
window.O5.init = function(opts) {

		_.defaults(opts, {
			enableEditing: false,
			elementSelector: '#main',
			pushState: true,
			timezone: '-05:00',
			plugins: []
		});

		var app = {
			settings: {}
		};

		O5.app = app;

		_.extend(app.settings, opts);

		$(document).ajaxError(function(e, xhr, settings, exception) {
			O5.utils.notify(xhr.responseText, 'error');
		});

		app.layout = new O5.prototypes.Layout($(app.settings.elementSelector));
		app.layout.draw();

		var $window = $(window);
		$window.resize(function() {
			app.layout.change({
				height: $window.height(),
				width: $window.width()
			});
		});

		var events = new O5.RoadEvents();
		app.events = events;

		app.detailViewer = new O5.views.EventDetailView();
		app.map = new O5.views.MapView({app: app});
		app.listview = new O5.views.ListView({app: app});

		app.layout.addMainView(app.map);
		app.layout.addMainView(app.listview);

		app.layout.setMainView(app.map);

		app.map.render();
		app.listview.render();

		var filterWidget = new O5.views.FilterView({app:app});
		$('.mainpane-buttons').prepend(filterWidget.el);
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

		events.on('selection', function(event) {
			app.detailViewer.displayEvent(event);
			app.layout.setLeftPane(app.detailViewer);
			event.navigateTo();
		});

		if (app.settings.enableEditing) {
			app.editor = new O5.views.EventEditorView({app: app});
			events.on('edit', function(event) {
				app.editor.selectEvent(event);
				app.layout.setLeftPane(app.editor);
			});
			app.editableJurisdictionSlugs = [];
			_.each(app.settings.jurisdictions, function(jur) {
				if (jur.editable) {
					app.editableJurisdictionSlugs.push(jur.slug);
				}
			});
			if (app.editableJurisdictionSlugs.length && $('.mainpane-buttons').length) {
				$('.mainpane-buttons').prepend(
					JST.create_event({ jurisdiction_slugs: app.editableJurisdictionSlugs })
				);
			}
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
window.O5.views = {
	BaseView: Backbone.View.extend({
		initialize: function() {
			this.app = this.options.app;
		}
	})
};
})();
