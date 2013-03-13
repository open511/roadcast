(function() {
	var FilterView = O5.views.BaseView.extend({

		className: "mappane-filter",

		render: function() {
			this.$el.html(JST.filter_widget());
			var self = this;
			this.$el.find('button').click(function(e) {
				e.preventDefault();
				self.openDialog();
			});

			this.filterHistory = [this.app.activeFilter];
		},

		renderBadge: function() {
			var count = _.keys(this.app.activeFilter.filterState).length;
			if (count) {
				this.$el.find('.filter-count').text(count);
			}
			else {
				this.$el.find('.filter-count').text('');
			}
		},

		renderWidget: function(type, initialValue) {
			var $widget = $('<input type="text">'); // for now
			if (initialValue) {
				$widget.val(initialValue);
			}
			return $widget;
		},

		renderRow: function(type, initialValue) {
			var $row = $(JST.filter_widget_item());
			if (type) {
				$row.find('th.name').text(O5.FILTERS[type].name);
				$row.find('td.value').append(this.renderWidget(type, initialValue));
			}
			else {
				var $select = $('<select><option /></select>');
				_.each(O5.FILTERS, function(f, key) {
					$select.append($('<option />').attr('value', key).text(f.name));
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
				$row.find('td.value').empty().append(self.renderWidget(val));
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
					self.$dialog.modal('hide');
				});

		},

		getDialogFilters: function() {
			var filters = {};
			_.each(this.$dialog.find('tr'), function(tr) {
				var key = $(tr).find('.name select').val();
				var val = $(tr).find('.value input').val();
				if (key && val && key.length && val.length) {
					filters[key] = val;
				}
			});
			return filters;
		},

		updateFilters: function(newState) {
			// we're gonna cheat here for now
			var filteredSet = new O5.prototypes.FilteredSet({
				app: this.app,
				events: O5.events.models
			});
			filteredSet.addFilters(newState);
			filteredSet.setVisibility();
			this.app.activeFilter = filteredSet;
			this.renderBadge();
		},

		openDialog: function() {
			var self = this;
			if (!this.$dialog) {
				this.$dialog = $('<div id="filterModal" class="modal hide fade" tabindex="-1" role="dialog" aria-hidden="true" />');
				$('body').append(this.$dialog);
				this.initializeDialogEvents();
			}
			this.$dialog.html(JST.filter_widget_dialog());
			_.each(this.app.activeFilter.filterState, function(val, type) {
				self.$dialog.find('table').append(self.renderRow(type, val));
			});
			self.$dialog.find('table').append(self.renderRow());
			this.$dialog.modal();
		}
	});

	O5.views.FilterView = FilterView;
})();