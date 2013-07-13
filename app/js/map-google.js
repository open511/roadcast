(function() {

	var Map = O5.views.BaseMapView.extend({

		render: function() {

			var mapOptions = {
				center: new google.maps.LatLng(this.options.startLat, this.options.startLng),
				zoom: this.options.startZoom,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				panControl: false,
				zoomControl: false,
				mapTypeControl: false,
				streetViewControl: false,
				overviewMapControl: false,
				zoomControlOptions: {
					 style: google.maps.ZoomControlStyle.SMALL
				}

			};
			this.gmap = new google.maps.Map(this.el, mapOptions);

			var iconopts = {
				url: this.options.markerOpts.icon
			};
			if (this.options.markerOpts.iconAnchor) {
				iconopts.anchor = new google.maps.Point(this.options.markerOpts.iconAnchor[0], this.options.markerOpts.iconAnchor[1]);
			}
			this.markerIcon = iconopts;

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
						icon: this.markerIcon
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


		geoJSONToVector: function(gj) {
			switch (gj.type) {
				case 'LineString':
					var path = _.map(gj.coordinates, function(c) {
						return new google.maps.LatLng(c[1], c[0]);
					});
									
					var line = new google.maps.Polyline({path: path});
					line.setOptions(this.options.lineStyle);
					return line;
				case 'Polygon':
					return O5.utils.geoJSONToGoogle(gj, this.options.lineStyle);
			}
		},

		getMarker: function(coords) {
			return new google.maps.Marker({
				position: new google.maps.LatLng(coords[1], coords[0]),
				icon: this.markerIcon
			});
		},

		removeOverlay: function(overlay) {
			overlay.setMap(null);
		},

		addOverlay: function(overlay, events) {
			overlay.setMap(this.gmap);
			_.each(events || {}, function(callback, event) {
				google.maps.event.addListener(overlay, event, callback);
			});
		},

		setOverlayVisibility: function(overlay, visible) {
			overlay.setVisible(visible);
		},

		zoom: function(delta) {
			this.gmap.setZoom(this.gmap.getZoom() + delta);
		}

	});

	O5.views.MapView = Map;

})();