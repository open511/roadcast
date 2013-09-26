O5.widgets.timerange = O5.editor.FieldGroup.extend({

	className: O5.editor.FieldGroup.prototype.className + ' timerange clear-group',

	initialize: function() {
		this.options = _.extend({
			fields: [
				{
					name: 'start_time',
					type: 'time',
					placeholder: O5._t('Start time')
				},
				{
					name: 'end_time',
					type: 'time',
					placeholder: O5._t('End time')
				}
			]
		}, this.options);
		O5.editor.FieldGroup.prototype.initialize.call(this);
	},

	_timeToMinutes: function(t) {
		if (!t) return null;
		var splits = t.split(':');
		return (parseInt(splits[0], 10) * 60) + parseInt(splits[1], 10);
	},

	checkValidation: function(opts) {
		var val = this.getVal();
		if (this._timeToMinutes(val.end_time) <= this._timeToMinutes(val.start_time)) {
			return O5._t("Start time must be before end time");
		}
		return O5.editor.FieldGroup.prototype.checkValidation.call(this, opts);
	},

	renderEditorField: function() {
		this.$el.append(this.widgets.start_time.$el.attr('data-fieldname', 'start_time'));
		this.$el.append(this.widgets.end_time.$el.attr('data-fieldname', 'end_time'));
		return this.$el;
	}

});