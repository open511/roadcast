from django.conf.urls import include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.contrib.gis import admin
admin.autodiscover()

urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('open511_server.urls')),
    url(r'^map/', include('django_open511_ui.urls')),
    url(r'^accounts/', include('django_open511_ui.auth_urls')),
]

urlpatterns += staticfiles_urlpatterns()
