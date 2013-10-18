(function() {

	O5.editor = O5.editor || {};

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

			this.app.events.on('destroy', function(rdev) {
				if (rdev === self.roadEvent) {
					self.roadEvent = null;
				}
			});

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
				if (self._lastSavedAttributes) rdev.set(self._lastSavedAttributes);
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
			var $editor = $(JST["event_editor"]({r: self.roadEvent}));
			this.fieldGroup = new O5.editor.TopLevelFieldGroup({
				fields: this.getFieldDefs(this.roadEvent),
				app: this.app,
				roadEvent: this.roadEvent
			});
			this.fieldGroup.setVal(this.roadEvent.attributes);
			$editor.find('.fields').append(this.fieldGroup.renderEditorField());

			this.$el.empty().append($editor);
			this.app.layout.draw();
			$editor.find('ul.tabs li[data-tab="basics"]').click();
		},

		// Returns a Create Event button (to be placed in the navbar)
		renderCreateButton: function() {
			var self = this;

			var $button = $(JST.create_event({ jurisdiction_slugs: self.app.editableJurisdictionSlugs }));
			$button.on('click', function(e) {
				e.preventDefault();
				self.createEvent($(e.target).attr('data-slug'));
			});
			return $button;
		},

		// Create a new event
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
			this.app.layout.setLeftPane(this);
			event.select({display: false});
			this.selectEvent(event);
		},

		// Sends edited data to the server
		updateEvent: function(opts) {
			var updates = this.fieldGroup.getVal();
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

		// Checks validation and, if everything's okay, saves changes to the server
		save: function() {
			var invalidWidgets = this.fieldGroup.getInvalidWidgets({
				saving: true
			});
			if (invalidWidgets.length > 0) {
				return O5.utils.notify(
					O5._t("Validation error. Please verify: ") +
					_.map(invalidWidgets, function(w) { return w.options.label; }).join(', '),
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

		// Get a JS object defining the list of fields to show
		// in the editor
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

		// Called by Layout when someone navigates away
		deactivate: function() {
			if (!this.roadEvent) return;
			if (this.roadEvent.neverSaved()) {
				// Never saved, delete it
				O5.app.events.remove(this.roadEvent);
			}
			else {
				if (!_.isEqual(this.roadEvent.attributes, this._lastSavedAttributes)) {
					var self = this;
					var event = self.roadEvent;
					var last_saved = this._lastSavedAttributes;
					var discarded = false;
					O5.utils.modal(
						O5._t("The event you're currently editing has changes. Are you sure you want to discard them?"),
						{
							buttons: [
								{
									'name': O5._t('Cancel'),
								},
								{
									'name': O5._t('Discard'),
									'class': 'primary',
									onclick: function() {
										discarded = true;
										event.set(last_saved);
									}
								}
							],
							onclose: function() {
								if (discarded) return;
								self.roadEvent = event;
								event.select({
									display: false
								});
								self.render();
								self.app.layout.setLeftPane(self);
							}
						}
					);
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

		var editor = app.editor = new EventEditorView({app: app});

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