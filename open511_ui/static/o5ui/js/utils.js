O5.utils = O5.utils || {};
_.extend(O5.utils, {
	nlToBR: function(txt) {
		return _.escape(txt).replace('\n', '<br>');
	}
});