(function() {
	/**
	 * The UI -- button and dialog box -- for filtering events.
	 */
	var FilterView = O5.views.BaseView.extend({

		className: "filter-button nav-button",

		dialogOpen: false,

		widgets: {},

		filterState: {},

		render: function() {
			this.$el.html(JST.filter_navbar_button());
			var self = this;
			this.app.layout.$el.on('click', '.filter-button',
				// we bind to the main app element so that we can suppress
				// this click more easily elsewhere, for touch-related situations
				function(e) {
					e.preventDefault();
					if (!self.dialogOpen) {
						self.openDialog();
						e.stopPropagation();
					}
				} // , 350, true)
			);

		},

		renderBadge: function() {
			var count = _.keys(this.filterState).length;
			if (this.filterState.status === 'ACTIVE') {
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
			if (this.widgets[type]) {
				throw Exception("Widget type " + type + "already exists");
			}
			var filter = this.app.FILTERS[type],
				wc = O5.widgets.text;
			if (filter.widget) {
				wc = O5.widgets[filter.widget];
			}
			var widget_opts = _.extend({ app: this.app }, filter);
			var widget = new wc(widget_opts);
			if (initialValue) {
				widget.setVal(initialValue);
			}
			this.widgets[type] = widget;

			var self = this;
			widget.on('change', function() {
				self.filterState[type] = widget.getVal();
				_.defer(function() { self.updateFilters(); });
			});

			$row.attr('data-filtertype', type).find('.name').empty()
				.append($('<span />').text(this.app.FILTERS[type].label));
			$row.find('.value').empty().append(widget.el);
			if (type === 'status') $row.find('.close').hide();

			if (_.keys(this.app.FILTERS).length === _.keys(this.widgets).length) {
				this.$filters.addClass('full');
			}
			return widget;
		},

		renderRow: function(type, initialValue) {
			var $row = $(JST.filter_widget_item());
			if (type) {
				this.renderWidget($row, type, initialValue);
			}
			else {
				$row.addClass('empty');
				var ghostSelect = new O5.utils.GhostSelect({
					app: this.app,
					$target: $row.find('a.button'),
					choices: []
				});
			}
			return $row;
		},

		initializeDialogEvents: function() {
			var self = this;
			this.$dialog
				.on('change', '.name select', function(e) {
					// Filter selected: initialize widget
					var val = $(e.target).val();
					if (!val) return;
					var $row = $(e.target).closest('.filter');
					$row.removeClass('empty');
					var $filters = $row.closest('.filters');
					if (!$filters.find('.empty').length) {
						$filters.append(self.renderRow());
					}
					self.renderWidget($row, val);
				})
				.on('click', '.close', function(e) {
					// Remove a filter
					e.preventDefault();
					var $row = $(e.target).closest('.filter');
					var filterType = $row.attr('data-filtertype');
					if (filterType) {
						self.widgets[filterType].off();
						delete self.widgets[filterType];
						delete self.filterState[filterType];
						self.updateFilters();
						self.$filters.removeClass('full');
					}
					$row.fadeOut(300, function() {
						$row.remove();
					});
				})
				.on('focus', '.name select', function() {
					// We generate the list of options for the filter-type
					// select box only as it's clicked, since the options
					// change based on what other filters you've chosen
					// (each filter can only be set once)
					var $select  = $(this);
					$select.empty().append('<option />');
					_.each(self.app.FILTERS, function(f, key) {
						if (!self.widgets[key]) $select.append($('<option />').attr('value', key).text(f.label));
					});
				});

		},

		updateFilters: function() {
			this.app.filterManager.setFilters(this.filterState);
			this.renderBadge();
		},

		renderDialog: function() {
			this.$dialog = $('<div id="filter-dropdown" class="dropdown-menu dropdown-caret filter-dialog"><div class="filters" /></div>');
			this.app.layout.$el.append(this.$dialog);
			this.$dialog.offset(this.$el.offset());
			this.$filters = this.$dialog.find('.filters');
			this.initializeDialogEvents();

			var self = this;
			this.filterState = this.app.filterManager.getCurrentFilters();
			_.each(this.filterState, function(val, type) {
				self.$filters.append(self.renderRow(type, val));
			});

			// and a blank row
			this.$filters.append(this.renderRow());

		},

		openDialog: function() {
			if (!this.$dialog) this.renderDialog();
			this.$dialog.show();
			var self = this;
			var click_outside = function(e) {
				if (!$(e.target).closest('.filter-dialog').length) {
					$(document).off('click', click_outside);
					self.closeDialog();
				}
			};
			$(document).on('click', click_outside);
			this.dialogOpen = true;
		},

		closeDialog: function() {
			this.$dialog.hide();
			this.dialogOpen = false;
		}
	});

	O5.views.FilterView = FilterView;
})();