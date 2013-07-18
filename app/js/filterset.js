(function() {

	var filterExactValue = function(key, value, rdev) {
		return rdev.get(key) === value;
	};

	var defaultRemote = function(key, value) {
		return [key, value];
	};

	/**
	 * The specification of available filters.
	 */
	var FILTERS = {
		jurisdiction: {
			label: O5._t("Jurisdiction"),
			local: function(key, value, rdev) {
				return rdev.getJurisdictionID() === value;
			},
			remote: defaultRemote,
			choices: function() {
				return _.map(O5.app.settings.jurisdictions, function(jur) {
					return [jur.id, jur.id];
				});
			},
			widget: 'select'

		},

		severity: {
			label: O5._t("Severity"),
			local: filterExactValue,
			remote: defaultRemote,
			widget: 'select',
			choices: O5.RoadEventFieldsLookup.severity.choices
		},

		event_type: {
			label: O5.RoadEventFieldsLookup.event_type.label,
			local: filterExactValue,
			remote: defaultRemote,
			widget: 'select',
			choices: O5.RoadEventFieldsLookup.event_type.choices
		},

		status: {
			label: O5._t('Status'),
			local: function(key, value, rdev) {
				value = value.toUpperCase();
				return value === 'ALL' || value === rdev.get('status');
			},
			remote: defaultRemote,
			widget: 'select',
			choices: [
				['ACTIVE', O5._t('Active')],
				['ARCHIVED', O5._t('Archived')],
				['ALL', O5._t('All')]
			]
		},

		date: {
			label: O5._t('Date'),
			remote: function (key, value) {
				return [
					'in_effect_on',
					value + 'T00:00' + ',' + value + 'T23:59'
				];
			},
			widget: 'date'
		}
	};

	/**
	 * Split a list of filters into remote/local.
	 */
	var analyzeFilters = function(filters) {
		var r = {
			localFilters: {},
			remoteFilters: {},
			filterableLocally: true
		};
		_.each(filters, function(val, type) {
			if (FILTERS[type].local) {
				r.localFilters[type] = val;
			}
			else {
				r.remoteFilters[type] = val;
				r.filterableLocally = false;
			}
		});
		return r;
	};

	/**
	 * The public interface to filtering.
	 * 
	 * Maintains a list of previously-seen filters, and figures out the best way
	 * to calculate a given filter.
	 */
	var FilterManager = function(opts) {
		this.app = opts.app;
		this.history = [];

		// Hook into events on the RoadEvents collection
		var self = this;
		this.app.events.on('add', function(event, collection, options) {
			var fs = null;
			if (options) fs = options.sourceFilteredSet;
			if (fs) {
				fs.forceAdd(event);
				if (fs !== self.activeSet && !self.activeSet.evaluateEvent(event, false, fs)) {
					event.set('_visible', false);
				}
			}
			else {
				if (!self.activeSet.evaluateEvent(event)) {
					event.set('_visible', false);
				}
			}
			for (var i = 0; i < self.history.length; i ++) {
				if (self.history[i] !== self.activeSet) {
					self.history[i].evaluateEvent(event, false, fs);
				}
			}
		});
		this.app.events.on('remove', function(event) {
			self.activeSet.forceRemove(event);
			_.each(self.history, function(fs) {
				fs.forceRemove(event);
			});
		});
		this.app.events.on('change:except-internal', function(event) {
			// If an event changes, test it against the active FilteredSet
			// to see if it should still be visible.
			var vis = self.activeSet.evaluateEvent(event, true);
			if (vis !== event.get('_visible')) {
				event.set('_visible', vis);
			}
			// And test it against the history, so those sets remain up-to-date
			// if we want to reuse them later.
			for (var i = 0; i < self.history.length; i ++) {
				if (self.history[i] !== self.activeSet) {
					self.history[i].evaluateEvent(event, true);
				}
			}
		});
	};

	_.extend(FilterManager.prototype, {

		_addToHistory: function(fs) {
			this.history.push(fs);
		},

		getCurrentFilters: function() {
			return _.clone(this.activeSet.filterState);
		},

		/**
		 * Change the active FilteredSet to one with the provided set
		 * of filters; figures out the best way to calculate those filters,
		 * and does it.
		 *
		 * filters - an object with key/value text pairs representing filters
		 */
		setFilters: function(filters) {

			// Clone provided filters, and require an explicit value
			// for the status filter
			filters = _.extend({
				'status': 'ACTIVE'
			}, filters);

			var self = this;
			// Can we derive the new FilteredSet locally, based on a complete
			// FilteredSet stored in our history list?
			var parentSet = _.find(this.history, function(fs) {
				if (!fs.isSubset(filters)) {
					return false;
				}

				// Can all new filters be calculated locally?
				return _.every(
					_.keys(fs.diff(filters)),
					function(f) { return FILTERS[f] && FILTERS[f].local; }
				);
			});

			if (parentSet) {
				if (_.isEqual(parentSet.filterState, filters)) {
					this.activeSet = parentSet;
				}
				else {
					this.activeSet = parentSet.clone();
					this.activeSet.replaceFilters(filters);
				}
			}
			else {
				this.activeSet = new FilteredSet({
					manager: this,
					filterState: filters
				});
				this.activeSet.fetchEvents();
				// While we're waiting, see if we can determine which of the events we already
				// know of belong.
				this.app.events.each(function(event) {
					self.activeSet.evaluateEvent(event);
				});
			}

			this.activeSet.setVisibility();
		}

	});


	/**
	 * A FilteredSet is a query (set of filters), and a list
	 * of the events matching that query. It's mostly not 
	 * publically exposed.
	 */
	var FilteredSet = function(opts) {
		this.manager = opts.manager;
		this.app = this.manager.app;
		_.defaults(opts, {
			events: [],
			filterState: {}
		});
		if (_.isArray(opts.events)) {
			// We store events in object keyed by ID.
			// But you can pass in an array if you want.
			this.events = {};
			for (var i = 0; i < opts.events.length; i++) {
				this.events[opts.events[i].id] = opts.events[i];
			}
		}
		else {
			this.events = opts.events;
		}
		this.filterState = opts.filterState;
		_.extend(this, analyzeFilters(this.filterState));
	};

	_.extend(FilteredSet.prototype, {

		/**
		 * Does a given event pass the given list of local filters?
		 */
		testLocalFilters: function(event, filters) {
			return _.all(filters, function(val, type) {
				return FILTERS[type].local(type, val, event);
			});
		},

		/**
		 * Try and determine whether an event belongs in this set,
		 * and add it if it does. Returns true if the event belongs.
		 *
		 * onChange should be true if this is being called following a change
		 *		to the RoadEvent -- if so, we'll test only against local filters,
		 *		and we'll also remove the event if it no longer matches.
		 * sourceFilteredSet (optional) is the FilterSet object that queried
		 *		the server to get the object
		 */
		evaluateEvent: function(event, onChange, sourceFilteredSet) {

			if (event.isNew()) {
				// Events being created should always be displayed
				return true;
			}

			// Do we already have the event?
			if (!onChange && this.events[event.id]) {
				return true;
			}

			if (!this.testLocalFilters(event, this.localFilters)) {
				if (onChange) this.forceRemove(event);
				return false;
			}
			if (!this.filterableLocally) {
				if (sourceFilteredSet && !onChange) {
					if (_.any(this.remoteFilters, function(val, key) {
						return sourceFilteredSet.filterState[key] !== val;
					})) {
						// If not all of our remote filters are the same in the source, no go.
						return false;
					}
				}
				else {
					// If we don't know what remote filters this matched, we can't evaluate it.
					return false;
				}
			}

			// If it matches, add to our list of events
			this.forceAdd(event);
			return true;
		},

		forceAdd: function(event) {
			this.events[event.id] = event;
		},

		forceRemove: function(event) {
			if (this.events.hasOwnProperty(event.id)) {
				delete this.events[event.id];
			}
		},

		/**
		 * Replace the current set of filters with a new one.
		 * filters: an object with key/val pairs representing filters
		 */
		replaceFilters: function(filters) {
			var self = this;
			var analysis = analyzeFilters(this.diff(filters));

			this.filterState = filters;
			_.extend(this, analyzeFilters(filters));

			// If necessary, send remote request
			if (!analysis.filterableLocally) {
				this.events = {};
				return this.fetchEvents();
			}

			// Run all local filters
			_.each(this.events, function(event, key) {
				if (!self.testLocalFilters(event, analysis.localFilters)) {
					delete self.events[key];
				}
			});

		},

		/**
		 * Return the subset of the provided filters that don't match
		 * the object's current filterState.
		 */
		diff: function(filters) {
			var r = {};
			var self = this;
			_.each(filters, function(val, key) {
				if (val !== self.filterState[key]) {
					r[key] = val;
				}
			});
			return r;
		},

		/** 
		* Will the given filters match a subset of this FilterSet's events?
		*/
		isSubset: function(newState) {
			var fs = this.filterState;
			// The status filter is a special case: 'all' is the same
			// as the null value for other filters.
			if (fs.status.toUpperCase() === 'ALL') {
				// All possible values are a subset of 'all'
				// Ignore status keys for the rest of this function
				fs = _.omit(fs, 'status');
				newState = _.omit(newState, 'status');
			}
			if (_.difference(_.keys(fs), _.keys(newState)).length) {
				// There are keys in the current state not present in the new state
				return false;
			}
			return _.all(newState, function(val, key) {
				return (!_.has(fs, key) || fs[key] === val);
			});
		},

		/**
		 * Go through all known events, and set their 'visible'
		 * property according to whether they're in this FilteredSet.
		 */
		setVisibility: function(allEvents) {
			events = allEvents || this.app.events.models;
			for (var i = 0; i < events.length; i++) {
				var vis = this.events.hasOwnProperty(events[i].id);
				if (events[i].get('_visible') !== vis) {
					events[i].set('_visible', vis);
				}
			}
		},

		_sync: function(url_or_params, opts) {
			var filteredSet = this;
			url_or_params = url_or_params || {};
			opts = opts || {};
			if (_.isString(url_or_params)) {
				opts.url = url_or_params;
			}
			else {
				_.defaults(url_or_params, {
					format: 'json',
					'accept-language': O5.language,
					'limit': 50
				});
				opts.url = this.app.events.url + '?' + $.param(url_or_params);
			}
			var collection = filteredSet.app.events;
			var success = function(resp, status, xhr) {
				var eventData = _.map(collection.parse(resp),
					collection.model.prototype.parse);

				// Put events we already have in existing
				var x, existing = [];
				for (var i = 0; i < eventData.length; i++) {
					x = collection.get(eventData[i].id);
					if (x) existing.push(x);
				}

				// Add/update the events we retrieved in the master events collection
				collection.add(eventData, {
					merge: true,
					sourceFilteredSet: filteredSet
				});

				// Add all the events retrieved to the requesting filteredSet,
				// and ensure they're visible if the filteredSet is active
				var isActive = (filteredSet === filteredSet.manager.activeSet);
				_.each(existing, function(ev) {
					filteredSet.forceAdd(ev);
					if (isActive) ev.set('_visible', true);
				});

				if (resp.pagination.next_url) {
					if (isActive) {
						// Only fetch more if this FilteredSet is still active
						var next_url = resp.pagination.next_url;
						if (/^https?:/.test(opts.url) && next_url.substr(0, 1) === '/') {
							// The server is giving us a relative URL, but our original request
							// was to a fully-qualified URL; join the two.
							// (This basic algorithm only deals with the simple /events type of case)
							next_url = opts.url.match(/^https?:\/\/[^\/]+/) + next_url;
						}
						filteredSet._sync(next_url, opts);
					}
				}
				else {
					// We have all the items for this set; save it to the history
					// for use in future filters
					filteredSet.manager._addToHistory(filteredSet);
				}
			};
			opts.success = success;
			return Backbone.sync.call(this.app.events, 'read', this.app.events, _.clone(opts));
		},

		/**
		 * Populate this FilteredSet from the server.
		 */
		fetchEvents: function() {
			var filter_params = {};
			_.each(this.filterState, function(val, key) {
				var remote = FILTERS[key].remote(key, val);
				filter_params[remote[0]] = remote[1];
			});
			return this._sync(filter_params);
		},

		clone: function() {
			return new FilteredSet({
				manager: this.manager,
				events: _.clone(this.events),
				filterState: _.clone(this.filterState)
			});
		}

	});

	O5.prototypes.FilterManager = FilterManager;
	O5.FILTERS = FILTERS;
})();