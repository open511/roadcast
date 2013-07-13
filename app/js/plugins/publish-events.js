(function() {

	O5.plugins = O5.plugins || {};

	var PublishedWidget = O5.widgets.BaseWidget.extend({
		tagName: 'div',
		addLabel: false,
		initialize: function() {
			if (this.options.roadEvent.isNew()) {
				this.renderMinimal();
			}
			else {
				this.renderDefault();
			}
		},

		renderDefault: function() {
			this.$el.html('<div class="alert">' + O5._t('Unpublished') + '</div>' +
				'<label for="' + this.id + '">' + O5._t('Publish on') + '</label>' +
				'<input id="' + this.id + '-t" type="text" style="width: 30%"/> &nbsp; ' +
				'<a class="button" style="position: relative; bottom: 5px"><span>' + O5._t('Publish now') + '</span></button>');
			var $input = this.$el.find('input');
			$input.datepicker({
				format: 'yyyy-mm-dd'
			});
			$input.on('focus keyup keydown', function(e) { console.log(e); });
			this.$el.find('button').click(function(e) {
				e.preventDefault();
				$input.val(O5._t('Now'));
			});
		},

		renderMinimal: function() {
			this.$el.html('<input type="checkbox" value="' + O5._t('Now') + '" checked id="' + this.id + '-cb"/>' +
				' &nbsp; <label style="display:inline" for="' + this.id + '-cb">' + O5._t('Publish?'));
			this.minimal = true;
			var self = this;
			this.$el.find('input').on('change', function() {
				self.minimal = false;
				self.$el.empty();
				self.renderDefault();
			});
		},

		setVal: function(val) {
			if (!this.minimal) {
				this.$el.find('input').val(val);
				this.$el.find('input').datepicker('update');
			}
		},

		getVals: function() {
			if (this.minimal) {
				return {};
			}
			var val = this.$el.find('input').val();
			if (val === O5._t('Now')) {
				return {
					'!publish_on': null,
					'!unpublished': null
				};
			}
			return {
				'!publish_on': val,
				'!unpublished': true
			};
		}

	});
	O5.plugins.publishEvents = {

		changeEditorFieldDefinitions: function(fields, roadEvent) {
			if (roadEvent.get('!unpublished') || roadEvent.isNew()) {
				fields.splice(1, 0, {
					name: '!publish_on',
					label: 'Published',
					type: 'complex',
					widget: PublishedWidget,
					tab: 'basics'
				});
			}
		}
	};

})();