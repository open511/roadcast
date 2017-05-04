from django.conf.urls import url, include

from django_open511_ui.views import main, s3_file_upload_helper, feedback

urlpatterns = [
    url(r'^$', main, name='o5ui_home'),
    url(r'^events/(?P<event_slug>[^/]+/[^/]+)/?$', main),
    url(r'^helpers/file_upload/$', s3_file_upload_helper, name='o5ui_file_upload'),
    url(r'^helpers/feedback/$', feedback, name='o5ui_feedback'),
    url(r'^helpers/i18n/', include('django.conf.urls.i18n')),
]
