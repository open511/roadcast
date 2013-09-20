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
			o[this.options.name] = this.getVal();
			return o;
		},

		// Should return true if the field is valid, an error message if not.
		checkValidation: function(opts) {
			if (this.options.required && !this.getVal()) {
				return O5._t("This field is required");
			}
			if (this.options.validate) {
				return this.options.validate(this.getVal(), opts);
			}
			return true;
		},

		// Displays the provided validation error; if message is null, clears
		// validation errors.
		displayValidationError: function(message) {
			var $container = this.$el.closest('.field');
			$container.find('.validation-error').remove();
			if (message) {
				$container.addClass('error');
				var $msg = $('<span class="emphasized-note error validation-error" />');
				$msg.text(message);
				$container.append($msg);
			}
			else {
				$container.removeClass('error');
			}
		},

		// Triggers validation, displays an error if necessary, and returns a list
		// of invalid widgets (i.e. [this] or [])
		getInvalidWidgets: function(opts) {
			var result = this.checkValidation(opts);
			if (result === true) {
				this.displayValidationError(null);
				return [];
			}
			else {
				this.displayValidationError(result);
				return [this];
			}
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
		},

		renderEditorField: function() {
			var $field_el = $('<div class="field editor-row" />');
			if (this.options.tab) $field_el.attr('data-tab', this.options.tab);
			$field_el.attr('data-fieldname', this.options.name);
			if (this.addLabel) {
				$field_el.append($('<label for="' + this.id + '" />').text(this.options.label));
			}
			$field_el.append(this.$el);
			this.$field_el = $field_el;
			return $field_el;
		}
	});

	var TextWidget = BaseWidget.extend({
		tagName: 'input',
		initialize: function() {
			BaseWidget.prototype.initialize.call(this);
			this.$el.attr('type', 'text');
			if (this.options.placeholder) this.$el.attr('placeholder', this.options.placeholder);
		}
	});

	var widgets = {

		BaseWidget: BaseWidget,

		text: TextWidget,

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
					'-webkit-box-sizing': 'border-box',
					'-moz-box-sizing': 'border-box',
					'box-sizing': 'border-box',
					'line-height': '20px',
					'padding': '4px 6px',
					'border-width': '1px',
					'height': '30px'
				});
				if (this.options.placeholder) this.$el.attr('placeholder', this.options.placeholder);
				this.on('change changeActivity', this.resize, this);
			},

			setVal: function() {
				BaseWidget.prototype.setVal.apply(this, arguments);
				this.resize();
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
				var choices = this.options.choices;
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
				this.$el.find('label').text(this.options.label);
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

		date: TextWidget.extend({
			initialize: function() {
				TextWidget.prototype.initialize.call(this);
				var self = this;
				this.$el.datepicker({
					format: 'yyyy-mm-dd'
				}).on('changeDate', function(e) {
					$(this).datepicker('hide');
					self.trigger('change');
				});
			},

			setVal: function(val) {
				TextWidget.prototype.setVal.call(this, val);
				this.$el.datepicker('update');
			}
		}),

		time: TextWidget.extend({
			time: null,

			getVal: function() {
				if (!this.time) return '';
				return this._pad(this.time[0]) + ':' + this._pad(this.time[1]);
			},

			_pad: function(n) {
				return (n < 10) ? ("0" + n) : n;
			},

			setVal: function(val) {
				val = val.toLowerCase();
				if (val === 'noon') {
					this.time = [12, 0];
				}
				else if (val === 'midnight') {
					this.time = [0, 0];
				}
				else {
					var match = /^\s*([012]?\d)(:[0-5]\d)?\s*([ap]\.?[m])?\s*$/.exec(val);
					if (match) {
						var hrs = parseInt(match[1], 10);
						var mins = parseInt((match[2] || '').substring(1), 10) || 0;
						var ampm = match[3] || '';
						if (ampm.substring(0, 1) === 'a' && hrs === 12) {
							hrs = 0;
						}
						else if (ampm.substring(0, 1) === 'p' && hrs < 12) {
							hrs += 12;
						}
						if (hrs || hrs === 0) {
							this.time = [hrs, mins];
						}
						else {
							this.time = null;
						}
					}
					else {
						this.time = null;
					}
				}

				this.displayVal();
			},

			displayVal: function() {
				this.$el.val(O5.utils.formatTime(this.getVal()));
			},

			onChange: function() {
				var prevVal = this.getVal();
				this.setVal(this.$el.val());
				if (this.getVal() !== prevVal) TextWidget.prototype.onChange.call(this);
			}
		}),

		multitoggle: BaseWidget.extend({

			className: 'multi-toggle-widget',

			initialize: function() {
				BaseWidget.prototype.initialize.call(this);
				var $el = this.$el;
				var self = this;
				this.choices = this.getChoices();
				_.each(this.choices, function(choice) {
					$el.append($(document.createElement('span'))
						.attr('class', 'label')
						.attr('data-value', choice[0])
						.text(choice[1]));
				});
				$el.on('click', 'span', function(e) {
					$(this).toggleClass('selected');
					self.onChange();
				});
			},

			getVal: function() {
				return _.map(this.$el.find('span.selected'), function(span) {
					return span.getAttribute('data-value');
				});
			},

			setVal: function(vals) {
				this.$el.find('span.selected').removeClass('selected');
				if (!vals) return;
				for (var i = 0; i < vals.length; i++) {
					this.$el.find('span[data-value="' + vals[i] + '"]').addClass('selected');
				}
			},

			getChoices: function() {
				var choices = this.options.choices;
				return _.isFunction(choices) ? choices() : choices;
			}

		})

	};

	O5.widgets = widgets;
})();