from django.conf import settings
from django.core import urlresolvers

from appconf import AppConf

class Open511UISettings(AppConf):
    API_URL = urlresolvers.reverse_lazy('open511_discovery')

