(function(){

  var sync =  function(method, model, opts) {
    if (method === 'read') {
      params = {
        type: 'GET',
        dataType: 'json'
      };
      if (!params.url) { params.url = model.url(); }
      params.url += '?format=json&accept-language=en,fr;q=0.1';
      if (params.url.substring(0, 4) === 'http') {
        // JSONP
        params.url += '&callback=?';
      }
      if (opts.offset) {
        params.url += '&offset=' + opts.offset;
        delete opts.offset;
      }
      _.defaults(params, opts);
      $.ajax(params);
    }
    else {
      Backbone.sync(method, model, opts);
    }
  };

  O5.RoadEvent = Backbone.Model.extend({

    select: function() {
      this.collection.trigger('selection', this);
    },

    edit: function() {
      this.collection.trigger('edit', this);
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
          console.log('success!');
          self.fetch();
          if (_.isFunction(opts.success)) {
            opts.success();
          }
        }
      });
    },

    sync: sync
  
  });

  // Default Collection.
  O5.RoadEvents = Backbone.Collection.extend({
    model: O5.RoadEvent,
    url: function() {
      return O5.apiURL + 'events/';
    },

    sync: sync,

    parse: function(resp, xhr) {
      if (resp.pagination.next_url) {
        var collection = this;
        this.sync('read', this, {
          offset: resp.pagination.offset + resp.pagination.limit,
          success: function(resp, status, xhr) {
            collection.add(collection.parse(resp, xhr), {parse: true});
          }
        });
      }
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
        name: 'eventType',
        label: 'Event type',
        type: 'enum',
        tab: 'basics',
        choices: [
          ['construction', 'Construction'],
          ['event', 'Special event'],
          ['incident', 'Incident (accident, unplanned roadwork...)']
        ],
        required: true
      },
      {
        name: 'severity',
        label: 'Severity',
        type: 'enum',
        tab: 'basics',
        choices: [
          ['minor', 'Minor'],
          ['major', 'Major'],
          ['apocalyptic', 'Apocalyptic']
        ],
        required: true
      },
      {
        name: 'geometry',
        label: 'Geography',
        type: 'geom',
        widget: 'map',
        tab: 'map',
        required: true
      },
      {
        name: 'schedule/startDate',
        label: 'Start date',
        type: 'date',
        tab: 'schedule',
        required: true
      },
      {
        name: 'schedule/endDate',
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


})();
