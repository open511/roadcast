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

    SHOW_FEEDBACK_BUTTON = False

    # All settings here will be passed directly to the JavaScript application.
    # For example, in settings.py:
    # OPEN511_UI_APP_SETTINGS = {
    #   'mapTiles': {
    #         'url': 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.jpg',
    #         'subdomains': 'abcd',
    #         'attribution': """Map tiles by <a href="http://stamen.com">Stamen Design</a>, data by <a href="http://openstreetmap.org">OpenStreetMap</a>."""
    #     }
    # }
    APP_SETTINGS = {}

    # To allow file upload, set the following
    AWS_ACCESS_KEY = ''
    AWS_SECRET_KEY = ''
    FILE_UPLOAD_S3_BUCKET = ''

    # Which WebDriver to use for automated testing? firefox or phantomjs
    TEST_BROWSER = 'firefox'

    class Meta:
        prefix = 'OPEN511_UI'
