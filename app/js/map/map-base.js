(function() {

	var IconType = function(types) {
		this.types = types;
	};

	_.extend(IconType.prototype, {

		getClassString: function() {
			return this.types.join(' ');
		},

		isSelected: function() {
			return _.indexOf(this.types, 'selected') !== -1;
		}

	});


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

			this.app.on('display', function(roadEvent, opts) {
				if (opts.panTo && roadEvent.mapOverlays && roadEvent.mapOverlays.marker) {
					self.panToMarker(roadEvent.mapOverlays.marker);
				}
			});

			this.app.events.on('add change:geography change:id', this.updateRoadEvent, this)
				.on('remove', this.removeRoadEventOverlays, this)
				.on('internalChange:visible internalChange:selected', this.updateRoadEventVisibility, this)
				.on('internalChange:selected internalChange:highlighted change:status', this.updateRoadEventIcon, this);

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
					var midpoint = null;
					if (coords.length % 2 === 1) {
						midpoint = coords[Math.floor(coords.length / 2)];
					}
					else {
						var a = coords[(coords.length / 2) - 1],
							b = coords[coords.length / 2];
						midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
					}
					var marker = this.getMarker(midpoint, rdev);
					
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
			if (!rdev.internal.visible) {
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
			var self = this;
			_.each(rdev.mapOverlays, function(overlay) {
				self.setOverlayVisibility(overlay, rdev.internal.visible || rdev.internal.selected);
			});
		},

		updateRoadEventIcon: function(rdev) {
			if (rdev.mapOverlays && rdev.mapOverlays.marker) {
				this.updateOverlayIcon(rdev.mapOverlays, this.getIconType(rdev));
			}
		},

		getIconType: function(rdev) {
			var types = [];
			if (rdev.internal.selected || rdev.internal.highlighted) {
				types.push('selected');
			}
			else if (rdev.get('status') === 'ARCHIVED') {
				types.push('archived');
			}
			var type = rdev.get('event_type'),
				today = rdev.parseSchedule().inEffectOn();
			if (type === 'CONSTRUCTION') {
				types.push('construction');
			}
			else {
				types.push('not-construction');
			}
			types.push('severity-' + (rdev.get('severity') || 'MODERATE').toLowerCase());
			if (today) {
				types.push('today');
			}
			else {
				types.push('not-today');
			}
			if (rdev.get('!unpublished')) types.push('unpublished');
			return new IconType(types);
		}

	});

})();