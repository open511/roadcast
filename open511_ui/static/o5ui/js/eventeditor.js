(function() {
	O5.views = O5.views || {};

	var BaseWidget = Backbone.View.extend({
		setVal: function(val) {
			this.$el.val(val);
		}
	});

	var widgets = {
		textarea: BaseWidget.extend({
			tagName: 'textarea'
		}),

		text: BaseWidget.extend({
			tagName: 'input',
			initialize: function() {
				this.$el.attr('type', 'text');
			}
		}),

		select: BaseWidget.extend({
			tagName: 'select',
			initialize: function() {
				var $el = this.$el;
				_.each(this.options.field.choices, function(choice) {
					$el.append($('<option />').attr('name', choice[0]).text(choice[1]));
				});
			}
		})
	};

	var getWidget = function(field) {
		var wc;

		var field_id = 'field_' + field.name + '_' + Math.floor(Math.random() * 99999);

		if (field.widget) {
			wc = widgets[field.widget];
		}
		else if (field.type === 'text') {
			wc = widgets.textarea;
		}
		else if (field.type === 'enum' && field.choices) {
			wc = widgets.select;
		}
		else {
			wc = widgets.text;
		}
		
		return new wc({
			id: field_id,
			field: field
		});
	};

	O5.views.EventEditorView = Backbone.View.extend({

		roadEvent: null,

		selectEvent: function(event) {
			this.roadEvent = event;
			this.render();
		},

		initialize: function() {
			var $el = this.$el;
			// Tab navigation
			$el.on('click', 'li[data-tab]', function(e) {
				e.preventDefault();
				$el.find('ul.nav li').removeClass('active');
				$(this).addClass('active');
				var tab = $(this).data('tab');
				$el.find('.fields div[data-tab]').each(function() {
					var $this = $(this);
					if ($this.data('tab') === tab) {
						$this.show();
					}
					else {
						$this.hide();
					}
				});
			});

		},

		render: function() {
			var self = this;
			var $e = $(JST["event_editor"]({r: self.roadEvent}));
			var $fields = $e.find('.fields');
			this.widgets = [];
			_.each(O5.RoadEventFields, function(field) {
				var $field_el = $('<div class="field" />');
				var widget = getWidget(field);
				$field_el.attr('data-tab', field.tab)
					.append($('<label for="' + widget.id + '" />').text(field.label));
				self.widgets.push(widget);
				$field_el.append(widget.el);
				if (self.roadEvent && self.roadEvent.get(field.name)) {
					widget.setVal(self.roadEvent.get(field.name));
				}
				$fields.append($field_el);
			});
			self.$el.empty().append($e);
			$e.find('ul.nav li[data-tab="basics"]').click();
		}

	});

})();