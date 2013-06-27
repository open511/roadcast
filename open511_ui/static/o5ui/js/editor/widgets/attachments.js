O5.widgets.attachments = O5.widgets.BaseWidget.extend({

	className: "file-upload-widget",

	render: function() {
		var self = this;

		if (!this.options.app.settings.fileUploadURL) {
			return this.$el.text(
				O5._t("File upload not configured")
			);
		}

		// Detect file-drag API
		if ('draggable' in document.createElement('div')) {
			this.$el.addClass('dragndrop');
		}
		else {
			this.$el.addClass('no-dragndrop');
		}

		// Init events
		this.$el.on('click', '.delete', function(e) {
			var url = $(e.target).closest('li').find('a').attr('href');
			self.remove(url);
			self.renderList();
		});
		this.$el.on('click', '.edit', function(e) {
			var url = $(e.target).closest('li').find('a').attr('href');
			var title = prompt(O5._t("Enter a new title"));
			if (title && title.length) {
				_.find(self.data, function(a) { return a.url === url; }).title = title;
			}
			self.renderList();
		});

		this.$el.html(JST.attachment_widget());
		this.$el.fileupload({
			dropZone: this.$el,
			done: function(e, data) {
				data.context.progress.remove();
				self.data.push(data.context.fileInfo);
				self.renderList();
			},
			add: function(e, fileAddData) {
				var fname = fileAddData.files[0].name;

				var $progress = $('<li />').text(fname);
				self.$el.find('ul.in-progress').append($progress);
				$.ajax({
					url: self.options.app.settings.fileUploadURL,
					data: {filename: fname},
					dataType: 'json',
					success: function(data) {
						var $form = self.$el.find('form');
						$form.attr('action', data.post_url);
						var fileInfo = {
							url: data.post_url + data.key,
							length: fileAddData.files[0].size,
							type: fileAddData.files[0].type
						};
						fileAddData.context = {
							fileInfo: fileInfo,
							progress: $progress,
							fname: fname
						};
						delete data['post_url'];
						_.each(data, function(val, key) {
							$form.find('input[name="' + key + '"]').val(val);
						});
						$form.find('input[name="Content-Type"]').val(fileInfo.type);
						fileAddData.submit();
					},
					error: function() {
						O5.utils.notify(O5._t("Error uploading file " + fname), 'error');
						$progress.remove();
					}
				});
			},
			fail: function(e, data) {
				O5.utils.notify(O5._t("Error uploading file " + data.context.fname), 'error');
				data.context.progress.remove();
			}
			// progressall: function(e, data) {
			// 	// console.log(parseInt(data.loaded / data.total * 100, 10));
			// 	// data.context.find('percent').text(parseInt(data.loaded / data.total * 100, 10) + '%');
			// }
		});
	},

	renderList: function() {
		var $ul = this.$el.find('ul.attachments');
		$ul.empty();
		_.each(this.data, function(a) {
			$ul.append($(JST.attachment_widget_row({a:a})));
		});
	},

	initialize: function() {
		var self = this;
		this.data = [];
		// curl(['gen/fileupload.js'], function(fu) {
			self.render();
		// });
	},

	setVal: function(val) {
		this.data = val;
		this.renderList();
	},

	getVal: function() {
		return this.data;
	},

	remove: function(url) {
		this.data = _.reject(this.data, function(attachment) {
			return attachment.url === url;
		});
	},

	validate: function() {
		if (this.$el.find('.in-progress li').length) {
			// This is kinda smelly and DOM-y, but works for now
			return O5._t("Please try again when all files have finished uploading.");
		}
		return true;
	}
});