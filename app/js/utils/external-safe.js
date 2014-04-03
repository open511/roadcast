/* Utility code that is safe for external JS to include without the rest
	of this app. That is, it cannot have dependencies beyond:
	- Underscore/Lodash
	- Moment
	- The basic i18n support (O5.language, O5._t)
*/

O5.utils = O5.utils || {};
_.extend(O5.utils, {

	nlToBR: function(txt) {
		return _.escape(txt).replace(/\n/g, '<br>');
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
	}

});