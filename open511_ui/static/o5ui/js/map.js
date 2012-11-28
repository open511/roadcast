(function() {
	var Map = Backbone.View.extend({

		initialize: function() {
			_.defaults(this.options, {
				startLat: 45.532411,
				startLng: -73.61512,
				startZoom: 10,
				markerOpts: {
					icon: O5.staticURL + 'o5ui/img/cone-small-1.png'
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
			window.gmap = this.gmap;

		},

		initializeDrawing: function() {
			this.drawingManager = new google.maps.drawing.DrawingManager({
		//		drawingControl: false
			});
			this.drawingManager.setMap(this.gmap);
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
	
		addRoadEvent: function(rdev) {
			var self = this;
			_.each(self.getOverlaysFromGeoJSON(rdev.get('geometry')), function(overlay) {
				overlay.setMap(self.gmap);
				google.maps.event.addListener(overlay, 'click', function() {
					rdev.navigateTo();
				});
			});
		}
	});

	O5.views.MapView = Map;

})();