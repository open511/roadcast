(function() {

	var SpecificDatesWidget = O5.editor.FieldGroup.extend({

		getVal: function() {
			var orig = O5.editor.FieldGroup.prototype.getVal.call(this);
			if (!orig.date) return null;
			var val = orig.date;
			_.each(orig.times || [], function(times) {
				if (times.start_time && times.end_time) {
					val += ' ' + times.start_time + '-' + times.end_time;
				}
			});
			return { specific_date: val};
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

	O5.widgets.schedule = O5.editor.RepeatingFieldGroup.extend({

		initialize: function() {
			delete this.options['widget'];
			O5.editor.RepeatingFieldGroup.prototype.initialize.call(this);
		},

		renderAddRow: function() {
			var $row = $(document.createElement('div')).addClass('add-row');
			var self = this;
			$('<a class="button add-recurring" style="float:left"></a>')
				.text(O5._t('+ Recurring'))
				.on('click', function() { self.addRow(); })
				.appendTo($row);
			$('<a class="button add-specific-date" style="float:right"></a>')
				.text(O5._t('+ Specific Date'))
				.on('click', function() { self.addSpecificDatesRow(); })
				.appendTo($row);
			this.$el.append($row);
		},

		addSpecificDatesRow: function() {
			return this.addRow(_.extend({}, this.options, {
				fields: this.options.specificDatesFields,
				repeating: false,
				widget: SpecificDatesWidget
			}));
		},

		getVal: function() {
			var orig = O5.editor.RepeatingFieldGroup.prototype.getVal.call(this);
			if (!orig) return orig;
			var val = [];
			var specific = [];
			_.each(orig, function(v) {
				if (v.specific_date) {
					specific.push(v.specific_date);
				}
				else {
					val.push(v);
				}
			});
			if (specific.length) val.push({specific_dates: specific});
			return val;
		},

		setVal: function(val) {
			if (!val) return;
			val = _.clone(val);
			var specific = _.remove(val, function(x) { return x.specific_dates; });
			O5.editor.RepeatingFieldGroup.prototype.setVal.call(this, val);
			if (specific.length) {
				specific = specific[0].specific_dates;
				for (var i = 0; i < specific.length; i++) {
					this.addSpecificDatesRow().setVal(specific[i]);
				}
			}
		}

	});

})();