(function() {
	O5.views.BaseMapView = O5.views.BaseView.extend({

		name: "map",

		className: 'map-view',

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);
			_.defaults(this.options, {
				startLat: this.app.settings.mapStartLat || 45.532411,
				startLng: this.app.settings.mapStartLng || -73.61512,
				startZoom: this.app.settings.mapStartZoom || 10,
				markerOpts: {
					icon: this.app.settings.staticURL + 'o5ui/img/marker-triangle-orange.png',
					iconAnchor: [15,15]
				},
				lineStyle: {
					strokeColor: "#F27739"
				},
				selectedLineStyle: {
					strokeColor: "#57898C"
				}
			});
			this.$el.css('width', '100%').css('height', '100%');
			var self = this;
			$('.mainpane-zoom-in').click(function(e) {
				e.preventDefault();
				self.zoom(1);
			});
			$('.mainpane-zoom-out').click(function(e) {
				e.preventDefault();
				self.zoom(-1);
			});

			this.app.on('selection', function(roadEvent, opts) {
				if (opts.panTo && roadEvent.mapOverlays && roadEvent.mapOverlays.marker) {
					self.panToMarker(roadEvent.mapOverlays.marker);
				}
			});

			this.app.events.on('add change:geography change:id', this.updateRoadEvent, this)
				.on('remove', this.removeRoadEventOverlays, this)
				.on('change:_visible', this.updateRoadEventVisibility, this)
				.on('change:_selected change:_highlighted change:status', this.updateRoadEventIcon, this);

		},

		/**
		* Returns an array of overlays to add to the map based on the provided GeoJSON object. 
		*/
		getOverlaysFromGeoJSON: function(gj, rdev) {
			var coords = gj['coordinates']
			switch (gj.type) {
				case 'Point':
					return {
						marker: this.getMarker(coords, rdev)
					}
				case 'LineString':
					// First, the polyline
					var line = this.geoJSONToVector(gj);
					
					// And then a marker at the middle
					var marker = this.getMarker(coords[Math.floor(coords.length/2)], rdev);
					
					return {
						marker: marker,
						vector: line
					}
				case 'Polygon':
					var gon = this.geoJSONToVector(gj);
					var marker = this.getMarker(coords[0], rdev);
					return {
						marker: marker,
						vector: gon
					}
				default:
					alert("Invalid geometry type: " + gj.type);
			}
		},

		updateRoadEvent: function(rdev) {
			var self = this;
			this.removeRoadEventOverlays(rdev);
			var geom = rdev.get('geography');
			if (geom) {
				rdev.mapOverlays = this.getOverlaysFromGeoJSON(geom, rdev);
				if (rdev.mapOverlays.marker) this.updateRoadEventIcon(rdev);
				_.each(rdev.mapOverlays, function(overlay) {
					var events = {};
					if (rdev.id) events.click = function() { rdev.select(); };
					self.addOverlay(overlay, events);
				});
			}
			if (!rdev.get('_visible')) {
				this.updateRoadEventVisibility(rdev);
			}
		},

		removeRoadEventOverlays: function(rdev) {
			var self = this;
			if (rdev.mapOverlays) {
				_.each(rdev.mapOverlays, function(overlay) {
					self.removeOverlay(overlay);
				});
			}
			rdev.mapOverlays = null;
		},

		updateRoadEventVisibility: function(rdev) {
			var visible = rdev.get('_visible');
			var self = this;
			_.each(rdev.mapOverlays, function(overlay) {
				self.setOverlayVisibility(overlay, visible);
			});
		},

		updateRoadEventIcon: function(rdev) {
			if (rdev.mapOverlays && rdev.mapOverlays.marker) {
				this.updateOverlayIcon(rdev.mapOverlays, this.getIconType(rdev));
			}
		},

		getIconType: function(rdev) {
			if (rdev.get('_selected') || rdev.get('_highlighted')) {
				return 'selected';
			}
			else if (rdev.get('status') === 'ARCHIVED') {
				return 'archived';
			}
			return 'default';
		}

	});

})();