(function() {

	var receiveMessage = function(e) {
		var msg = e.data;
		if (msg === 'open511-embed') {
			sendMessage('open511-embed');
		}
		if (msg === 'open511-fullscreen') {
			var ifr = document.getElementById('open511_embedded');
			ifr.style.top = '0';
			ifr.style.width = '100%';
			ifr.style.height = '100%';
			ifr.style.position = 'fixed';
			sendMessage('open511-fullscreen');
		}
	};

	var sendMessage = function(msg) {
		document.getElementById('open511_embedded').contentWindow.postMessage(msg, '*');
	};

	window.embedOpen511 = function (opts) {
		document.write('<iframe id="open511_embedded" src="' + opts.url + '" style="border: 1px solid #CCCCCC" width="'
				+ opts.width + '" height="' + opts.height + '"></iframe>');
		if (window.addEventListener) {
			window.addEventListener('message', receiveMessage, false);
		}
		else if (window.attachEvent) {
			// IE8 compatibility
			window.attachEvent('onmessage', receiveMessage);
		}
	};

})();