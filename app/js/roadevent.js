(function(){

	var _t = O5._t;

	O5.RoadEvent = Backbone.Model.extend({

		initialize: function() {
			if (!this.internal) this.internal = { visible: true };
		},

		select: function(opts) {
			// see collection.select for options
			this.collection.select(this, opts);
		},

		getJurisdictionID: function() {
			return this.get('jurisdiction_id') || this.id.split('/')[0];
		},

		/**
		 * Like event.get(key), but for Enum fields; returns the friendly,
		 * multilingual name, not the internal key, e.g. "Special event" instead of SPECIAL_EVENT.
		 */
		getEnum: function(key) {
			var val = this.get(key);
			var spec = O5.RoadEventFieldsLookup[key];
			if (!spec || !val || !spec.choices) return val;
			var choice = _.findWhere(spec.choices, {0: val});
			if (!choice) return val;
			return choice[1];
		},

		parse: function(resp) {
			if (resp.events && resp.meta) return resp.events[0];
			return resp;
		},

		navigateTo: function(opts) {
			if (this.get('id')) {
				O5.app.router.navigate('events/' + this.get('id'), opts || {});
			}
		},

		url: function() {
			var url = this.get('url');
			if (url) {
				return url;
			}
			return Backbone.Model.prototype.url.call(this);
		},

		sync: function(method, model, opts) {
			if (method === 'read') {
				// Add some default parameters to the URL
				if (!opts.url) opts.url = model.url();
				opts.url += opts.url.indexOf('?') === -1 ? '?' : '&';
				opts.url += 'format=json&accept-language=' + O5.language;
			}
			else {
				this._sync_called = true;
			}
			return Backbone.sync.call(this, method, model, opts);
		},

		neverSaved: function() {
			// A stronger version of isNew() that returns false
			// as soon as we first try to send the model to the server.
			// Note that even if sending the model to the server
			// fails, this'll continue returning false.
			return this.isNew() && !this._sync_called;
		},

		setInternal: function(key, val, opts) {
			var changing = (val !== this.internal[key]);
			this.internal[key] = val;
			opts = opts || {};
			if (!opts.silent)
				this.trigger('internalChange:' + key, this, this.internal[key], opts);
		},

		getInternal: function(key) {
			return this.internal[key];
		},

		parseSchedule: function() {
			return new O5.prototypes.Schedule(this.get('schedules'));
		}

	});

	// Default Collection.
	O5.RoadEvents = Backbone.Collection.extend({
		model: O5.RoadEvent,

		sync: function() {
			throw new Error('Sync not supported on Collection');
		},

		parse: function(resp, xhr) {
			return resp.events;
		},

		select: function(model, opts) {
			// valid options:
			// - panTo: asks the map to pan
			// - display: true by default, triggers a 'display' event which the 
			// 		detail-viewer pane responds to
			opts = _.extend({
				display: true
			}, opts || {});
			if (this.selectedEvent && this.selectedEvent !== model)
				this.selectedEvent.setInternal('selected', false);
			this.selectedEvent = model;
			model.setInternal('selected', true);
			if (opts.display) O5.app.trigger('display', model, opts);
		},

		getVisible: function() {
			return this.filter(function(model) { return model.internal.visible; });
		}

	});

	O5.RoadEventFields = [
			{
				name: 'headline',
				label: _t('Headline'),
				type: 'text',
				tab: 'basics',
				required: true
			},
			{
				name: 'status',
				label: _t('Status'),
				type: 'enum',
				tab: 'basics',
				choices: [
					['ACTIVE', _t('Active')],
					['ARCHIVED', _t('Archived')]
				],
				'default': 'ACTIVE',
				required: true
			},
			{
				name: 'description',
				label: _t('Description'),
				type: 'text',
				tab: 'details'
			},
			{
				name: 'event_type',
				label: _t('Event type'),
				type: 'enum',
				tab: 'basics',
				choices: [
					['CONSTRUCTION', _t('Planned road work')],
					['INCIDENT', _t('Incident')],
					['SPECIAL_EVENT', _t('Special event')]
				],
				'default': 'CONSTRUCTION',
				required: true
			},
			{
				name: 'severity',
				label: _t('Severity'),
				type: 'enum',
				tab: 'basics',
				choices: [
					['MINOR', _t('Minor')],
					['MODERATE', _t('Moderate')],
					['MAJOR', _t('Major')],
					['UNKNOWN', _t('Unknown')]
				],
				required: true
			},
			{
				name: 'geography',
				label: _t('Geography'),
				type: 'geom',
				widget: 'map',
				tab: 'basics',
				required: true
			},
			{
				name: 'schedules',
				type: 'group',
				widget: 'schedule',
				tab: 'schedule',
				label: _t('Schedule'),
				displayLabel: false,
				validate: function(val, opts) {
					if (val.end_date && !moment(val.start_date).isBefore(val.end_date)) {
						return {
							field: 'end_date',
							error: O5._t('End date must be after start date (or left blank)')
						};
					}
					if (val.start_time || val.end_time) {
						if (!val.start_time) return {
							field: 'start_time',
							error: O5._t('If end time is provided, start time is required')
						};
						if (!val.end_time && opts && opts.saving) return {
							// Suppress this warning unless we're saving
							field: 'end_time',
							error: O5._t('If start time is provided, end time is required')
						};
						if (val.end_time && !moment('2013-01-01T' + val.start_time).isBefore(moment('2013-01-01T' + val.end_time))) return {
							field: 'start_time',
							error: O5._t('Start time must be before end time')
						};
					}
					return true;
				},
				required: true,
				initialEmptyRows: 0,
				fields: [
					{
						name: 'start_date',
						label: _t('Start date'),
						required: true,
						type: 'date'
					},
					{
						name: 'end_date',
						label: _t('End date'),
						type: 'date'
					},
					{
						name: 'start_time',
						label: _t('Start time'),
						type: 'time'
					},
					{
						name: 'end_time',
						label: _t('End time'),
						type: 'time'
					},
					{
						name: 'days',
						label: _t('Weekdays'),
						type: 'multienum',
						widget: 'multitoggle',
						choices: [
							[1, _t('Mon')],
							[2, _t('Tue')],
							[3, _t('Wed')],
							[4, _t('Thu')],
							[5, _t('Fri')],
							[6, _t('Sat')],
							[7, _t('Sun')]
						]
					}
				],
				specificDatesFields: [
					{
						name: 'date',
						label: _t('Specific date'),
						type: 'date',
						placeholder: _t('Date'),
						required: true,
						help_text: _t("The schedule for this event on a specific date. Overrides any recurring schedules. To specify that the event is not active on this date, enter a date but leave the times blank.")
					},
					{
						name: 'times',
						type: 'group',
						widget: 'timerange',
						repeating: true,
						autoAddRows: true,
						addSeparators: false
					}
				]
			},
			{
				name: 'detour',
				label: _t('Detour'),
				type: 'text',
				tab: 'details'
			},
			{
				name: 'roads',
				type: 'group',
				repeating: true,
				validate: function(val) {
					if (val.state && !val.direction) return {
						field: 'direction',
						error: O5._t('If state is provided, direction is required')
					};
					return true;
				},
				fields: [
					{
						name: 'name',
						label: _t('Road name'),
						type: 'text',
						required: true
					},
					{
						name: 'from',
						label: _t('From'),
						type: 'text'
					},
					{
						name: 'to',
						label: _t('To'),
						type: 'text'
					},
					{
						name: 'direction',
						label: _t('Direction'),
						type: 'enum',
						choices: [
							['', ''],
							['BOTH', _t('Both')],
							['N', _t('North')],
							['S', _t('South')],
							['E', _t('East')],
							['W', _t('West')]
						]
					},
					{
						name: 'state',
						label: _t('State'),
						type: 'enum',
						choices: [
							['', ''],
							['ALL_LANES_OPEN', _t('All lanes open')],
							['SOME_LANES_CLOSED', _t('Some lanes closed')],
							['SINGLE_LANE_ALTERNATING', _t('Single lane alternating')],
							['CLOSED', _t('All lanes closed')]
						]
					}
				],
				tab: 'roads'
			}
	];

	O5.RoadEventFieldsLookup = {};
	_.each(O5.RoadEventFields, function(f) {
		O5.RoadEventFieldsLookup[f.name] = f;
	});

})();
