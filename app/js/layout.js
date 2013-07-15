(function() {

	var DEFAULT_LEFT_PANE_WIDTH = 360;

	var Layout = function($target, app, opts) {
		this.app = app;
		this.$el = $(JST.main());
		$target.prepend(this.$el);
		opts = opts || {};
		_.defaults(opts, {
			topOffset: this.$el.find('.navbar').outerHeight(),
			height: $(window).height(),
			width: $(window).width(),
			mainViews: []
		});
		if (!opts.defaultLeftPaneView) {
			opts.defaultLeftPaneView = new O5.views.BlurbView({app: app});
			opts.defaultLeftPaneView.render();
		}
		_.extend(this, opts);

		this.$info = this.$el.find('.infopane');
		this.$main = this.$el.find('.mainpane');
		this.$map = this.$el.find('.mappane');
		this.$listContainer = this.$el.find('.roadevent-list-container');
		this.setLeftPane(opts.defaultLeftPaneView, {animate: false});

		// PLUGIN HOOK
		app.trigger('layout-render', {
			'$el': this.$el,
			'layout': this
		});
	};

	_.extend(Layout.prototype, {

		draw: function() {
			var leftOffset = this.$info.outerWidth();
			var paneHeight = this.height - this.topOffset;
			this.$main.height(paneHeight);
			this.$main.width(this.width - leftOffset).css({left: leftOffset, top: this.topOffset});
			this.$map.height(paneHeight - this.$listContainer.outerHeight());
			this.drawLeftPane();
			this.app.trigger('layout-draw');
		},

		drawLeftPane: function() {
			var paneHeight = this.height - this.topOffset;
			this.$info.height(paneHeight);
			this.$info.find('div.body').height(paneHeight - this.$info.find('.header').outerHeight() -
				this.$info.find('.footer').outerHeight());
		},

		change: function(opts) {
			_.extend(this, opts);
			this.draw();
		},

		setLeftPane: function(view, opts) {
			opts = _.extend({
				'animate': true
			}, opts || {});
			var $pane = this.$info;
			$pane.children().detach();
			if (!view) view = this.defaultLeftPaneView;

			if (view !== this.leftPaneView) {
				if (this.leftPaneView && this.leftPaneView.deactivate) this.leftPaneView.deactivate();
				this.leftPaneView = view;
			}

			$pane.append(view.el);
			var newWidth = view.width || DEFAULT_LEFT_PANE_WIDTH;
			if (newWidth != $pane.width()) {
				var self = this;
				if (opts.animate) {
					$pane.animate({ width: newWidth}, 200, function() { self.draw(); });
				}
				else {
					$pane.width(newWidth);
					this.draw();
				}
			}
			else {
				this.drawLeftPane();
			}
		},

		setListHeight: function(newHeight) {
			console.log(newHeight);
			this.$list.height(newHeight);
			this.$map.height(this.$main.height() - this.$list.outerHeight());
		}


	});

	O5.prototypes.Layout = Layout;

})();