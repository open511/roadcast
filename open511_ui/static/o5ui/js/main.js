(function() {
window.O5 = window.O5 || {};
window.O5.utils = {};
window.O5.prototypes = {};
window.O5.init = function(opts) {

		_.defaults(opts, {
			enableEditing: false,
			elementSelector: '#main',
			pushState: true,
			timezone: '-05:00'
		});
		_.extend(O5, opts);

		var app = {
			settings: {}
		};

		_.extend(app.settings, opts);

		$(document).ajaxError(function(e, xhr, settings, exception) {
			O5.utils.notify(xhr.responseText, 'error');
		});

		app.layout = O5.layout = new O5.prototypes.Layout($(app.settings.elementSelector));
		app.layout.draw();

		var $window = $(window);
		$window.resize(function() {
			O5.layout.change({
				height: $window.height(),
				width: $window.width()
			});
		});

		var events = new O5.RoadEvents();
		O5.events = app.events = events;

		O5.detailViewer = new O5.views.EventDetailView();
		app.map = O5.map = new O5.views.MapView({app: app});
		app.listview = new O5.views.ListView({app: app});

		app.layout.addMainView(app.map);
		app.layout.addMainView(app.listview);

		app.layout.setMainView(app.map);

		O5.map.render();
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
			O5.map.addRoadEvent(event);
		});

		events.on('selection', function(event) {
			O5.detailViewer.displayEvent(event);
			O5.layout.setLeftPane(O5.detailViewer);
			event.navigateTo();
		});

		if (app.settings.enableEditing) {
			O5.editor = new O5.views.EventEditorView({app: app});
			events.on('edit', function(event) {
				O5.editor.selectEvent(event);
				O5.layout.setLeftPane(O5.editor);
			});
			O5.editableJurisdictionSlugs = [];
			_.each(O5.jurisdictions, function(jur) {
				if (jur.editable) {
					O5.editableJurisdictionSlugs.push(jur.slug);
				}
			});
			if (O5.editableJurisdictionSlugs.length && $('.mainpane-buttons').length) {
				$('.mainpane-buttons').prepend(
					JST.create_event({ jurisdiction_slugs: O5.editableJurisdictionSlugs })
				);
			}
		}

		// (this line results in fetching all the events)
		app.filterManager.setFilters({});

		O5.router = new O5.prototypes.Router();

		O5.app = app;

		Backbone.history.start({
			pushState: app.settings.pushState,
			root: O5.rootURL
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
