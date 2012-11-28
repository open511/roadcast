(function() {
	O5.views = O5.views || {};
	O5.views.EventDetailView = Backbone.View.extend({

		roadEvent: null,

		displayEvent: function(event) {
			this.roadEvent = event;
			this.render();
		},

		initialize: function() {
			var self = this;
			this.$el.on('click', 'a.edit-roadevent', function(e) {
				e.preventDefault();
				self.roadEvent.edit();
			});
		},

		render: function() {
			var self = this;
			if (self.roadEvent !== null) {
				self.$el.html(
					JST.event_info({r: self.roadEvent.attributes})
				);
			}
		}
	});
})();