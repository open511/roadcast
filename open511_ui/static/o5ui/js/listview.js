(function() {
	var ListView = O5.views.BaseView.extend({

		className: "roadevent-list",
		name: "list",
		visibility: false,

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
				this.app.events.on('add remove change:visible change:headline', function(rdev) {
					self.renderSoon();
				});
				this.eventsInitialized = true;
			}
			this.$el.html(
				JST.event_list({events: this.app.events.where({visible: true})})
			);
		},

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
			this.visibility = visible;
			if (visible) {
				this.render();
			}
		}
	});

	O5.views.ListView = ListView;
})();