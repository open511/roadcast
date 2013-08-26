O5.widgets.timerange = O5.editor.FieldGroup.extend({

	className: O5.editor.FieldGroup.prototype.className + ' timerange',

	initialize: function() {
		this.options = _.extend({
			fields: [
				{
					name: 'start_time',
					type: 'time',
					label: O5._t('Start time')
				},
				{
					name: 'end_time',
					type: 'time',
					label: O5._t('End time')
				}
			]
		}, this.options);
		O5.editor.FieldGroup.prototype.initialize.call(this);
	},

	renderEditorField: function() {
		this.$el.append(this.widgets.start_time.$el);
		this.$el.append($('<span> &nbsp;&ndash;&nbsp; </span>'));
		this.$el.append(this.widgets.end_time.$el);
		return this.$el;
	}

});