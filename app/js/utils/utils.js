O5.utils = O5.utils || {};
_.extend(O5.utils, {
	nlToBR: function(txt) {
		return _.escape(txt).replace(/\n/g, '<br>');
	},

	notify: function(message, tag, opts) {
		tag = tag || 'warning';
		opts = _.extend({
			'animateIn': true,
			'allowHTML': false,
			'hideAfter': (tag == 'error' ? 10000 : 5000) // # of milliseconds after which to hide the message, 0 to require manual close
		}, opts || {});

		var $container = $('#o5notifications');
		if (!$container.length) {
			$container = $('<div id="o5notifications" />');
			$('.o5 .mainpane').append($container);
			$container.on('click', '.close', function(e) {
				e.preventDefault();
				var $notification = $(e.target).closest('.o5notification');
				$notification.slideUp(400, function() { $notification.remove(); });
			});
		}
		if (!opts.allowHTML) {
			message = _.escape(message);
		}

		var html = '<div class="o5notification ' + tag + '"><a href="#" class="close">&times;</a>'
			+ message + '</div>';
		var $el = $(html);

		if (opts.animateIn) {
			$el.hide();
		}
		$container.append($el);
		if (opts.animateIn) {
			$el.slideDown();
		}

		var close = function() {
			$el.find('a.close').click();
		};

		if (opts.hideAfter) {
			setTimeout(close, opts.hideAfter);
		}
		return { close: close};
	},

	formatTime: function(val) {
		// Special English formatting for times
		// val should be a HH:mm string
		if (!val) return '';
		if (O5.language !== 'en') return val;
		
		var splits = val.split(':');
		var hour = parseInt(splits[0], 10);
		var int_minutes = parseInt(splits[1], 10);

		var minutes = int_minutes ? ':' + splits[1] : '';

		if (hour === 12) {
			if (int_minutes === 0) {
				return 'Noon';
			}
			else {
				return '12' + minutes + ' p.m.';
			}
		}
		if (hour === 0) {
			if (int_minutes === 0) {
				return 'Midnight';
			}
			else {
				return '12' + minutes + ' a.m.';
			}
		}
		if (hour < 12) {
			return hour + minutes + ' a.m.';
		}
		return (hour - 12) + minutes + ' p.m.';
	},

	formatDate: function(d) {
		// d should be a Moment object
		return d.format(
			Math.abs(d.diff(moment(), 'days')) < 60 ? O5._t('ddd, MMM D') : 'll'
		);
	},

	GhostSelect: O5.views.BaseView.extend({
		// A select box that hovers invisibly in front of another item,
		// capturing its clicks and popping up when the target item is
		// clicked.

		tagName: 'select',

		className: 'ghost-select',

		initialize: function() {
			O5.views.BaseView.prototype.initialize.call(this);

			_.bindAll(this, 'update');

			this.$target = this.options.$target;
			this.choices = this.options.choices;

			this.$el.css({
				'-webkit-appearance': 'menulist-button',
				position: 'absolute',
				opacity: 0
			});

			var self = this;
			_.each(this.choices, function(text, val) {
				self.$el.append(
					$(document.createElement('option')).attr('value', val).text(text)
				);
			});

			this.update();

			this.$target.one('mousedown focus mouseover keypress', this.update);

			// The constructor inserts the element into the DOM
			this.$target.before(this.$el);
		},

		update: function() {
			this.$el.css({
				fontSize: this.$target.css('font-size'),
				width: this.$target.outerWidth(),
				height: this.$target.outerHeight()
			});
			this.$el.offset(this.$target.offset());
		}



	}),
	
	/** Open a modal dialog.
	 * - content: Element or text string of the dialog conent
	 * - opts.buttons: an array of objects with name/class/onclick keys
	 */
	modal: function(content, opts) {
		var $dialog = $(JST.modal());
		if (_.isString(content)) {
			$dialog.find('.modal-content').text(content);
		} else {
			$dialog.find('.modal-content').append(content);
		}

		opts = opts || {};

		if (opts.buttons) {
			var $buttons = $dialog.find('.modal-buttons');
			_.each(opts.buttons, function(button) {
				var $button = $('<a class="button close-modal ' + (button['class'] ? button['class'] : '') + '" />');
				$button.text(button.name);
				if (button.onclick) $button.on('click', button.onclick);
				$buttons.append($button);
			});
		}

		O5.app.layout.$el.append($dialog);
		$dialog.easyModal({
			autoOpen: true,
			closeButtonClass: '.close-modal'
		});
		$dialog.on('closeModal', function() {
			_.defer(function() {
				if (opts.onclose) opts.onclose();
				$dialog.remove();
			});
		});
	},

	confirm: function (text, opts) {
		opts = _.extend({
			'yesText': O5._t('Yes'),
			'noText': O5._t('No'),
			onYes: function() {}
		}, opts);

		O5.utils.modal(text, {
			buttons: [
				{
					'name': opts.noText,
				},
				{
					'name': opts.yesText,
					'class': 'primary',
					onclick: opts.onYes
				}
			]
		});

	}

});