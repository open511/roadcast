(function() {
	var Layout = function($el, opts) {
		this.$el = $el;
		opts = opts || {};
		_.defaults(opts, {
			topOffset: $el.find('.header').length ? $el.find('.header').outerHeight() : 0,
			height: $(window).height(),
			width: $(window).width(),
			mainViews: []
		});
		_.extend(this, opts);
		this.$info = $el.find('.infopane');
		this.$main = $el.find('.mainpane');
		this.$info.width(0);
	};

	_.extend(Layout.prototype, {

		draw: function() {
			var leftOffset = this.$info.outerWidth();
			this.$el.find('.infopane,.mainpane').height(this.height - this.topOffset);
			this.$main.width(this.width - leftOffset).css({left: leftOffset, top: this.topOffset});
		},

		change: function(opts) {
			_.extend(this, opts);
			this.draw();
		},

		setLeftPane: function(view) {
			var $pane = this.$info;
			$pane.children().detach();
			var newWidth = 0;
			if (view) {
				$pane.append(view.el);
				newWidth = view.width || 330;
			}
			if (newWidth != $pane.width()) {
				var self = this;
				$pane.animate({ width: newWidth}, 200, function() { self.draw(); });
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
		}

	});

	O5.prototypes.Layout = Layout;

})();