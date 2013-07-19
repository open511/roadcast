(function() {

	var icons = {};

	var overlaysToRemove = [],
		overlaysToAdd = [];

	var Map = O5.views.BaseMapView.extend({

		initialize: function() {
			O5.views.BaseMapView.prototype.initialize.call(this);

			this.options.lineStyle = {
				// translate to leaflet
				color: this.options.lineStyle.strokeColor
				// fill: this.options.lineStyle.fillColor
			};
			this.options.selectedLineStyle = {
				color: this.options.selectedLineStyle.strokeColor
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

			var defaultTiles = {
				url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
				subdomains: '1234',
				attribution: O5._t('Tiles from <a href="http://open.mapquest.com/" target="_blank">MapQuest</a>, data from <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
			};

			var tiles = this.app.settings.mapTiles || defaultTiles;
			if (!_.isArray(tiles)) tiles = [tiles];
			_.each(tiles, function(tile) {
				var opts = _.extend({
					// default tile options
					opacity: 0.5
				}, tile);
				var url = opts.url;
				delete opts.url;
				L.tileLayer(url, opts).addTo(lmap);
			});

			this.app.on('layout-map-resize', function() {
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

					return new L.DivIcon({
						html: '<span>' + childCount + '</span>',
						className: 'marker-cluster',
						iconSize: null
					});
				}
			});
			lmap.addLayer(this.clusterLayer);

			this.highlightLayer = new L.LayerGroup();
			lmap.addLayer(this.highlightLayer);

			// window.lmap = this.lmap;
		},

		geoJSONToVector: function(gj) {
			var layer = L.GeoJSON.geometryToLayer(gj);
			layer.setStyle(this.options.lineStyle);
			return layer;
		},

		getMarker: function(coords, rdev) {
			return L.marker([coords[1], coords[0]], {
				icon: null
			});
		},

		removeOverlay: function(overlay) {
			if (overlaysToAdd.length) this._processOverlayQueuesNow();
			overlaysToRemove.push(overlay);
			if (overlay._highlight_marker) {
				this.highlightLayer.removeLayer(overlay._highlight_marker);
				delete overlay._highlight_marker;
			}
			this._processOverlayQueues();
		},

		addOverlay: function(overlay, events) {
			if (overlaysToRemove.length) this._processOverlayQueuesNow();
			overlaysToAdd.push(overlay);
			if (events) {
				_.each(events || {}, function(callback, event) {
					overlay.on(event, callback);
				});
			}
			this._processOverlayQueues();
		},

		'_processOverlayQueuesNow': function() {
			if (overlaysToRemove.length) {
				this.clusterLayer.removeLayers(overlaysToRemove);
				overlaysToRemove = [];
			}
			if (overlaysToAdd.length) {
				this.clusterLayer.addLayers(overlaysToAdd);
				overlaysToAdd = [];
			}
		},

		setOverlayVisibility: function(overlay, visible) {
			if (visible) {
				this.addOverlay(overlay);
			}
			else {
				this.removeOverlay(overlay);
			}
		},

		updateOverlayIcon: function(overlays, iconType) {
			if (overlays.marker) {
				var icon = this._getIcon(iconType);
				var marker = overlays.marker;
				marker.setIcon(icon);
				marker.setZIndexOffset(iconType === 'selected' ? 1000 : 0);
				if (iconType === 'selected' && !marker._highlight_marker) {
					marker._highlight_marker = new L.Marker(marker.getLatLng(), {
						icon: icon
					});
					this.highlightLayer.addLayer(marker._highlight_marker);
				}
				else if (iconType !== 'selected' && marker._highlight_marker) {
					this.highlightLayer.removeLayer(marker._highlight_marker);
					delete marker._highlight_marker;
				}
			}
			if (overlays.vector) {
				overlays.vector.setStyle(iconType === 'selected' ? this.options.selectedLineStyle : this.options.lineStyle);
			}
		},

		_getIcon: function(type) {
			if (!icons[type]) {
				icons[type] = new L.DivIcon({
					className: 'map-marker' + ' ' + type,
					iconSize: null,
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

	Map.prototype._processOverlayQueues = _.debounce(Map.prototype._processOverlayQueuesNow, 2);

	O5.views.MapView = Map;
})();