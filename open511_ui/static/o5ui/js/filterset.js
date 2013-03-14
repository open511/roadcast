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
			label: "Jurisdiction",

			glocal: function(key, value, rdev) {
				return rdev.jurisdictionSlug() === value;
			},

			remote: defaultRemote,

			choices: function() {
				return _.map(O5.jurisdictions, function(jur) {
					return [jur.slug, jur.slug];
				});
			},

			widget: 'select'

		},

		severity: {
			label: "Severity",

			local: filterExactValue,

			remote: defaultRemote,

			widget: 'select',

			choices: O5.RoadEventFieldsLookup.severity.choices
		},

		event_type: {
			label: O5.RoadEventFieldsLookup.event_type.label,
			glocal: filterExactValue,
			remote: defaultRemote,
			widget: 'select',
			choices: O5.RoadEventFieldsLookup.event_type.choices
		}
	};

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

		var self = this;
		this.app.events.on('add', function(event, collection, options) {
			if (options && options.sourceFilteredSet) {
				options.sourceFilteredSet.forceAdd(event);
				if (options.sourceFilteredSet !== self.activeSet && !self.activeSet.evaluateEvent(event)) {
					event.set('visible', false);
				}
			}
			else {
				if (!self.activeSet.evaluateEvent(event)) {
					event.set('visible', false);
				}
			}
			for (var i = 0; i < self.history.length; i ++) {
				if (self.history[i] !== self.activeSet) {
					self.history[i].evaluateEvent(event);
				}
			}
		});
		this.app.events.on('remove', function() {
			// FIXME
		});
		this.app.events.on('change', function() {
			// FIXME
		});
	};

	_.extend(FilterManager.prototype, {

		_addToHistory: function(fs) {
			this.history.push(fs);
		},

		/**
		 * Delegates to evaluateEvent on the active FilteredSet.
		 */
		evaluateEvent: function() {
			return this.activeSet.evaluateEvent.apply(this.activeSet, arguments);
		},

		getCurrentFilters: function() {
			return this.activeSet.filterState;
		},

		/**
		 * Change the active FilteredSet to one with the provided set
		 * of filters; figures out the best way to calculate those filters,
		 * and does it.
		 *
		 * filters - an object with key/value text pairs representing filters
		 */
		setFilters: function(filters) {

			var self = this;
			// Can we derive the new FilteredSet locally, based on a complete
			// FilteredSet stored in our history list?
			var parentSet = _.find(this.history, function(fs) {
				if (!fs.isSubset(filters)) {
					return false;
				}

				// Which filters, if any, are new?
				var newFilters = _.difference(_.keys(filters), _.keys(fs.filterState));
				return _.every(newFilters, function(f) { return FILTERS[f] && FILTERS[f].local; });
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


		filterRemote: function() {
			this.events = {};
			this.fetchEvents();
		},

		testLocalFilters: function(event, filters) {
			return _.all(filters, function(val, type) {
				return FILTERS[type].local(type, val, event);
			});
		},

		evaluateEvent: function(event) {
			// Do we already have the event?
			if (this.events[event.id]) {
				return true;
			}

			if (!this.testLocalFilters(event, this.localFilters)) {
				return false;
			}
			if (!this.filterableLocally) {
				console.log('evaluateEvent needs to test against remote filters');
				return false;
			}

			// If it matches, add to our list of events
			this.forceAdd(event);
			return true;
		},

		forceAdd: function(event) {
			this.events[event.id] = event;
		},

		/**
		Replace the current set of filters with a new one.
		filters: an object with key/val pairs representing filters
		*/
		replaceFilters: function(filters) {
			// Find what's new
			var newFilters = {};
			var self = this;
			_.each(filters, function(val, key) {
				if (!self.filterState[key]) {
					newFilters[key] = val;
				}
			});

			var analysis = analyzeFilters(newFilters);

			this.filterState = filters;
			_.extend(this, analyzeFilters(filters));

			// If necessary, send remote request
			if (!analysis.filterableLocally) {
				return this.filterRemote(filters);
			}

			// Run all local filters
			_.each(this.events, function(event, key) {
				if (!self.testLocalFilters(event, analysis.localFilters)) {
					delete self.events[key];
				}
			});

		},

		/** 
		Will the given filters match a subset of this FilterSet's events?
		*/
		isSubset: function(newState) {
			var fs = this.filterState;
			if (_.difference(_.keys(fs), _.keys(newState)).length) {
				// There are keys in the current state not present in the new state
				return false;
			}
			return !_.any(newState, function(val, key) {
				if (_.has(fs, key) && fs[key] !== val) {
					// A new value for an existing filter
					return true;
				}
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
				if (events[i].get('visible') !== vis) {
					events[i].set('visible', vis);
				}
			}
		},

		_sync: function(url_params, opts) {
			var filteredSet = this;
			url_params = url_params || {};
			_.defaults(url_params, {
				format: 'json',
				'accept-language': 'en,fr',
				'limit': 50
			});
			opts = opts || {};
			opts.url = this.app.events.url() + '?' + $.param(url_params);
			var collection = filteredSet.app.events;
			var success = function(resp, status, xhr) {
				var eventData = _.map(collection.parse(resp),
					collection.model.prototype.parse);
				var x, existing = [];
				for (var i = 0; i < eventData.length; i++) {
					x = collection.get(eventData[i].id);
					if (x) existing.push(x);
				}
				collection.add(eventData, {
					merge: true,
					sourceFilteredSet: filteredSet
				});
				var isActive = (filteredSet === filteredSet.manager.activeSet);
				_.each(existing, function(ev) {
					filteredSet.forceAdd(ev);
					if (isActive) ev.set('visible', true);
				});
				if (resp.pagination.next_url) {
					if (isActive) {
						// Only fetch more if this FilteredSet is still active
						filteredSet._sync(_.extend(url_params, {
							offset: resp.pagination.offset + resp.pagination.limit}), opts);
					}
				}
				else {
					// We have all the items for this set; save it to the history
					// for use in future filters
					filteredSet.manager._addToHistory(filteredSet);
				}
			};
			opts.success = success;
			return Backbone.sync.call(this.app.events, 'read', this.app.events, opts);
		},

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