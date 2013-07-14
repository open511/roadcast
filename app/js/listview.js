(function() {
	var ListView = O5.views.BaseView.extend({

		className: "roadevent-list-container",
		name: "list",
		visible: false,

		minHeight: 100,
		minMapHeight: 100,

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);

			var self = this;

			this.$el.html('<div class="roadevent-list-toggle"><span class="glyph"></span></div>' +
				'<div class="roadevent-list" style="height: 0"><div class="resize-handle"></div><table></table></div>');
			this.$list = this.$el.find('.roadevent-list');

			// Initial list height: half of pane
			this.height = Math.max(this.app.layout.$main.height() / 2, this.minHeight);

			_.bindAll(this, 'startResize', 'continueResize', 'stopResize', 'renderSoon');

			this.$list.find('.resize-handle').on('mousedown', this.startResize);

			this.$el.find('.roadevent-list-toggle').on('click', function(e) {
				self.setViewVisibility(!self.visible);
			});

		},

		render: function() {
			if (!this.visible) return;
			if (!this.eventsInitialized) this.initializeEvents();			

			this.$list.find('table').html(
				JST.event_list({events: this.app.events.where({'_visible': true})})
			);
		},

		initializeEvents: function() {
			if (this.eventsInitialized) return;
			var app = this.app, self = this;

			this.$el.on('click', 'tr[data-roadevent]', function(e) {
				e.preventDefault();
				var event = app.events.get($(this).attr('data-roadevent'));
				if (event) {
					event.select({
						panTo: true
					});
				}
			})
				.on('mouseenter', 'tr[data-roadevent]', function(e) {
					var event = app.events.get($(this).attr('data-roadevent'));
					if (event) event.set('_highlighted', true);
				})
				.on('mouseleave', 'tr[data-roadevent]', function() {
					var event = app.events.get($(this).attr('data-roadevent'));
					if (event) event.set('_highlighted', false);
				});

			this.app.events.on('add remove change:except-internal change:_visible', this.renderSoon);
			this.app.events.on('change:_selected', function(rdev, selected) {
				if (!self.visible) return;
				var $row = self.$el.find('tr[data-roadevent="' + rdev.id + '"]');
				if (selected) {
					$row.addClass('selected');
				}
				else {
					$row.removeClass('selected');
				}
			});

			this.eventsInitialized = true;
		},

		/**
		 * Queues a re-render very shortly.
		 * Called on add/change events; because these often occur in bunches, scheduling
		 * the redraw in a few milliseconds means we can avoid doing tons of redraws
		 * in quick succession.
		 */
		renderSoon: function() {
			if (this.renderTimeout || !this.visible) return;
			var self = this;
			this.renderTimeout = setTimeout(function() {
				self.renderTimeout = null;
				self.render();
			}, 5);
		},

		setViewVisibility: function(visible) {
			this.visible = visible;
			var self = this;
			if (visible) {
				this.$el.addClass('visible');
				this.$list.animate(
					{height: this.height},
					150,
					function() { self.app.layout.draw(); }
				);
				this.render();
			}
			else {
				this.$el.removeClass('visible');
				this.$list.animate(
					{height: 0},
					150,
					function() { self.app.layout.draw(); }
				);
			}
		},

		startResize: function(e) {
			e.preventDefault();
			$(document).on('mousemove', this.continueResize);
			$(document).on('mouseup', this.stopResize);
			this._resize = {
				lastY: e.pageY,
				maxHeight: this.app.layout.$main.height() - this.minMapHeight
			};
		},

		continueResize: function(e) {
			e.preventDefault();
			var diff = this._resize.lastY - e.pageY;
			var newHeight = this.$list.height() + diff;
			newHeight = Math.max(newHeight, this.minHeight); // don't get too small
			newHeight = Math.min(newHeight, this._resize.maxHeight); // don't get too big
			this.$list.height(newHeight);
			this._resize.lastY = e.pageY;
		},

		stopResize: function(e) {
			e.preventDefault();
			$(document).off('mousemove', this.continueResize);
			$(document).off('mouseup', this.stopResize);
			this.height = this.$list.height();
			this.app.layout.draw();
		}
	});

	O5.views.ListView = ListView;
})();