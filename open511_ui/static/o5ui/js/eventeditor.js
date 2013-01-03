(function() {
	O5.views = O5.views || {};

	var BaseWidget = Backbone.View.extend({
		addLabel: true,
		setVal: function(val) {
			this.$el.val(val);
		},
		getVal: function() {
			return this.$el.val();
		}
	});

	var widgets = {
		textarea: BaseWidget.extend({
			tagName: 'textarea'
		}),

		text: BaseWidget.extend({
			tagName: 'input',
			initialize: function() {
				this.$el.attr('type', 'text');
			}
		}),

		select: BaseWidget.extend({
			tagName: 'select',
			initialize: function() {
				var $el = this.$el;
				_.each(this.options.field.choices, function(choice) {
					$el.append($('<option />').val(choice[0]).text(choice[1]));
				});
			}
		}),

		map: BaseWidget.extend({
			tagName: 'div',
			geom: null,
			geomType: function() {
				if (!this.geom) {
					return null;
				}
				return this.geom.type;
			},
			initialize: function() {
				// Event handlers
				var self = this;
				this.$el.on('click', '.draw-clear', function(e) {
					e.preventDefault();
					self.geom = null;
					self.render();
				}).on('click', '.draw-point', function(e) {
					e.preventDefault();
					self.startDrawing('point');
				}).on('click', '.draw-line', function(e) {
					e.preventDefault();
					self.startDrawing('line');
				});
				this.render();
			},
			startDrawing: function(type) {
				O5.map.startDrawing(type);
				O5.map.off('draw', this.saveDrawing);
				O5.map.on('draw', this.saveDrawing, this);
			},
			saveDrawing: function(gj) {
				this.geom = gj;
				O5.map.stopDrawing();
				this.render();
				this.options.roadEvent.set('geometry', gj);
			},
			render: function() {
				this.$el.html(JST.map_edit_widget(this));
			},
			setVal: function(val) {
				this.geom = val;
				this.render();
			},
			getVal: function() {
				return this.geom;
			}
		})
	};

	var getWidget = function(field, roadEvent) {
		var wc;

		var field_id = 'field_' + field.name + '_' + Math.floor(Math.random() * 99999);

		if (field.widget) {
			wc = widgets[field.widget];
		}
		else if (field.type === 'text') {
			wc = widgets.textarea;
		}
		else if (field.type === 'enum' && field.choices) {
			wc = widgets.select;
		}
		else {
			wc = widgets.text;
		}
		
		return new wc({
			id: field_id,
			field: field,
			roadEvent: roadEvent
		});
	};

	O5.views.EventEditorView = Backbone.View.extend({

		roadEvent: null,

		selectEvent: function(event) {
			this.roadEvent = event;
			this.render();
		},

		initialize: function() {
			var $el = this.$el;
			var self = this;
			// Tab navigation
			$el.on('click', 'li[data-tab]', function(e) {
				e.preventDefault();
				$el.find('ul.nav li').removeClass('active');
				$(this).addClass('active');
				var tab = $(this).data('tab');
				$el.find('.fields div[data-tab]').each(function() {
					var $this = $(this);
					if ($this.data('tab') === tab) {
						$this.show();
					}
					else {
						$this.hide();
					}
				});
			});

			$el.on('click', '.close-button', function(e) {
				e.preventDefault();
				self.roadEvent.select();
			}).on('click', '.save-button', function(e) {
				e.preventDefault();
				// self.updateEvent(function() {
				// 	self.roadEvent.select();
				// });
				self.updateEvent();
				self.roadEvent.select();
			});

			$('body').on('click', '.create-new-event', function(e) {
				e.preventDefault();
				var event = new O5.RoadEvent({
					jurisdiction_url: 'test' // FIXME
				});
				// event.once('sync', function() {
					O5.events.add(event);
				// });
				self.selectEvent(event);
			});

		},

		render: function() {
			var self = this;
			var $e = $(JST["event_editor"]({r: self.roadEvent}));
			var $fields = $e.find('.fields');
			this.widgets = [];
			_.each(O5.RoadEventFields, function(field) {
				var $field_el = $('<div class="field" />');
				var widget = getWidget(field, self.roadEvent);
				$field_el.attr('data-tab', field.tab);
				if (widget.addLabel) {
					$field_el.append($('<label for="' + widget.id + '" />').text(field.label));
				}
				self.widgets.push(widget);
				$field_el.append(widget.el);
				if (self.roadEvent && self.roadEvent.get(field.name)) {
					widget.setVal(self.roadEvent.get(field.name));
				}
				$fields.append($field_el);
			});
			self.$el.empty().append($e);
			$e.find('ul.nav li[data-tab="basics"]').click();
		},

		getUpdates: function() {
			var updates = {};
			_.each(this.widgets, function (widget) {
				var field = widget.options.field;
				updates[field.name] = widget.getVal();
			});
			return updates;
		},

		updateEvent: function(success) {
			var updates = this.getUpdates();
			if (_.size(updates)) {
				// this.roadEvent.update(updates, {success: success});
				this.roadEvent.save(updates, {patch: true, wait: true});
			}
		}

	});

})();