O5.views = {
	BaseView: Backbone.View.extend({
		initialize: function() {
			this.app = this.options.app;
		}
	})
};
O5.views.BlurbView = O5.views.BaseView.extend({

	className: 'blurb container',

	initialize: function() {
		O5.views.BaseView.prototype.initialize.call(this);

		var html = this.app.settings.blurbHTML;
		if (html) {
			if (_.isObject(html)) {
				if (!html['default'] && html.en) html['default'] = html.en;
				html = html[O5.language] ? html[O5.language] : html['default'];
			}
		}
		else {
			html = '<h2>' + O5._t('Welcome to Open511 Roadcast') + '</h2>' +
				'<p>' + O5._t('Open511 is the open standard for sharing road and construction data. Read more at <a href="http://www.open511.org/">open511.org</a>.') + '</p>';
		}
		this.$el.html(html);
	}
});