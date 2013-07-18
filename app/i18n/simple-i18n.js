SimpleI18N = function(opts) {
	this.messages = opts.locale_data.messages;
};
SimpleI18N.prototype.gettext = function(key) {
	var m = this.messages[key];
	if (m && m.length === 2) return m[1];
	return key;
};