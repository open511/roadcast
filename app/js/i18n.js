// Simple base for internationalization

O5 = window.O5 || {};

if (O5.i18n) {
	// We have a locale object already loaded. Make _t do translation.
	O5._t = function(s) { return O5.i18n.gettext(s); };
	if (O5.dateConfig) {
		moment.lang(O5.language, O5.dateConfig);
		$.fn.datepicker.dates[O5.language] = {
			days: O5.dateConfig.weekdays,
			daysShort: O5.dateConfig.weekdaysShort,
			daysMin: O5.dateConfig.weekdaysMin,
			months: O5.dateConfig.months,
			monthsShort: O5.dateConfig.monthsShort,
			today: O5._t("Today"),
			clear: O5._t("Clear")
		};
	}
}
else {
	// No locale. We're in English, _t is a noop.
	O5._t = function(s) { return s; };
	O5.language = 'en';
}