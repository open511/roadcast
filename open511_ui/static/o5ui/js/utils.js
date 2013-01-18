O5.utils = O5.utils || {};
_.extend(O5.utils, {
	nlToBR: function(txt) {
		return _.escape(txt).replace(/\n/g, '<br>');
	},

	notify: function(message, tag, opts) {
		var $container = $('#notifications');
		if (!$container.length) {
			$container = $('<div id="notifications" />');
			$('body').append($container);
		}
		opts = opts || {};
		_.defaults(opts, {
			message: message,
			tag: tag,
			hideDelay: 5000
		});
		var $alert = $(JST.notification(opts));
		$container.append($alert);
		if (opts.hideDelay) {
			setTimeout(function() { $alert.alert('close'); }, opts.hideDelay);
		}
	}
});