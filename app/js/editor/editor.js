(function() {
	O5.views = O5.views || {};

	var fieldCounter = 1;

	O5.views.EventEditorView = O5.views.BaseView.extend({

		roadEvent: null,

		selectEvent: function(event) {
			this.roadEvent = event;
			this.render();
		},

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);
			var $el = this.$el;
			var self = this;
			// Tab navigation
			$el.on('click', 'li[data-tab]', function(e) {
				e.preventDefault();
				$el.find('ul.tabs li').removeClass('active');
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
				if (!self.roadEvent.id) {
					// Never saved, we shouldn't display it
					return O5.app.layout.setLeftPane(null);
				}
				self.roadEvent.select();
			}).on('click', '.save-button', function(e) {
				e.preventDefault();
				var invalidWidgets = self.getInvalidWidgets();
				if (invalidWidgets.length > 0) {
					return O5.utils.notify(
						O5._t("Validation error. Please verify: ") +
						_.map(invalidWidgets, function(w) { return w.options.field.label; }).join(', ')
					);
				}
				self.updateEvent({
					success: function() {
						self.roadEvent.select();
					}
				});
				self.roadEvent.select();
			}).on('click', '.delete-button', function(e) {
				e.preventDefault();
				if (self.roadEvent.status === 'ARCHIVED' ||
					window.confirm(O5._t("In general, you should set road events to archived status rather than deleting them. Are you sure you want to delete this?"))) {
					self.roadEvent.destroy({
						wait: true,
						success: function() {
							O5.app.layout.setLeftPane(null);
							O5.app.router.navigate('');
						}
					});
				}
			});

		},

		render: function() {
			var self = this;
			var $e = $(JST["event_editor"]({r: self.roadEvent}));
			var $fields = $e.find('.fields');
			this.widgets = [];
			_.each(this.getFieldDefs(self.roadEvent), function(field) {
				var $field_el = $('<div class="field editor-row" />');
				var widget = self.makeWidget(field, self.roadEvent);
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
			self.app.layout.drawLeftPane();
			$e.find('ul.tabs li[data-tab="basics"]').click();
		},

		renderCreateButton: function() {
			var self = this;
			self.app.editableJurisdictionSlugs = [];
			_.each(self.app.settings.jurisdictions, function(jur) {
				if (jur.editable) {
					self.app.editableJurisdictionSlugs.push(jur.slug);
				}
			});
			if (!self.app.editableJurisdictionSlugs.length) {
				return null;
			}
			var $button = $(JST.create_event({ jurisdiction_slugs: self.app.editableJurisdictionSlugs }));
			$button.on('click', function(e) {
				e.preventDefault();
				var event = new O5.RoadEvent({
					jurisdiction_url: $(e.target).attr('data-slug')
				});
				// event.once('sync', function() {
					self.app.events.add(event);
				// });
				self.selectEvent(event);
				self.app.layout.setLeftPane(self);
			});
			return $button;
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
				_.each(widget.getVals(), function(val, key) {
					if (val === '') val = null;
					// This is done so that 'schedule/startDate' goes to {'schedule': {'startDate': x }}
					var name_bits = key.split('/');
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
			});
			return updates;
		},

		updateEvent: function(opts) {
			var updates = this.getUpdates();
			opts = opts || {};
			_.defaults(opts, {
				patch: true,
				wait: true
			});
			if (_.size(updates)) {
				this.roadEvent.save(updates, opts);
			}
		},

		validateWidget: function(widget) {
			var fieldValid = widget.validate();
			var $control = widget.$el.closest('.control-group');
			$control.find('.validation-error').remove();
			if (fieldValid === true) {
				$control.removeClass('error');
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

		getInvalidWidgets: function() {
			return _.reject(this.widgets, this.validateWidget);
		},

		makeWidget: function(field, roadEvent) {
			var wc;

			var field_id = 'field_' + fieldCounter++;

			if (field.widget) {
				if (_.isObject(field.widget)) {
					wc = field.widget;
				}
				else {
					wc = O5.widgets[field.widget];
				}
			}
			else if (field.type === 'text') {
				wc = O5.widgets.textarea;
			}
			else if (field.type === 'enum' && field.choices) {
				wc = O5.widgets.select;
			}
			else if (field.type === 'date') {
				wc = O5.widgets.date;
			}
			else {
				wc = O5.widgets.text;
			}

			return new wc({
				app: this.app,
				id: field_id,
				field: field,
				roadEvent: roadEvent
			});
		},

		getFieldDefs: function(roadEvent) {
			var fields = O5.RoadEventFields.slice(0);
			// PLUGIN HOOK
			this.app.trigger('editor-field-definitions', {
				fields: fields,
				roadEvent: roadEvent
			});
			return fields;
		}
	});

})();