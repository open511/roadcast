(function(){

	O5.RoadEvent = Backbone.Model.extend({

		initialize: function() {
			if (!this.has('visible')) {
				this.set('visible', true);
			}
		},

		select: function() {
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

		parse: function(resp) {
			if (resp.content && resp.meta) {
				resp = resp.content;
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
				label: 'Headline',
				type: 'text',
				tab: 'basics',
				required: true
			},
			{
				name: 'status',
				label: 'Status',
				type: 'enum',
				tab: 'basics',
				choices: [
					['active', 'Active'],
					['archived', 'Archived']
				],
				required: true
			},
			{
				name: 'description',
				label: 'Description',
				type: 'text',
				tab: 'details',
				required: true
			},
			{
				name: 'event_type',
				label: 'Event type',
				type: 'enum',
				tab: 'basics',
				choices: [
					['CONSTRUCTION', 'Planned road work'],
					['SPECIAL_EVENT', 'Special event'],
					['INCIDENT', 'Incident (accident, unplanned roadwork...)']
				],
				required: true
			},
			{
				name: 'severity',
				label: 'Severity',
				type: 'enum',
				tab: 'basics',
				choices: [
					['1', 'Minor'],
					['2', 'Moderate'],
					['3', 'Major'],
					['9', 'Undefined']
				],
				required: true
			},
			{
				name: 'geography',
				label: 'Geography',
				type: 'geom',
				widget: 'map',
				tab: 'basics',
				required: true
			},
			{
				name: 'schedule/start_date',
				label: 'Start date',
				type: 'date',
				tab: 'schedule',
				required: true
			},
			{
				name: 'schedule/end_date',
				label: 'End date',
				type: 'date',
				tab: 'schedule'
			},
			{
				name: 'detour',
				label: 'Detour',
				type: 'text',
				tab: 'details'
			}

	];

	O5.RoadEventFieldsLookup = {};
	_.each(O5.RoadEventFields, function(f) {
		O5.RoadEventFieldsLookup[f.name] = f;
	});
			


})();
