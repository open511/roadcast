(function(){

	var _t = O5._t;

	O5.RoadEvent = Backbone.Model.extend({

		initialize: function() {
			if (!this.has('_visible')) {
				this.set('_visible', true);
			}
		},

		select: function(opts) {
			// valid options:
			// - panTo: asks the map to pan
			// - trigger: send a selection event, which does things like
			// 		display the event details
			opts = _.extend({
				trigger: true
			}, opts || {});
			var self = this;
			_.each(this.collection.where({'_selected': true}), function(rdev) {
				if (rdev !== self) rdev.set('_selected', false);
			});
			this.set('_selected', true);
			if (opts.trigger) O5.app.trigger('selection', this, opts);
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
			if (resp.meta) delete resp.meta;
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

		isChangeInternal: function() {
			return _.every(_.keys(this.changed), function(key) {
				return key.substr(0, 1) === '_';
			});
		}
	});

	// Default Collection.
	O5.RoadEvents = Backbone.Collection.extend({
		model: O5.RoadEvent,

		initialize: function() {
			// Trigger a specific change:except-internal event when a change
			// occurs to non-internal (not underscore-prefixed) fields.
			this.on('change', function(model, opts) {
				if (!model.isChangeInternal()) {
					model.trigger('change:except-internal', model, opts);
				}
			});
		},

		sync: function() {
			throw new Error('Sync not supported on Collection');
		},

		parse: function(resp, xhr) {
			return resp.content;
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
					['SPECIAL_EVENT', _t('Special event')],
					['INCIDENT', _t('Incident (accident, unplanned roadwork...)')]
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
					['1', _t('Minor')],
					['2', _t('Moderate')],
					['3', _t('Major')],
					['9', _t('Undefined')]
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
				name: 'schedule/start_date',
				label: _t('Start date'),
				type: 'date',
				tab: 'schedule',
				required: true
			},
			{
				name: 'schedule/end_date',
				label: _t('End date'),
				type: 'date',
				tab: 'schedule'
			},
			{
				name: 'detour',
				label: _t('Detour'),
				type: 'text',
				tab: 'details'
			},
			{
				name: 'roads',
				label: _t('Roads'),
				type: 'complex',
				widget: 'roads',
				tab: 'roads'
			}
	];

	O5.RoadEventFieldsLookup = {};
	_.each(O5.RoadEventFields, function(f) {
		O5.RoadEventFieldsLookup[f.name] = f;
	});

})();
