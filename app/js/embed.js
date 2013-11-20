(function() {

	var mode = 'small';

	var receiveMessage = function(e) {
		var msg = e.data;
		var ifr = document.getElementById('open511_embedded');
		if (msg === 'open511-embed') {
			mode = 'small';
			ifr.style.top = null;
			ifr.style.left = null;
			ifr.style.width = null;
			ifr.style.height = null;
			ifr.style.position = 'static';
			sendMessage('open511-embed');
		}
		if (msg === 'open511-fullscreen') {
			mode = 'fullscreen';
			ifr.style.top = '0';
			ifr.style.left = '0';
			ifr.style.position = 'fixed';
			setWindowDimensions(ifr);
			sendMessage('open511-fullscreen');
		}
	};

	var setWindowDimensions = function(ifr) {
		ifr.style.width = (window.innerWidth ? window.innerWidth : document.documentElement.clientWidth) + 'px';
		ifr.style.height = (window.innerHeight ? window.innerHeight : document.documentElement.clientHeight) + 'px';
	};

	var onResize = function() {
		if (mode !== 'fullscreen') return;
		var ifr = document.getElementById('open511_embedded');
		setWindowDimensions(ifr);
		sendMessage('open511-draw');
	};

	var sendMessage = function(msg) {
		document.getElementById('open511_embedded').contentWindow.postMessage(msg, '*');
	};

	window.embedOpen511 = function (opts) {
		document.write('<iframe id="open511_embedded" src="' + opts.url + '" style="border: 1px solid #CCCCCC" width="'
				+ opts.width + '" height="' + opts.height + '"></iframe>');
		if (window.addEventListener) {
			window.addEventListener('message', receiveMessage, false);
			window.addEventListener('resize', onResize, false);
		}
		else if (window.attachEvent) {
			// IE8 compatibility
			window.attachEvent('onmessage', receiveMessage);
			window.attachEvent('onresize', onResize);
		}
	};

})();