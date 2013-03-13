(function() {

    var filterExactValue = function(key, value, rdev) {
        return rdev.get(key) === value;
    };

    var defaultRemote = function(key, value) {
        return {key: value};
    };

    var FILTERS = {
        jurisdiction: {
            label: "Jurisdiction",

            local: function(key, value, rdev) {
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
            local: filterExactValue,
            remote: defaultRemote,
            widget: 'select',
            choices: O5.RoadEventFieldsLookup.event_type.choices
        }
    };


    var FilteredSet = function(opts) {
        this.app = opts.app;
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
        _.extend(this, this._analyzeState());
    };

    _.extend(FilteredSet.prototype, {


        filterRemote: function(newState) {
            alert('remoteFilter not implemented');
        },

        _analyzeState: function(newState) {
            newState = newState || this.filterState;
            var localFilters = {}, remoteFilters = {}, filterableLocally = true;
            _.each(newState, function(val, type) {
                if (FILTERS[type].local) {
                    localFilters[type] = val;
                }
                else {
                    remoteFilters[type] = val;
                    filterableLocally = false;
                }
            });
            return {
                localFilters: localFilters,
                remoteFilters: remoteFilters,
                filterableLocally: filterableLocally
            };
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
            this.events[event.id] = event;
            return true;
        },

        addFilters: function(newState) {
            // Find what's new
            var newFilters = {};
            var self = this;
            _.each(newState, function(val, key) {
                if (!self.filterState.key) {
                    newFilters[key] = val;
                }
            });

            var analysis = this._analyzeState(newFilters);

            // If necessary, send remote request
            if (!analysis.filterableLocally) {
                return this.filterRemote(newState);
            }

            // Run all local filters
            _.each(this.events, function(event, key) {
                if (!self.testLocalFilters(event, analysis.localFilters)) {
                    delete self.events[key];
                    event.set('visible', false);
                }
            });

            this.filterState = newState;
            _.extend(this, this._analyzeState());

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

        setVisibility: function(allEvents) {
            events = allEvents || O5.events.models;
            for (var i = 0; i < events.length; i++) {
                var vis = this.events.hasOwnProperty(events[i].id);
                if (events[i].get('visible') !== vis) {
                    events[i].set('visible', vis);
                }
            }
        }

    });

    O5.prototypes.FilteredSet = FilteredSet;
    O5.FILTERS = FILTERS;
})();