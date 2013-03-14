(function() {
	var Layout = function($el, opts) {
		this.$el = $el;
		opts = opts || {};
		_.defaults(opts, {
			topOffset: $el.find('.header').length ? $el.find('.header').outerHeight() : 0,
			height: $(window).height(),
			width: $(window).width()
		});
		_.extend(this, opts);
		$el.find('.infopane').width(0);
	};

	_.extend(Layout.prototype, {

		draw: function() {
			var leftOffset = this.$el.find('.infopane').outerWidth();
			this.$el.find('.infopane,.mappane').height(this.height - this.topOffset);
			this.$el.find('.mappane').width(this.width - leftOffset).css({left: leftOffset, top: this.topOffset});
		},

		change: function(opts) {
			_.extend(this, opts);
			this.draw();
		},

		setLeftPane: function(view) {
			var $pane = this.$el.find('.infopane');
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
		}

	});

	O5.prototypes.Layout = Layout;

})();