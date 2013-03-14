from django.conf.urls import patterns, include, url

urlpatterns = patterns('open511_ui.views',
    url(r'^$', 'main', name='o5ui_home'),
    url(r'^events/(?P<event_slug>[^/]+/[^/]+)/?$', 'main'),
)