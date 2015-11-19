from django.conf.urls import url
from django.contrib.auth.views import login, logout_then_login

urlpatterns = [
    url(r'^login/$', login,
        {'template_name': 'o5ui/registration/login.html'}, name='login'),
    url(r'^logout/$', logout_then_login, name='logout'),
]
