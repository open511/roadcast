(function() {
	var ListView = O5.views.BaseView.extend({

		className: "roadevent-list",
		name: "list",
		visible: false,

		render: function() {
			var app = this.app, self = this;
			if (!this.eventsInitialized) {
				this.$el.on('click', 'a.select-event', function(e) {
					e.preventDefault();
					var event = app.events.get($(e.target).attr('data-roadevent'));
					if (event) {
						event.select();
					}
				});
				this.app.events.on('add remove change', function(rdev) {
					if (self.visible) {
						self.renderSoon();
					}
				});
				this.eventsInitialized = true;
			}
			this.$el.html(
				JST.event_list({events: this.app.events.where({'_visible': true})})
			);
		},

		/**
		 * Queues a re-render very shortly.
		 * Called on add/change events; because these often occur in bunches, scheduling
		 * the redraw in a few milliseconds means we can avoid doing tons of redraws
		 * in quick succession.
		 */
		renderSoon: function() {
			if (this.renderTimeout) {
				return;
			}
			var self = this;
			this.renderTimeout = setTimeout(function() {
				self.render();
				self.renderTimeout = null;
			}, 10);
		},

		setViewVisibility: function(visible) {
			this.visible = visible;
			if (visible) {
				this.render();
			}
		}
	});

	O5.views.ListView = ListView;
})();