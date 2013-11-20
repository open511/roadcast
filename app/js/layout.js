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
		'$listContainer': this.$el.find('.roadevent-list-container'),
		'showNavbar': true
	}, opts || {});

	// Pass defaultLeftPaneView (a Backbone.View instance) to override;
	// by default shows a simple text view.
	if (!this.defaultLeftPaneView) {
		this.defaultLeftPaneView = new O5.views.BlurbView({app: app});
	}

	this.drawSoon = _.debounce(_.bind(this.draw, this), 10);

	if (inside === 'body' && window.top !== window.self) {
		// We have special logic if we're inside an iframe
		this._initializeEmbedding();
	}

	// Display the default left-pane view; this triggers a draw
	this.setLeftPane(this.defaultLeftPaneView, {animate: false});

	// Redraw whenever the window is resized
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

		if (this.showNavbar !== this.$navbar.is(':visible')) this.$navbar.toggle();

		var leftOffset = screenSize === 'small' ? 0 : this.$info.outerWidth();
		var topOffset = this.showNavbar ? this.$navbar.outerHeight() : 0;

		var mainWidth = containerWidth - leftOffset;
		var mapSizeChange = false;
		if (this.$main.width() !== mainWidth) {
			mapSizeChange = true;
			this.$main.width(mainWidth);
		}

		var paneHeight = this.$sizingContainer.height() - topOffset;
		if (this.$main.height() !== paneHeight) this.$main.height(paneHeight);

		this.$main.css({ left: leftOffset, top: topOffset });

		var mapHeight = paneHeight - this.$listContainer.outerHeight();
		if (this.$map.height() !== mapHeight) {
			this.$map.height(mapHeight);
			mapSizeChange = true;
		}
		if (mapSizeChange) this.app.trigger('layout-map-resize');

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

		if (this.leftPaneView && this.leftPaneView.deactivate) {
			try {
				this.leftPaneView.deactivate();
			}
			catch (e) {
				// If deactivate throws an exception, don't switch the pane
				return;
			}
		}

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
		this.$el.find('.back-button').on('touchend click', _.debounce(
			go_back, 300, true));
		// $('body').on('orientationchange', this.drawSoon);
	},

	_initializeEmbedding: function() {
		// This function is called if we're inside an iframe

		var self = this;

		$(window).on('message', function(e) {
			var msg = e.originalEvent.data;
			// Deal with messages from the parent page
			if (msg === 'open511-embed') {
				// Initialize small, embedded view
				self.showNavbar = false;
				self.$el.addClass('embedded');
				self.$el.removeClass('embedded-fullscreen');
				self.$el.addClass('embedded-small');
				self.drawSoon();
			}
			if (msg === 'open511-fullscreen') {
				// The parent page has expanded us to fill the window
				self.showNavbar = true;
				self.$el.removeClass('embedded-small');
				self.$el.addClass('embedded-fullscreen');
				self.drawSoon();
			}
			if (msg === 'open511-draw') {
				self.drawSoon();
			}
		});

		this.$el.on('click', '.embed-control', function(e) {
			e.preventDefault();
			if (self.$el.hasClass('embedded-fullscreen')) {
				window.top.postMessage('open511-embed', '*');
			}
			else {
				window.top.postMessage('open511-fullscreen', '*');
			}
		});

		// Send a message to the parent page. If it's running our embedding JS,
		// the it will respond with an 'open511-embed' message, and we'll turn on
		// our embedded UI. If it's not, then we never get a response, and
		// we use our usual UI.
		window.top.postMessage('open511-embed', '*');

	}

});