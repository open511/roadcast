(function() {
	/**
	 * The UI -- button and dialog box -- for filtering events.
	 */
	var FilterView = O5.views.BaseView.extend({

		className: "mainpane-filter",

		render: function() {
			this.$el.html(JST.filter_widget());
			var self = this;
			this.$el.find('a').click(function(e) {
				e.preventDefault();
				self.openDialog();
			});

		},

		renderBadge: function() {
			var filters = this.app.filterManager.getCurrentFilters();
			var count = _.keys(filters).length;
			if (filters.status === 'ACTIVE') {
				// We consider this the default, don't show a badge
				count -= 1;
			}
			if (count) {
				this.$el.find('.filter-count').text(count).removeClass('empty');
			}
			else {
				this.$el.find('.filter-count').text('').addClass('empty');
			}
		},

		renderWidget: function($row, type, initialValue) {
			var filter = O5.FILTERS[type],
				wc = O5.widgets.text;
			if (filter.widget) {
				wc = O5.widgets[filter.widget];
			}
			var widget = new wc({
				filterType: type,
				field: filter
			});
			if (initialValue) {
				widget.setVal(initialValue);
			}
			$row.find('td.value').empty().data('widget', widget).append(widget.el);
			return widget;
		},

		renderRow: function(type, initialValue) {
			var $row = $(JST.filter_widget_item());
			if (type) {
				$row.find('th.name').text(O5.FILTERS[type].label).attr('data-filtertype', type);
				this.renderWidget($row, type, initialValue);
				if (type === 'status') {
					$row.find('.closecol').hide();
				}
			}
			else {
				var $select = $('<select><option /></select>');
				_.each(O5.FILTERS, function(f, key) {
					$select.append($('<option />').attr('value', key).text(f.label));
				});
				$row.find('th.name').append($select);
				$row.addClass('empty');
			}
			return $row;
		},

		initializeDialogEvents: function() {
			var self = this;
			this.$dialog.on('change', '.name select', function(e) {
				var val = $(e.target).val();
				var $row = $(e.target).closest('tr');
				$row.removeClass('empty');
				var $table = $row.closest('table');
				if (!$table.find('tr.empty').length) {
					$table.append(self.renderRow());
				}
				self.renderWidget($row, val);
			})
				.on('click', 'tr .close', function(e) {
					e.preventDefault();
					var $row = $(e.target).closest('tr');
					$row.fadeOut(300, function() {
						$row.remove();
					});
				})
				.on('click', '.update-filters', function(e) {
					e.preventDefault();
					self.updateFilters(self.getDialogFilters());
					self.$dialog.hide();
				})
				.on('click', 'button.close-dialog', function(e) {
					e.preventDefault();
					self.$dialog.hide();
				});

		},

		getDialogFilters: function() {
			var filters = {};
			_.each(this.$dialog.find('td.value'), function(td) {
				var widget = $(td).data('widget');
				if (widget) {
					var key = widget.options.filterType;
					var val = widget.getVal();
					if (val && val.length) {
						filters[key] = val;
					}
				}
			});
			return filters;
		},

		updateFilters: function(newState) {
			this.app.filterManager.setFilters(newState);
			this.renderBadge();
		},

		openDialog: function() {
			var self = this;
			if (!this.$dialog) {
				this.$dialog = $('<div id="filterModal" style="display:none" class="modal hide fade" tabindex="-1" role="dialog" aria-hidden="true" />');
				this.app.layout.$el.append(this.$dialog);
				this.initializeDialogEvents();
			}
			this.$dialog.html(JST.filter_widget_dialog());
			_.each(this.app.filterManager.getCurrentFilters(), function(val, type) {
				self.$dialog.find('table').append(self.renderRow(type, val));
			});
			self.$dialog.find('table').append(self.renderRow());
			// this.$dialog.modal();
			this.$dialog.show();
		}
	});

	O5.views.FilterView = FilterView;
})();