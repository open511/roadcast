from django.conf import settings
from django.core import urlresolvers

from appconf import AppConf

###
# Open511 UI settings
#
# The following are the default settings. You probably shouldn't edit
# this file directly.
# To override any of these, set OPEN511_UI_SETTING_NAME in your main Django
# settings.py. For example, to make login mandatory, add the following
# to settings.py:
# OPEN511_UI_REQUIRE_LOGIN = True
###

class Open511UISettings(AppConf):
    EVENTS_URL = urlresolvers.reverse_lazy('open511_roadevent_list')

    REQUIRE_LOGIN = False
    SHOW_LOGIN_BUTTON = False

    ENABLE_EDITOR = True

    MAP_TYPE = 'leaflet'  # 'leaflet' or 'google'
    MAP_START_LAT = 45.532411
    MAP_START_LNG = -73.61512
    MAP_START_ZOOM = 10

    # The editor and external-auth plugins are automatically added,
    # based on other settings
    PLUGINS = [
        'publish-events',
        'attachments'
    ]

    # Tile settings are used only if MAP_TYPE == 'leaflet'
    MAP_TILE_URL = ''
    # e.g. MAP_TILE_URL = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.jpg'
    # Config passed directly to Leaflet
    MAP_TILE_OPTIONS = ''
    # e.g. MAP_TILE_OPTIONS = {
    #     "minZoom": 1,
    #     "maxZoom": 20,
    #     "subdomains": 'abcd',
    #     "attribution": """Map tiles by <a href="http://stamen.com">Stamen Design</a>,
    #         under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
    #         Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,
    #         under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>."""
    # }

    # To allow file upload, set the following
    AWS_ACCESS_KEY = ''
    AWS_SECRET_KEY = ''
    FILE_UPLOAD_S3_BUCKET = ''

    class Meta:
        prefix = 'OPEN511_UI'
