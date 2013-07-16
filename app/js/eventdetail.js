(function() {
	O5.views.EventDetailView = O5.views.BaseView.extend({

		roadEvent: null,

		className: 'event-detail',

		displayEvent: function(event) {
			if (this.roadEvent) {
				this.roadEvent.off('change', this.render, this);
			}
			this.roadEvent = event;
			event.on('change:except-internal', this.render, this);
			this.$el.attr('data-roadevent', event.id);
			this.render();
		},

		render: function() {
			if (this.roadEvent === null) return;
			this.$el.html(
				JST.event_info({
					r: this.roadEvent.attributes
				})
			);
			this.app.trigger('event-detail-render', {
				roadEvent: this.roadEvent,
				$el: this.$el
			});
			this.app.layout.draw();
		}
	});
})();