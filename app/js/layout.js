(function() {

	var DEFAULT_LEFT_PANE_WIDTH = 360;

	var Layout = function($target, app, opts) {
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
		this.setLeftPane(opts.defaultLeftPaneView, {animate: false});

		// PLUGIN HOOK
		app.trigger('render-layout', {
			'$el': this.$el,
			'layout': this
		});
	};

	_.extend(Layout.prototype, {

		draw: function() {
			var leftOffset = this.$info.outerWidth();
			var paneHeight = this.height - this.topOffset;
			this.$el.find('.mainpane').height(paneHeight);
			this.$main.width(this.width - leftOffset).css({left: leftOffset, top: this.topOffset});
			this.drawLeftPane();
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
			var newWidth = 0;
			if (!view) view = this.defaultLeftPaneView;
			$pane.append(view.el);
			newWidth = view.width || DEFAULT_LEFT_PANE_WIDTH;
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
				this.draw();
			}
		},

		addMainView: function(view) {
			this.mainViews.push(view);
			view.$el.hide();
			this.$main.append(view.el);
		},

		setMainView: function(view) {
			if (!_.contains(this.mainViews, view)) {
				throw new Error("view not in mainViews");
			}
			_.each(this.mainViews, function(v) {
				if (v === view) {
					v.$el.show();
				}
				else {
					v.$el.hide();
				}
				if (v.setViewVisibility) {
					v.setViewVisibility(v === view);
				}
			});
			var self = this;
			_.each(this.$main.attr('class').split(' '), function(cls) {
				if (/-active$/.test(cls)) {
					self.$main.removeClass(cls);
				}
			});
			if (view.name) {
				this.$main.addClass(view.name + '-active');
			}
			this.draw();
		}

	});

	O5.prototypes.Layout = Layout;

})();