from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    url(r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'o5ui/registration/login.html'}, name='login'),
    url(r'^logout/$', 'django.contrib.auth.views.logout_then_login', name='logout'),
)