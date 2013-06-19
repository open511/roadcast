O5.widgets.roads = O5.widgets.BaseWidget.extend({

	addLabel: false,

	className: 'road-edit-widget',

	render: function() {
		var html = '';
		if (this.val) {
			_.each(this.val, function(row) {
				html += JST.road_edit_widget_row({r: row});
			});
		}
		html += '<a class="add-row">+</a>';
		this.$el.html(html);
	},

	getVal: function() {
		var roads = [];
		this.$el.find('.road-fields').each(function() {
			var road = {};

			if (!$(this).find('.road-name').val().length) {
				return;
			}
			road.road_name = $(this).find('.road-name').val();

			if ($(this).find('.road-from').val()) {
				road.from = $(this).find('.road-from').val();
			}

			if ($(this).find('.road-to').val()) {
				road.to = $(this).find('.road-to').val();
			}

			roads.push(road);
		});
		return roads;
	},

	initialize: function() {
		var self = this;
		this.$el.on('click', '.add-row', function(e) {
			e.preventDefault();
			self.$el.find('.add-row').before(JST.road_edit_widget_row({r: {}}));
		});
		this.render();
	},

	setVal: function(val) {
		this.val = val;
		this.render();
	}

});