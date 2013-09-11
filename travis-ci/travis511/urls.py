from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.contrib.gis import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('open511.urls')),
    url(r'^map/', include('django_open511_ui.urls')),
    url(r'^accounts/', include('django_open511_ui.auth_urls')),
)

urlpatterns += staticfiles_urlpatterns()