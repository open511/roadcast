from django_assets import Bundle, register
from webassets.filter.jst import JST

from open511_ui.conf import settings

jst_filter = JST(template_function='_.template')

leaflet = (settings.OPEN511_UI_MAP_TYPE == 'leaflet')

js_libs = [
    'vendor/jquery.js',
    'vendor/lodash.js',
    'vendor/backbone.js',
    'vendor/bootstrap/js/bootstrap-alert.js',
    'vendor/bootstrap/js/bootstrap-transition.js',
    'vendor/bootstrap/js/bootstrap-dropdown.js',
    'vendor/bootstrap/js/bootstrap-button.js',
    'vendor/bootstrap/js/bootstrap-modal.js',
]
if leaflet:
    js_libs.append('vendor/leaflet/leaflet.js')
js_libs = Bundle(*js_libs)


js_editor_libs = [
    'vendor/datepicker.js'
]
if leaflet:
    js_editor_libs.append('vendor/leaflet/leaflet.draw.js')
js_editor_libs = Bundle(*js_editor_libs)

js_gmaps = Bundle(
    'o5ui/js/geojson-to-google.js',
    'o5ui/js/map-google.js'
)

js_leaflet = Bundle(
    'o5ui/js/map-leaflet.js'
)

js_app = Bundle(
    'o5ui/js/no-i18n.js',
    'o5ui/js/main.js',
    'o5ui/js/layout.js',
    'o5ui/js/roadevent.js',
    'o5ui/js/eventdetail.js',
    'o5ui/js/roadevent.js',
    'o5ui/js/router.js',
    'o5ui/js/listview.js',
    'o5ui/js/map-base.js',
    js_leaflet if leaflet else js_gmaps,
    'o5ui/js/filterset.js',
    'o5ui/js/filterwidget.js',
    'o5ui/js/editwidgets.js',
    'o5ui/js/utils.js',
)

js_editor_app = Bundle(
    'o5ui/js/eventeditor.js'
)

css_libs = ['vendor/bootstrap/css/bootstrap.css']
if leaflet:
    css_libs.append('vendor/leaflet/leaflet.css')
    css_libs.append('vendor/leaflet/leaflet.draw.css')
css_libs = Bundle(*css_libs)

css_editor_libs = Bundle(
    'vendor/datepicker.css'
)

css_app = Bundle(
    'o5ui/css/index.css'
)

css_main = Bundle(
    css_libs,
    css_app,
    filters='cssrewrite',
    output='gen/main.css'
)

css_editor = Bundle(
    css_editor_libs,
    filters='cssrewrite',
    output='gen/editor.css'
)

jst_main = Bundle(
    'o5ui/jst/event_info.html',
    'o5ui/jst/notification.html',
    'o5ui/jst/filter_widget.html',
    'o5ui/jst/filter_widget_dialog.html',
    'o5ui/jst/filter_widget_item.html',
    'o5ui/jst/event_list.html',
    filters=[jst_filter],
    output='gen/jst.js'
)

jst_editor = Bundle(
    'o5ui/jst/event_editor.html',
    'o5ui/jst/map_edit_widget.html',
    filters=[jst_filter],
    output='gen/editor_jst.js'
)

js_main = Bundle(
    js_libs,
    jst_main,
    js_app,
    filters='rjsmin',
    output='gen/main.js'
)

js_editor = Bundle(
    js_editor_libs,
    js_editor_app,
    jst_editor,
    filters='rjsmin',
    output='gen/editor.js'
)

locale_fr = Bundle(
    'vendor/jed.js',
    'i18n/fr.js',
    filters='rjsmin',
    output='gen/fr.js'
)

register('css_main', css_main)
register('js_main', js_main)
register('css_editor', css_editor)
register('js_editor', js_editor)
register('locale_fr', locale_fr)
