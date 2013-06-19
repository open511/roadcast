(function() {
	var BaseWidget = Backbone.View.extend({
		addLabel: true,
		setVal: function(val) {
			this.$el.val(val);
		},

		getVal: function() {
			return this.$el.val();
		},

		validate: function() {
			if (this.options.field.validate) {
				return this.options.field.validate(this.getVal());
			}
			if (this.options.field.required && !this.getVal()) {
				return O5._t("This field is required");
			}
			return true;
		},

		events: {
			"change": "onChange",
			"keydown": "onChangeActivity"
		},

		onChange: function() {
			this.trigger('change');
		},

		onChangeActivity: function() {
			this.trigger('changeActivity');
		}
	});

	var widgets = {

		BaseWidget: BaseWidget,

		textarea: BaseWidget.extend({
			tagName: 'textarea',

			resize: function() {
				var val = this.getVal();
				var rows = Math.min((val.length / 40) + val.split('\n').length - 1, 12) + 1;
				this.$el.attr('rows', rows);
			},

			initialize: function() {
				this.$el.attr('rows', 2);
				this.on('change changeActivity', this.resize, this);
			},

			setVal: function() {
				BaseWidget.prototype.setVal.apply(this, arguments);
				this.resize();
			}
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
				var choices = this.options.field.choices;
				if (_.isFunction(choices)) {
					choices = choices();
				}
				_.each(choices, function(choice) {
					$el.append($('<option />').val(choice[0]).text(choice[1]));
				});
			}
		}),

		date: BaseWidget.extend({
			tagName: 'input',
			initialize: function() {
				this.$el.attr('type', 'text');
				this.$el.datepicker({
					format: 'yyyy-mm-dd'
				});
			},
			setVal: function(val) {
				this.$el.val(val);
				this.$el.datepicker('update');
			}
		})

	};

	O5.widgets = widgets;
})();