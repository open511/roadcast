from django.conf import settings
from django.core import urlresolvers

from appconf import AppConf

class Open511UISettings(AppConf):
    API_URL = urlresolvers.reverse_lazy('open511_discovery')
    MAP_TYPE = 'leaflet'  # 'leaflet' or 'google'
    MAP_START_LAT = 45.532411
    MAP_START_LNG = -73.61512
    MAP_START_ZOOM = 10

    # Tile settings are used only if MAP_TYPE == 'leaflet'
    MAP_TILE_URL = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.jpg'
    # Config passed directly to Leaflet
    MAP_TILE_OPTIONS = {
        "minZoom": 1,
        "maxZoom": 20,
        "subdomains": 'abcd',
        "attribution": """Map tiles by <a href="http://stamen.com">Stamen Design</a>,
            under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
            Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,
            under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>."""
    }
