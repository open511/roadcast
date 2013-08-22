(function() {

	/**
	 * A FieldGroup is a series of editable fields in the editor.
	 * Groups can be nested inside groups.
	 */
	O5.editor.FieldGroup = O5.views.BaseView.extend({
		className: 'fieldgroup',

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);
			this.widgets = {};
			if (this.options.tab) this.$el.attr('data-tab', this.options.tab);
			var self = this;
			_.each(this.options.fields, function(field) {
				var item;
				if (field.type === 'group') {
					var prot = field.repeating ? O5.editor.RepeatingFieldGroup : O5.editor.FieldGroup;
					var opts = _.extend({}, field, {
						app: self.app,
						roadEvent: self.options.roadEvent
					});
					item = new prot(opts);
					self.$el.append(item.$el);
				}
				else {
					item = self._makeWidget(field);
					self.$el.append(item.renderEditorField());
				}
				self.widgets[field.name] = item;
				item.on('change', function(opts) {
					self.onWidgetChange(item, opts);
				});
			});
		},

		// Returns a dict of all the values entered into this group's widgets
		getVal: function() {
			var updates = {};
			_.each(this.widgets, function (widget) {
				_.each(widget.getVals(), function(val, key) {
					if (val === '') val = null;
					// This is done so that 'schedule/startDate' goes to {'schedule': {'startDate': x }}
					var name_bits = key.split('/');
					var base = updates;
					while (name_bits.length > 1) {
						var bit = name_bits.shift();
						if (!base[bit]) {
							base[bit] = {};
						}
						base = base[bit];
					}
					base[name_bits[0]] = val;
				});
			});
			return updates;
		},

		getVals: function() {
			var vals = {};
			vals[this.options.name || 'fieldgroup'] = this.getVal();
			return vals;
		},

		setVal: function(val) {
			_.each(this.widgets, function(widget, name) {
				var base = val;
				var name_bits = name.split('/');
				while (name_bits.length > 1) {
					base = base[name_bits.shift()] || {};
				}
				var v = base[name_bits[0]];
				if (v) widget.setVal(v);
			});
		},

		// Returns an array of every widget failing validation;
		// also triggers display of validation errors
		getInvalidWidgets: function() {
			var invalid = [];
			_.each(this.widgets, function (widget) {
				invalid.push.apply(invalid, widget.getInvalidWidgets());
			});
			return invalid;
		},

		_makeWidget: function(field) {
			var wc;

			if (field.widget) {
				if (_.isObject(field.widget)) {
					wc = field.widget;
				}
				else {
					wc = O5.widgets[field.widget];
				}
			}
			else if (field.type === 'text') {
				wc = O5.widgets.textarea;
			}
			else if (field.type === 'enum' && field.choices) {
				wc = O5.widgets.select;
			}
			else if (field.type === 'date') {
				wc = O5.widgets.date;
			}
			else {
				wc = O5.widgets.text;
			}

			return new wc({
				app: this.app,
				id: _.uniqueId('field_'),
				field: field,
				roadEvent: this.options.roadEvent
			});
		},

		// Bubble change events upwards
		onWidgetChange: function(widget, opts) {
			this.trigger('change', opts);
		}


	});

	/**
	 * The top-level group containing all other fields & groups.
	 */
	O5.editor.TopLevelFieldGroup = O5.editor.FieldGroup.extend({

		onWidgetChange: function(widget, opts) {

			if ((opts || {}).suppressValidation || widget.getInvalidWidgets().length === 0) {
				var self = this;
				_.each(widget.getVals(), function(val, name) {
					if (name.indexOf('/') === -1) {
						// FIXME doesn't currently support slash-nested names
						self.options.roadEvent.set(name, val);
					}
				});
			}

		}

	});

	/**
	 * Represents a FieldGroup that can recur multiple times -- e.g. the group
	 * represents a road, and an event can have many different roads.
	 */
	O5.editor.RepeatingFieldGroup = O5.views.BaseView.extend({
		className: 'repeating-group',

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);
			if (this.options.tab) this.$el.attr('data-tab', this.options.tab);
			this.$el.on('click', '.add-row', _.bind(this.addRow, this));
			this.$rows = $('<div class="repeating-group-rows"></div>');
			this.renderRows(1);
			this.$el.append(this.$rows);
			this.$el.append($('<a class="add-row">+</a>'));
		},

		renderRows: function(rows) {
			this.$rows.empty();
			this.fieldGroups = [];
			for (var i = 0; i < rows; i ++) {
				this.addRow();
			}
		},

		addRow: function() {
			var group = new O5.editor.FieldGroup(this.options);
			this.fieldGroups.push(group);
			this.$rows.append(group.$el);
		},

		getVal: function() {
			var val = [];
			_.each(this.fieldGroups, function(group) {
				var gval = group.getVal();
				var has_value = _.isObject(gval) ? _.any(gval, function(v) { return v === 0 || v; }) : (gval === 0 || gval);
				if (has_value) val.push(gval);
			});
			return val;
		},

		getVals: function() {
			var vals = {};
			vals[this.options.name || 'fieldgroup'] = this.getVal();
			return vals;
		},

		setVal: function(val) {
			if (!val || !val.length) {
				return this.renderRows(1);
			}
			if (this.fieldGroups.length !== val.length) {
				this.renderRows(val.length);
			}
			for (var i = 0; i < val.length; i++) {
				this.fieldGroups[i].setVal(val[i]);
			}
		},

		getInvalidWidgets: function() {
			invalid = [];
			_.each(this.fieldGroups, function(group) {
				invalid.push.apply(invalid, group.getInvalidWidgets());
			});
			return invalid;
		}

	});
})();