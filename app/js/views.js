O5.views = {
	BaseView: Backbone.View.extend({
		initialize: function() {
			this.app = this.options.app;
			if (this.options.app) delete this.options.app;
		}
	})
};
O5.views.BlurbView = O5.views.BaseView.extend({

	className: 'blurb container',

	render: function() {
		var html = this.app.settings.blurbHTML;
		if (!html) {
			html = '<h2>' + O5._t('Welcome to Open511') + '</h2>' +
				'<p>' + O5._t('Open511 is the open standard for sharing road and construction data. Read more at <a href="http://www.open511.org/">open511.org</a>.') + '</p>';
		}
		this.$el.html(html);
	}
});