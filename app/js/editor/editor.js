(function() {

	var EventEditorView = O5.views.BaseView.extend({

		roadEvent: null,

		selectEvent: function(event) {
			this.roadEvent = event;
			this.savepoint();
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

			$el.on('click', '.cancel-button', function(e) {
				e.preventDefault();
				var rdev = self.roadEvent;
				self.deactivate();
				if (!rdev || rdev.isNew()) {
					self.app.layout.setLeftPane(null);
				}
				else {
					rdev.select();
				}
			}).on('click', '.save-button', function(e) {
				e.preventDefault();
				self.save();
			});

		},

		render: function() {
			// FIXME refactor, too big
			var self = this;
			var $e = $(JST["event_editor"]({r: self.roadEvent}));
			var $fields = $e.find('.fields');
			this.widgets = [];
			_.each(this.getFieldDefs(self.roadEvent), function(field) {
				var $field_el = $('<div class="field editor-row" />');
				var widget = self.makeWidget(field, self.roadEvent);
				$field_el.attr('data-tab', field.tab).attr('data-fieldname', field.name);
				if (widget.addLabel) {
					$field_el.append($('<label for="' + widget.id + '" />').text(field.label));
				}
				self.widgets.push(widget);
				widget.on('change', function(opts) {
					// suppressValidation option is for e.g. the case when you're clearing the
					// geography -- you want to update the event with the "invalid" value,
					// you don't want to be nagged right away, but you DO want to be nagged
					// if you try to save
					if ((opts || {}).suppressValidation || self.validateWidget(widget)) {
						if (field.name.indexOf('/') === -1) {
							// FIXME doesn't currently support slash-nested names
							self.roadEvent.set(field.name, widget.getVal());
						}
					}
				});
				// widget.on('changeActivity', function() { $field_el.removeClass('error'); });
				$field_el.append(widget.el);
				var val = self._getRoadEventValue(field.name);
				if (val) {
					widget.setVal(val);
				}
				$fields.append($field_el);
			});
			self.$el.empty().append($e);
			self.app.layout.draw();
			$e.find('ul.tabs li[data-tab="basics"]').click();
		},

		renderCreateButton: function() {
			var self = this;

			var $button = $(JST.create_event({ jurisdiction_slugs: self.app.editableJurisdictionSlugs }));
			$button.on('click', function(e) {
				e.preventDefault();
				self.createEvent($(e.target).attr('data-slug'));
			});
			return $button;
		},

		createEvent: function(jurisdiction_id) {
			var event = new O5.RoadEvent({
				status: 'ACTIVE',
				jurisdiction_id: jurisdiction_id
			});

			// Set default values
			var defaults = {};
			_.each(this.getFieldDefs(event), function(field) {
				if (field['default']) {
					defaults[field.name] = field['default'];
				}
			});
			event.set(defaults);

			this.app.events.add(event);
			event.select({display: false});
			this.selectEvent(event);
			this.app.layout.setLeftPane(this);
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
				patch: !this.roadEvent.isNew(),
				wait: true
			});
			if (_.size(updates)) {
				// We want to set a savepoint after updating the model, so that when we get a deactivate
				// event as the editor closes, we'll know not to discard any changes. That's why
				// we do a manual set and then call Backbone's save with {wait: true}
				this.roadEvent.set(updates);
				this.savepoint();
				this.roadEvent.save(updates, opts);
			}
		},

		save: function() {
			var invalidWidgets = this.getInvalidWidgets();
			if (invalidWidgets.length > 0) {
				return O5.utils.notify(
					O5._t("Validation error. Please verify: ") +
					_.map(invalidWidgets, function(w) { return w.options.field.label; }).join(', '),
					'error'
				);
			}

			var rdev = this.roadEvent;
			var wasNew = rdev.isNew();
			this.updateEvent({
				success: function() {
					if (wasNew) rdev.select();
				}
			});
			rdev.select();
		},

		// Remembers the current state of an event's attributes; used to indicate the
		// last saved state
		savepoint: function() {
			this._lastSavedAttributes = _.clone(this.roadEvent.attributes);
		},

		validateWidget: function(widget) {
			var fieldValid = widget.validate();
			var $control = widget.$el.closest('.field');
			$control.find('.validation-error').remove();
			if (fieldValid === true) {
				$control.removeClass('error');
				return true;
			}
			else {
				$control.addClass('error');
				var $msg = $('<span class="emphasized-note error validation-error" />');
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
				id: _.uniqueId('field_'),
				field: field,
				roadEvent: roadEvent
			});
		},

		getFieldDefs: function(roadEvent) {
			var fields = _.clone(O5.RoadEventFields);
			if (roadEvent.isNew()) {
				// Don't show status dropdown on new events
				fields = _.reject(fields, function(field) { return field.name === 'status'; });
			}
			// PLUGIN HOOK
			this.app.trigger('editor-field-definitions', {
				fields: fields,
				roadEvent: roadEvent
			});
			return fields;
		},

		deactivate: function() {
			if (!this.roadEvent) return;
			if (this.roadEvent.neverSaved()) {
				// Never saved, delete it
				O5.app.events.remove(this.roadEvent);
			}
			else {
				if (!_.isEqual(this.roadEvent.attributes, this._lastSavedAttributes)) {
					console.log('Discarding event changes'); // FIXME dialog
					// Revert it
					this.roadEvent.set(this._lastSavedAttributes);
				}
			}
			this.roadEvent = null;
		}
	});

	var initWidgets = function() {

		var StatusWidget = O5.widgets.select.extend({

			getChoices: function() {
				var choices = _.clone(O5.widgets.select.prototype.getChoices.call(this));
				choices.push(['DELETE', O5._t('Deleted')]);
				return choices;
			},

			onChange: function() {
				if (this.getVal() === 'DELETE') {
					this.setVal(this.lastVal);
					var self = this;
					O5.utils.confirm(
						"In general, you should set road events to archived status rather than deleting them. Are you sure you want to delete this?",
						{
							yesText: O5._t('Delete'),
							noText: O5._t('Cancel'),
							onYes: function() {
								var app = self.app;
								self.options.roadEvent.destroy({
									wait: true,
									success: function() {
										app.layout.setLeftPane(null);
										app.router.navigate('');
									}
								});
							}
						}
					);
				}
				else {
					O5.widgets.select.prototype.onChange.apply(this, arguments);
				}
			}
		});

		O5.RoadEventFieldsLookup.status.widget = StatusWidget;
	};

	O5.plugins.register(function(app) {
		if (!app.settings.enableEditing) return;

		app.editableJurisdictionSlugs = [];
		_.each(app.settings.jurisdictions, function(jur) {
			if (jur.editable) {
				app.editableJurisdictionSlugs.push(jur.id);
			}
		});

		if (!app.editableJurisdictionSlugs.length) return;

		var editor = new EventEditorView({app: app});

		var $el = app.layout.$el;
		$el.find('.navbar .buttons').prepend(editor.renderCreateButton());
		$el.on('click', '.edit-event', function (e) {
			e.preventDefault();
			var event = app.events.get($(e.target).closest('[data-roadevent]').attr('data-roadevent'));
			if (event) {
				editor.selectEvent(event);
				app.layout.setLeftPane(editor);
			}
		});

		initWidgets();

		var editButtonHTML = '<a href="#" class="button big primary edit-event" style="width: 100%">' +
			O5._t('Edit') + '</a>';

		app.on('event-detail-render', function(opts) {
			if (_.indexOf(app.editableJurisdictionSlugs, opts.roadEvent.getJurisdictionID()) !== -1) {
				var $footer = opts.$el.find('div.footer');
				if (!$footer.length) $footer = $('<div class="footer container"></div>').appendTo(opts.$el);
				$footer.append($(editButtonHTML));
			}
		});


	});

})();