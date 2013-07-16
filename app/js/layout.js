O5.prototypes.Layout = function(inside, app, opts) {
	/*
	 * inside - A selector for the element to render inside of. Usually body.
	 * app - The Open511 app object
	 */
	this.app = app;

	// Add our HTML to the document
	this.$el = $(JST.main());
	var $target = $(inside);
	if (!$target.length) throw "Empty selector in O5.Layout";
	$target.css('overflow', 'hidden');
	if (inside === 'body') $target.css({ padding: 0, margin: 0});
	$target.prepend(this.$el);

	_.extend(this, {
		// If we're in the body, fill the window. Otherwise, fill
		// the containing element.
		'$sizingContainer': (inside === 'body' ? $(window) : $target),
		// Any individual view can override this, but otherwise this
		// is how wide (in pixels) the left pane will be
		'defaultLeftPaneWidth': 360,
		// Cached selectors for the various components we manage
		'$navbar': this.$el.find('.navbar'),
		'$info': this.$el.find('.infopane'),
		'$main': this.$el.find('.mainpane'),
		'$map': this.$el.find('.mappane'),
		'$listContainer': this.$el.find('.roadevent-list-container')
	}, opts || {});

	// Pass defaultLeftPaneView (a Backbone.View instance) to override;
	// by default shows a simple text view.
	if (!this.defaultLeftPaneView) {
		this.defaultLeftPaneView = new O5.views.BlurbView({app: app});
	}

	// Display the default left-pane view; this triggers a draw
	this.setLeftPane(this.defaultLeftPaneView, {animate: false});

	// Redraw whenever the window is resized
	$(window).on('resize', _.bind(this.draw, this));

	// PLUGIN HOOK
	app.trigger('layout-render', {
		'$el': this.$el,
		'layout': this
	});
};

_.extend(O5.prototypes.Layout.prototype, {

	draw: function() {
		var leftOffset = this.$info.outerWidth();
		var topOffset = this.$navbar.outerHeight();
		var paneHeight = this.$sizingContainer.height() - topOffset;
		this.$main.height(paneHeight)
			.width(this.$sizingContainer.width() - leftOffset)
			.css({
				left: leftOffset,
				top: topOffset
			});
		this.$map.height(paneHeight - this.$listContainer.outerHeight());
		this.$info.height(paneHeight);
		this.$info.find('div.body').height(
			paneHeight -
			this.$info.find('.header').outerHeight() -
			this.$info.find('.footer').outerHeight()
		);
		this.app.trigger('layout-draw');
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
		var newWidth = view.width || this.defaultLeftPaneWidth;
		if (newWidth != $pane.width()) {
			if (opts.animate) {
				$pane.animate({ width: newWidth}, 200, _.bind(this.draw, this));
			}
			else {
				$pane.width(newWidth);
			}
		}
		this.draw();
	},

	setListHeight: function(newHeight) {
		this.$list.height(newHeight);
		this.$map.height(this.$main.height() - this.$list.outerHeight());
	}

});