(function() {

	var icons = {};

	var Map = O5.views.BaseMapView.extend({

		initialize: function() {
			O5.views.BaseMapView.prototype.initialize.call(this);

			this.options.lineStyle = {
				// translate to leaflet
				color: this.options.lineStyle.strokeColor
				// fill: this.options.lineStyle.fillColor
			};
		},

		render: function() {
			var mapOptions = {
				center: [this.options.startLat, this.options.startLng],
				zoom: this.options.startZoom,
				zoomControl: false,
				attributionControl: false
			};
			var lmap = L.map(this.el, mapOptions);
			this.lmap = lmap;

			L.control.attribution({
				position: 'bottomleft',
				prefix: ''
			}).addTo(lmap);

			L.tileLayer(this.app.settings.mapTileURL || 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
				this.app.settings.mapTileOptions || {
				minZoom: 1,
				maxZoom: 19,
				subdomains: '1234',
				attribution: O5._t('Tiles courtesy of') + ' <a href="http://open.mapquest.com/" target="_blank">MapQuest</a>',
				opacity: 0.5
			}).addTo(lmap);

			this.app.on('layout-draw', function() {
				lmap._onResize(); // I can't see a way to do this without using a private method
			});

			this.clusterLayer = new L.MarkerClusterGroup({
				showCoverageOnHover: false,
				maxClusterRadius: 50,
				iconCreateFunction: function (cluster) {
					var childCount = cluster.getChildCount();

					// var c = ' marker-cluster-';
					// if (childCount < 50) {
					// 	c += 'small';
					// } else if (childCount < 40) {
					// 	c += 'medium';
					// } else {
					// 	c += 'large';
					// }

					return new L.DivIcon({ html: '<span>' + childCount + '</span>', className: 'marker-cluster', iconSize: [] });
				}
			});
			lmap.addLayer(this.clusterLayer);

			// window.lmap = this.lmap;
		},

		geoJSONToVector: function(gj) {
			var layer = L.GeoJSON.geometryToLayer(gj);
			layer.setStyle(this.options.lineStyle);
			return layer;
		},

		getMarker: function(coords, rdev) {
			return L.marker([coords[1], coords[0]], {
				icon: this._getIcon([this.getIconType(rdev)])
			});
		},

		removeOverlay: function(overlay) {
			this.lmap.removeLayer(overlay);
		},

		addOverlay: function(overlay, events) {
			// this.lmap.addLayer(overlay);
			this.clusterLayer.addLayer(overlay);
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

		updateMarkerIcon: function(marker, iconType) {
			marker.setIcon(this._getIcon(iconType));
			marker.setZIndexOffset(iconType === 'selected' ? 1000 : 0);
		},

		_getIcon: function(type) {
			if (!icons[type]) {
				icons[type] = new L.DivIcon({
					className: 'map-marker' + ' ' + type,
					iconSize: [],
					iconAnchor: this.options.markerOpts.iconAnchor
				});
			}
			return icons[type];
		},

		initializeDrawing: function() {
			if (!this.drawingHandlers) {
				this.drawingHandlers = {
					point: new L.Draw.Marker(this.lmap, {
						icon: this._getIcon('default')
					}),
					line: new L.Draw.Polyline(this.lmap)
					// polygon: new L.Draw.Polygon(this.lmap)
				};

				var self = this;

				this.lmap.on('draw:created', function(e) {
					var gj = e.layer.toGeoJSON();
					if (gj.type === "Feature") {
						gj = gj.geometry;
					}
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
		},

		panToMarker: function(marker) {
			this.lmap.panTo(marker.getLatLng());
		}

	});

	O5.views.MapView = Map;
})();