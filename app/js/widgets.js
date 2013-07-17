(function() {
	var BaseWidget = O5.views.BaseView.extend({
		addLabel: true,
		setVal: function(val) {
			this.$el.val(val);
		},

		getVal: function() {
			return this.$el.val();
		},

		getVals: function() {
			var o = {};
			o[this.options.field.name] = this.getVal();
			return o;
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
				var rows = Math.min(Math.round(val.length / 45) + val.split('\n').length - 1, 12) + 1;
				this.$el.css({
					height: ((rows * 20) + 10) + 'px'
				});
			},

			initialize: function() {
				BaseWidget.prototype.initialize.call(this);
				this.$el.css({
					'webkit-box-sizing': 'border-box',
					'-moz-box-sizing': 'border-box',
					'box-sizing': 'border-box',
					'line-height': '20px',
					'padding': '4px 6px',
					'border-width': '1px',
					'height': '30px'
				});
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
				BaseWidget.prototype.initialize.call(this);
				this.$el.attr('type', 'text');
			}
		}),

		select: BaseWidget.extend({
			tagName: 'select',
			initialize: function() {
				BaseWidget.prototype.initialize.call(this);
				var $el = this.$el;
				this.choices = this.getChoices();
				if (!_.find(this.choices, function(choice) { return choice[0] === '' || choice[0] === null; })) {
					// Ensure there's a blank choice
					$el.append($('<option class="temporary-default" value=""></option>'));
				}
				_.each(this.choices, function(choice) {
					$el.append($('<option />').val(choice[0]).text(choice[1]));
				});
			},

			getChoices: function() {
				var choices = this.options.field.choices;
				return _.isFunction(choices) ? choices() : choices;
			},

			setVal: function(val) {
				if (!_.find(this.choices, function(choice) { return choice[0] === val; })) {
					// throw error?
					return;
				}
				this.$el.val(val);
				this.$el.find('option.temporary-default').remove();
				this.lastVal = val;
			},

			onChange: function() {
				this.$el.find('option.temporary-default').remove();
				BaseWidget.prototype.onChange.call(this);
			}
		}),

		checkbox: BaseWidget.extend({
			addLabel: false,
			tagName: 'div',
			initialize: function() {
				BaseWidget.prototype.initialize.call(this);
				this.boxID = this.id + '-cb';
				this.$el.html('<input class="checkbox" type="checkbox" value="true" id="' + this.boxID + '"> <label for="' + this.boxID + '"></label>');
				this.$el.find('label').text(this.options.field.label);
				this.$el.addClass('checkbox');
				this.box = this.$el.find('input')[0];
			},
			getVal: function() {
				return this.box.checked;
			},
			setVal: function(val) {
				$(this.box).prop('checked', (!val || val.toLowerCase() === 'false') ? false : true);
			}
		}),

		date: BaseWidget.extend({
			tagName: 'input',
			initialize: function() {
				BaseWidget.prototype.initialize.call(this);
				var self = this;
				this.$el.attr('type', 'text');
				this.$el.datepicker({
					format: 'yyyy-mm-dd'
				}).on('changeDate', function(e) {
					$(this).datepicker('hide');
					self.trigger('change');
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