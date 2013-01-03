(function() {
	O5.views = O5.views || {};

	var BaseWidget = Backbone.View.extend({
		addLabel: true,
		setVal: function(val) {
			this.$el.val(val);
		},

		getVal: function() {
			return this.$el.val();
		},

		validate: function() {
			if (this.options.field.validate) {
				return this.options.field.validate(this.getVal());
			}
			if (this.options.field.required && !this.getVal()) {
				return "This field is required";
			}
			return true;
		},

		events: {
			"change": "onChange",
			"keydown": "onChangeActivity"
		},

		onChange: function() {
			this.trigger('change');
		},

		onChangeActivity: function() {
			this.trigger('changeActivity');
		}
	});

	var widgets = {
		textarea: BaseWidget.extend({
			tagName: 'textarea',

			resize: function() {
				var val = this.getVal();
				var rows = Math.min((val.length / 40) + val.split('\n').length - 1, 12) + 1;
				this.$el.attr('rows', rows);
			},

			initialize: function() {
				this.$el.attr('rows', 1);
				this.on('change changeActivity', this.resize, this);
			},

			setVal: function() {
				BaseWidget.prototype.setVal.apply(this, arguments);
				this.resize();
			}
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

		date: BaseWidget.extend({
			tagName: 'input',
			initialize: function() {
				this.$el.attr('type', 'text');
				this.$el.datepicker({
					format: 'yyyy-mm-dd'
				});
			},
			setVal: function(val) {
				this.$el.val(val);
				this.$el.datepicker('update');
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
				this.onChange();
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

	var fieldCounter = 1;

	var getWidget = function(field, roadEvent) {
		var wc;

		var field_id = 'field_' + fieldCounter++;

		if (field.widget) {
			wc = widgets[field.widget];
		}
		else if (field.type === 'text') {
			wc = widgets.textarea;
		}
		else if (field.type === 'enum' && field.choices) {
			wc = widgets.select;
		}
		else if (field.type === 'date') {
			wc = widgets.date;
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
				if (!self.validate()) {
					return O5.utils.notify("Looks like something's not valid.");
				}
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
				var $field_el = $('<div class="field control-group" />');
				var widget = getWidget(field, self.roadEvent);
				$field_el.attr('data-tab', field.tab);
				if (widget.addLabel) {
					$field_el.append($('<label for="' + widget.id + '" />').text(field.label));
				}
				self.widgets.push(widget);
				widget.on('change', function() { self.validateWidget(widget); });
				// widget.on('changeActivity', function() { $field_el.removeClass('error'); });
				$field_el.append(widget.el);
				var val = self._getRoadEventValue(field.name);
				if (val) {
					widget.setVal(val);
				}
				$fields.append($field_el);
			});
			self.$el.empty().append($e);
			$e.find('ul.nav li[data-tab="basics"]').click();
		},

		_getRoadEventValue: function(name) {
			if (!this.roadEvent) {
				return null;
			}
			var name_bits = name.split('/');
			var base = this.roadEvent.get(name_bits.shift());
			while (base && name_bits.length) {
				base = base[name_bits.shift()];
			}
			return base;
		},

		getUpdates: function() {
			var updates = {};
			_.each(this.widgets, function (widget) {
				var field = widget.options.field;
				var val = widget.getVal();
				if (val === '') val = null;
				// This is done so that 'schedule/startDate' goes to {'schedule': {'startDate': x }}
				var name_bits = field.name.split('/');
				var base = updates;
				while (name_bits.length > 1) {
					var bit = name_bits.shift();
					if (!base[bit]) {
						base[bit] = {};
					}
					base = base[bit];
				}
				base[name_bits[0]] = val;
			});
			return updates;
		},

		updateEvent: function(success) {
			var updates = this.getUpdates();
			if (_.size(updates)) {
				// this.roadEvent.update(updates, {success: success});
				this.roadEvent.save(updates, {patch: true, wait: true});
			}
		},

		validateWidget: function(widget) {
			var fieldValid = widget.validate();
			var $control = widget.$el.closest('.control-group');
			if (fieldValid === true) {
				$control.removeClass('error');
				$control.find('.validation-error').remove();
				return true;
			}
			else {
				$control.addClass('error');
				var $msg = $('<span class="help-inline validation-error" />');
				$msg.text(fieldValid);
				$control.append($msg);
				return false;
			}
		},

		validate: function() {
			var self = this;
			var valid = true;
			_.each(this.widgets, function(widget) {
				if (!self.validateWidget(widget)) {
					valid = false;
				}
			});
			return valid;
		}

	});

})();