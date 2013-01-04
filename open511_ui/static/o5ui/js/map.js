(function() {
	var markerURL = null;

	var Map = Backbone.View.extend({

		initialize: function() {
			markerURL = O5.staticURL + 'o5ui/img/cone-small-1.png';
			_.defaults(this.options, {
				startLat: 45.532411,
				startLng: -73.61512,
				startZoom: 10,
				markerOpts: {
					icon: markerURL
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

		render: function() {

			var mapOptions = {
				center: new google.maps.LatLng(this.options.startLat, this.options.startLng),
				zoom: this.options.startZoom,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoomControlOptions: {
					style: google.maps.ZoomControlStyle.SMALL
				}
			};
			this.gmap = new google.maps.Map(this.el, mapOptions);
			// DEBUG ONLY
			// window.gmap = this.gmap;

		},

		overlayToGeoJSON: function(type, overlay) {
			if (type === 'marker') {
				var latlng = overlay.getPosition();
				return {
					type: "Point",
					coordinates: [latlng.lng(), latlng.lat()]
				};
			}
			if (type === 'polyline') {
				var latlngs = overlay.getPath().getArray();
				return {
					type: "LineString",
					coordinates: _.map(latlngs, function(ll) { return [ll.lng(), ll.lat()]; })
				};
			}
		},

		initializeDrawing: function() {
			if (!this.drawingManager) {
				var self = this;
				this.drawingManager = new google.maps.drawing.DrawingManager({
					drawingControl: false,
					markerOptions: {
						icon: new google.maps.MarkerImage(markerURL)
					}
				});
				this.drawingManager.setMap(this.gmap);
				google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function(e) {
					var gj = self.overlayToGeoJSON(e.type, e.overlay);
					// Delete the overlay once drawn
					e.overlay.setMap(null);
					self.trigger('draw', gj);
				});
			}
		},

		startDrawing: function(mode, options) {
			var gModes = {
				point: google.maps.drawing.OverlayType.MARKER,
				line: google.maps.drawing.OverlayType.POLYLINE,
				polygon: google.maps.drawing.OverlayType.POLYGON
			};
			this.initializeDrawing();
			// clear existing points?
			this.drawingManager.setDrawingMode(gModes[mode]);
		},

		stopDrawing: function() {
			this.initializeDrawing();
			this.drawingManager.setDrawingMode(null);
		},

		/**
		* Returns an array of overlays to add to the map based on the provided GeoJSON object.
		*/
		getOverlaysFromGeoJSON: function(gj) {
			switch (gj.type) {
				case 'Point':
					var opts = _.clone(this.options.markerOpts);
					opts.position = new google.maps.LatLng(gj.coordinates[1], gj.coordinates[0]);
					return [new google.maps.Marker(opts)];
				case 'LineString':
					var path = _.map(gj.coordinates, function(c) {
						return new google.maps.LatLng(c[1], c[0]);
					});
					
					// First, the polyline
					
					var line = new google.maps.Polyline({path: path});
					line.setOptions(this.options.polylineOpts);
					
					// And then a marker at the middle
					var marker = new google.maps.Marker({
						position: path[Math.floor(path.length/2)]
					});
					marker.setOptions(this.options.markerOpts);
					
					return [line, marker];
				case 'Polygon':
					var gon = O5.utils.geoJSONToGoogle(gj, this.options.polygonOpts);
					var marker = new google.maps.Marker({
						position: gon.getPath().getAt(0)
					});
					marker.setOptions(this.options.markerOpts);
					return [gon, marker];
				default:
					alert("Invalid geometry type: " + gj.type);
			}
		},

		updateRoadEvent: function(rdev) {
			var self = this;
			if (rdev.mapOverlays) {
				// Delete any existing overlays
				_.each(rdev.mapOverlays, function(overlay) {
					overlay.setMap(null);
				});
			}
			var geom = rdev.get('geometry');
			if (geom) {
				rdev.mapOverlays = this.getOverlaysFromGeoJSON(geom);
				_.each(rdev.mapOverlays, function(overlay) {
					overlay.setMap(self.gmap);
					google.maps.event.addListener(overlay, 'click', function() {
						rdev.select();
					});
				});
			}
		},
	
		addRoadEvent: function(rdev) {
			rdev.on('change:geometry', this.updateRoadEvent, this);
			this.updateRoadEvent(rdev);
		}
	});

	O5.views.MapView = Map;

})();