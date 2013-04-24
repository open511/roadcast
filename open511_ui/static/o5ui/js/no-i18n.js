// Provides dummy versions of internationalization functions,
// for use when the interface is English.

window.O5 = window.O5 || {};
if (!window.O5._t) {
	window.O5._t = function(s) { return s; };
}