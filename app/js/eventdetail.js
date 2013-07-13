(function() {
	O5.views.EventDetailView = O5.views.BaseView.extend({

		roadEvent: null,

		className: 'event-detail',

		displayEvent: function(event) {
			if (this.roadEvent) {
				this.roadEvent.off('change', this.render, this);
			}
			this.roadEvent = event;
			this.roadEvent.on('change', this.render, this);
			this.render();
		},

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);
			var self = this;
			this.$el.on('click', '.edit-event', function(e) {
				e.preventDefault();
				self.roadEvent.edit();
			});
		},

		render: function() {
			if (this.roadEvent === null) return;
			this.$el.html(
				JST.event_info({
					r: this.roadEvent.attributes,
					editable: this.roadEvent.canEdit()
				})
			);
			this.app.layout.drawLeftPane();
		}
	});
})();