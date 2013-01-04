(function() {
  var BaseMap = Backbone.View.extend({

    initialize: function() {
      _.defaults(this.options, {
        startLat: 45.532411,
        startLng: -73.61512,
        startZoom: 10,
        markerOpts: {
          icon: O5.staticURL + 'o5ui/img/cone-small-1.png',
          iconAnchor: [11,29]
        },
        polylineOpts: {
          strokeColor: "#FF0000"
        },
        polygonOpts: {
          strokeColor: "#ff0000",
          fillColor: "#c23e3e"
        }
      });
    },

    /**
    * Returns an array of overlays to add to the map based on the provided GeoJSON object. 
    */
    getOverlaysFromGeoJSON: function(gj) {
      var coords = gj['coordinates']
      switch (gj.type) {
        case 'Point':
          return [this.getMarker(coords)];
        case 'LineString':
          // First, the polyline
          var line = this.geoJSONToVector(gj);
          
          // And then a marker at the middle
          var marker = this.getMarker(coords[Math.floor(coords.length/2)]);
          
          return [line, marker];
        case 'Polygon':
          var gon = this.geoJSONToVector(gj);
          var marker = this.getMarker(coords[0]);
          return [gon, marker];
        default:
          alert("Invalid geometry type: " + gj.type);
      } 
    },

    updateRoadEvent: function(rdev) {
      var self = this;
      if (rdev.mapOverlays && rdev.mapOverlays.length) {
        // Delete any existing overlays
        _.each(rdev.mapOverlays, function(overlay) {
          self.removeOverlay(overlay);
        });
      }
      rdev.mapOverlays = [];
      var geom = rdev.get('geometry');
      if (geom) {
        rdev.mapOverlays = this.getOverlaysFromGeoJSON(geom);
        _.each(rdev.mapOverlays, function(overlay) {
          self.addOverlay(overlay, {
            click: function() { rdev.select(); }
          });
        });
      }
    },

    addRoadEvent: function(rdev) {
      rdev.on('change:geometry', this.updateRoadEvent, this);
      this.updateRoadEvent(rdev);
    }

  });

  O5.views.BaseMapView = BaseMap;
})();