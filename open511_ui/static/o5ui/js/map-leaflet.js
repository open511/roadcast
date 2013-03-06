(function() {

  var Map = O5.views.BaseMapView.extend({

    render: function() {
      var mapOptions = {
        center: [this.options.startLat, this.options.startLng],
        zoom: this.options.startZoom,
        zoomControl: false
      };
      this.lmap = L.map(this.el, mapOptions);

      var iconopts = {
        iconUrl: this.options.markerOpts.icon
      };
      if (this.options.markerOpts.iconAnchor) {
        iconopts.iconAnchor = this.options.markerOpts.iconAnchor;
      }
      this.markerIcon = L.icon(iconopts);

      L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.jpg', {
        minZoom: 1,
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: [
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ',
          'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ',
          'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ',
          'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        ].join("")
      }).addTo(this.lmap);

      // window.lmap = this.lmap;
    },

    geoJSONToVector: function(gj) {
      var layer = L.GeoJSON.geometryToLayer(gj);
      return layer;
    },

    getMarker: function(coords) {
      return L.marker([coords[1], coords[0]], {
        icon: this.markerIcon
      });
    },

    removeOverlay: function(overlay) {
      this.lmap.removeLayer(overlay);
    },

    addOverlay: function(overlay, events) {
      this.lmap.addLayer(overlay);
      _.each(events || {}, function(callback, event) {
        overlay.on(event, callback);
      });
    },

    setOverlayVisibility: function(overlay, visible) {
      if (visible) {
        this.addOverlay(overlay);
      }
      else {
        this.removeOverlay(overlay);
      }
    },

    initializeDrawing: function() {
      if (!this.drawingHandlers) {
        this.drawingHandlers = {
          point: new L.Marker.Draw(this.lmap, {
            icon: this.markerIcon
          }),
          line: new L.Polyline.Draw(this.lmap),
          polygon: new L.Polygon.Draw(this.lmap)
        };

        var self = this;

        this.lmap.on('draw:marker-created', function(e) {
          var ll = e.marker.getLatLng();
          gj = {
            type: 'Point',
            coordinates: [ll.lng, ll.lat]
          };
          self.trigger('draw', gj);
        });
        this.lmap.on('draw:poly-created', function(e) {
          gj = {
            type: 'LineString',
            coordinates: _.map(e.poly.getLatLngs(), function(ll) {
              return [ll.lng, ll.lat];
            })
          };
          self.trigger('draw', gj);
        });
      }
    },

    startDrawing: function(mode, options) {
      this.initializeDrawing();
      // clear existing points?
      if (this.currentDrawingHandler) {
        this.stopDrawing();
      }
      this.currentDrawingHandler = this.drawingHandlers[mode];
      this.currentDrawingHandler.enable();
    },

    stopDrawing: function() {
      if (this.currentDrawingHandler) {
        this.currentDrawingHandler.disable();
        this.currentDrawingHandler = null;
      }
    },

    zoom: function(delta) {
      this.lmap.setZoom(this.lmap.getZoom() + delta);
    }

  });

  O5.views.MapView = Map;
})();