(function() {

	var ExceptionWidget = O5.editor.FieldGroup.extend({

		getVal: function() {
			var orig = O5.editor.FieldGroup.prototype.getVal.call(this);
			if (!orig.date) return null;
			var val = orig.date;
			_.each(orig.times || [], function(times) {
				if (times.start_time && times.end_time) {
					val += ' ' + times.start_time + '-' + times.end_time;
				}
			});
			return { exception: val};
		},

		setVal: function(val) {
			if (!val) return;
			var bits = val.split(' ');
			var v = {
				date: bits[0],
				times: []
			};
			for (var i = 1; i < bits.length; i++) {
				var time_bits = bits[i].split('-');
				v.times.push({
					start_time: time_bits[0],
					end_time: time_bits[1]
				});
			}
			O5.editor.FieldGroup.prototype.setVal.call(this, v);
		},

	});

	var IntervalWidget = O5.editor.FieldGroup.extend({

		getVal: function() {
			var orig = O5.editor.FieldGroup.prototype.getVal.call(this);
			if (!(orig.start_date && orig.start_time)) return null;
			var val = orig.start_date + 'T' + orig.start_time + '/';
			if (orig.end_date && orig.end_time)
				val += orig.end_date + 'T' + orig.end_time;
			return val
		},

		setVal: function(val) {
			var val_bits = val.split('/');
			if (!val_bits.length) return;
			var dt_bits = val_bits[0].split('T');
			var val_obj = {
				start_date: dt_bits[0],
				start_time: dt_bits[1]
			};
			if (val_bits[1]) {
				dt_bits = val_bits[1].split('T');
				val_obj.end_date = dt_bits[0];
				val_obj.end_time = dt_bits[1];
			}
			O5.editor.FieldGroup.prototype.setVal.call(this, val_obj);
		}

	});

	O5.widgets.schedule = O5.editor.RepeatingFieldGroup.extend({

		initialize: function() {
			delete this.options['widget'];
			O5.editor.RepeatingFieldGroup.prototype.initialize.call(this);
			var initialVal = this.getVal();
			if (initialVal && initialVal.intervals) {
				this.schedType = 'INTERVALS';
			}
			else if (initialVal && initialVal.recurring_schedules) {
				this.schedType = 'RECURRING';
			}
			else {
				this.schedType = 'NONE';
			}
		},

		renderAddRow: function() {
			var $row = $(document.createElement('div')).addClass('add-row');
			var self = this;
			if (this.schedType == 'INTERVALS') {
				$('<a class="button add-intervals"></a>')
					.text(O5._t('+ Interval'))
					.on('click', function() { self.addIntervalRow(); })
					.appendTo($row);
			}
			else {
				$('<a class="button add-recurring" style="float:left"></a>')
					.text(O5._t('+ Recurring'))
					.on('click', function() { self.addRecurringRow(); })
					.appendTo($row);
				if (this.schedType == 'RECURRING') {
					$('<a class="button add-exception" style="float:right"></a>')
						.text(O5._t('+ Exception'))
						.on('click', function() { self.addExceptionRow(); })
						.appendTo($row);
				}
				else {
					$('<a class="button add-intervals" style="float: right"></a>')
						.text(O5._t('+ Interval'))
						.on('click', function() { self.addIntervalRow(); })
						.appendTo($row);
				}
			}
			if (this.$el.find('.add-row').length) {
				return this.$el.find('.add-row').replaceWith($row);
			}
			this.$el.append($row);
		},

		addRecurringRow: function() {
			if (this.schedType !== 'RECURRING') {
				this.schedType = 'RECURRING';
				this.renderAddRow();
			}
			return this.addRow(_.extend({}, this.options, {
				fields: this.options.recurringFields
			}));			
		},

		addExceptionRow: function() {
			return this.addRow(_.extend({}, this.options, {
				fields: this.options.exceptionFields,
				repeating: false,
				widget: ExceptionWidget
			}));
		},

		addIntervalRow: function() {
			if (this.schedType !== 'INTERVALS') {
				this.schedType = 'INTERVALS';
				this.renderAddRow();
			}
			return this.addRow(_.extend({}, this.options, {
				fields: this.options.intervalFields,
				repeating: false,
				widget: IntervalWidget
			}));			
		},

		getVal: function() {
			var orig = O5.editor.RepeatingFieldGroup.prototype.getVal.call(this);
			if (!orig) return orig;
			if (this.schedType == 'RECURRING') {
				var val = {
					recurring_schedules: []
				}
				_.each(orig, function(item) {
					if (item.exception) {
						if (!val.exceptions) val.exceptions = [];
						val.exceptions.push(item.exception)
					}
					else {
						val.recurring_schedules.push(item)
					}
				});
				return val;
			}
			else if (this.schedType == 'INTERVALS') {
				return {
					intervals: orig
				};
			}
		},

		setVal: function(val) {
			this.renderRows(0);
			if (!val) return;
			if (val.intervals) {
				this.schedType = 'INTERVALS';
				for (var i = 0; i < val.intervals.length; i++)
					this.addIntervalRow().setVal(val.intervals[i]);
			}
			else if (val.recurring_schedules) {
				this.schedType = 'RECURRING';
				for (var i = 0; i < val.recurring_schedules.length; i++)
					this.addRecurringRow().setVal(val.recurring_schedules[i])
				if (val.exceptions && val.exceptions.length) {
					for (var i = 0; i < val.exceptions.length; i++)
						this.addExceptionRow().setVal(val.exceptions[i])
				}
			}
			this.renderAddRow()
		}

	});

})();