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
	this.drawSoon = _.debounce(_.bind(this.draw, this), 10);
	$(window).on('resize', this.drawSoon);

	// if ('ontouchend' in document) this._addTouchEvents();
	this._addMobileEvents();

	// PLUGIN HOOK
	app.trigger('layout-render', {
		'$el': this.$el,
		'layout': this
	});
};

_.extend(O5.prototypes.Layout.prototype, {

	draw: function() {
		var containerWidth = this.$sizingContainer.width();
		var screenSize = (containerWidth < 700 ? 'small' : 'big');
		if (screenSize !== this.screenSize) {
			this.$el.removeClass(this.screenSize + '-screen').addClass(screenSize + '-screen');
			this.screenSize = screenSize;
			if (screenSize === 'small')
				console.log('Open511 is running in small-screen mode. Some features are disabled.');
			this.app.trigger('layout-screen-size-change', screenSize);
		}

		var leftOffset = screenSize === 'small' ? 0 : this.$info.outerWidth();
		var topOffset = this.$navbar.outerHeight();

		var mainWidth = containerWidth - leftOffset;
		if (this.$main.width() !== mainWidth) this.$main.width(mainWidth);

		var paneHeight = this.$sizingContainer.height() - topOffset;
		if (this.$main.height() !== paneHeight) this.$main.height(paneHeight);

		this.$main.css({ left: leftOffset, top: topOffset });

		var mapHeight = paneHeight - this.$listContainer.outerHeight();
		if (this.$map.height() !== mapHeight) {
			this.$map.height(mapHeight);
			this.app.trigger('layout-map-resize');
		}

		this.$info.height(paneHeight);
		this.$info.find('div.body').height(
			paneHeight -
			this.$info.find('.header').outerHeight() -
			this.$info.find('.footer').outerHeight()
		);

		this.drawn = true;

		this.app.trigger('layout-draw');
	},

	setLeftPane: function(view, opts) {
		opts = _.extend({
			'animate': true
		}, opts || {});

		if (!view) {
			if (this.screenSize === 'small') return this.$el.removeClass('left-pane-on');
			view = this.defaultLeftPaneView;
		}

		if (this.screenSize === 'small') this.$el.addClass('left-pane-on');

		if (this.leftPaneView && this.leftPaneView.deactivate) this.leftPaneView.deactivate();

		var $pane = this.$info;
		if (view !== this.leftPaneView) {
			$pane.children().detach();
			$pane.append(view.el);
		}
		this.leftPaneView = view;

		var newWidth = view.width || this.defaultLeftPaneWidth;
		if (this.screenSize === 'small') newWidth = this.$sizingContainer.width();
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
	},

	_addMobileEvents: function() {
		var self = this;
		var go_back = function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.setLeftPane(null);
			self.$navbar.on('click', suppress_click);
			setTimeout(function() {
				self.$navbar.off('click', suppress_click);
			}, 350);
		};
		var suppress_click = function(e) {
			e.preventDefault();
			e.stopPropagation();
		};
		this.$navbar.find('.back-button').on('touchend click', _.debounce(
			go_back, 300, true));
		// $('body').on('orientationchange', this.drawSoon);
	}

});