(function(){

	var _t = O5._t;

	O5.RoadEvent = Backbone.Model.extend({

		initialize: function() {
			if (!this.has('_visible')) {
				this.set('_visible', true);
			}
		},

		select: function() {
			var self = this;
			_.each(this.collection.where({'_selected': true}), function(rdev) {
				if (rdev !== self) rdev.set('_selected', false);
			});
			this.set('_selected', true);
			this.collection.trigger('selection', this);
		},

		edit: function() {
			this.collection.trigger('edit', this);
		},

		canEdit: function() {
			return O5.enableEditing && _.indexOf(O5.editableJurisdictionSlugs, this.jurisdictionSlug()) !== -1;
		},

		jurisdictionSlug: function() {
			return this.get('jurisdiction_url').replace(/\/$/, '').split('/').slice(-1)[0];
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
			if (resp.meta) {
				delete resp.meta;
			}
			resp.id = resp.url.replace(/\/$/, '').split('/').slice(-2).join('/');
			return resp;
		},

		navigateTo: function(opts) {
			if (this.get('id')) {
				O5.router.navigate('events/' + this.get('id'), opts || {});
			}
		},

		url: function() {
			var url = this.get('url');
			if (url) {
				return url;
			}
			return Backbone.Model.prototype.url.call(this);
		},

		update: function(updates, opts) {
			var self = this;
			opts = opts || {};
			$.ajax({
				url: this.url(),
				data: JSON.stringify(updates),
				type: 'POST',
				contentType: 'application/json',
				processData: false,
				success: function() {
					self.fetch();
					if (_.isFunction(opts.success)) {
						opts.success();
					}
				}
			});
		},

		sync: function(method, model, opts) {
			if (method === 'read') {
				// Add some default parameters to the URL
				if (!opts.url) { opts.url = model.url(); }
				opts.url += opts.url.indexOf('?') === -1 ? '?' : '&';
				opts.url += 'format=json&accept-language=en,fr';
			}
			return Backbone.sync.call(this, method, model, opts);
		}
	});

	// Default Collection.
	O5.RoadEvents = Backbone.Collection.extend({
		model: O5.RoadEvent,
		url: function() {
			return O5.apiURL + 'events/';
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
				required: true
			},
			{
				name: 'description',
				label: _t('Description'),
				type: 'text',
				tab: 'details',
				required: true
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
