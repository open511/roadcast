from django.conf.urls.defaults import patterns, include, url
from django.views.generic import TemplateView

urlpatterns = patterns('',
    url(r'', TemplateView.as_view(template_name='o5ui/main.html'), name='o5ui_home'),
)