O5.plugins.register(function(app) {

	if (!(app.settings.feedbackURL && app.settings.auth && app.settings.auth.displayName)) return;

	var $el = app.layout.$el;

	var $button = $('<a class="nav-button"></a>').text(O5._t('Feedback'));
	$button = $('<div class="nav-button"></div>').append($button);
	$el.find('.navbar .buttons').append($button);

	var dialogHTML = '<div><div class="field"><label>' + O5._t('Your email') + '</label><input class="email" type="text"></div>'
		+ '<div class="field"><label>' + O5._t('Message') + '</label><textarea class="message" rows="8"></textarea></div></div>';

	$button.on('click', function(e) {
		e.preventDefault();
		var $content = $(dialogHTML);
		if (app.settings.auth.email) $content.find('input.email').val(app.settings.auth.email);
		O5.utils.modal($content, {
			buttons: [
				{
					name: O5._t('Cancel')
				},
				{
					name: O5._t('Send'),
					'class': 'primary',
					onclick: function() {
						$.post(
							app.settings.feedbackURL,
							{
								'email': $content.find('input.email').val(),
								'message': $content.find('textarea').val()
							},
							function() {
								O5.utils.notify(O5._t("Your message has been sent. Thank you!"), 'success');
							}
						);
						$content.remove();
					}
				}
			]
		});
	});


});