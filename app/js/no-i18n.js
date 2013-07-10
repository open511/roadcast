// Simple base for internationalization

window.O5 = window.O5 || {};

if (window.O5.i18n) {
	// We have a locale object already loaded. Make _t do translation.
	window.O5._t = function(s) { return O5.i18n.gettext(s); };
}
else {
	// No locale. We're in English, _t is a noop.
	window.O5._t = function(s) { return s; };
	window.O5.language = 'en';
}