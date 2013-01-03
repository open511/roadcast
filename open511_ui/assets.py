from django_assets import Bundle, register
from webassets.filter.jst import JST

jst_filter = JST(template_function='_.template')

js_libs = Bundle(
    'vendor/jquery.js',
    'vendor/lodash.js',
    'vendor/backbone.js',
    'vendor/bootstrap/js/bootstrap-alert.js',
    'vendor/bootstrap/js/bootstrap-transition.js',
)

js_editor_libs = Bundle(
    'vendor/datepicker.js'
)

js_gmaps = Bundle(
    'o5ui/js/geojson-to-google.js',
    'o5ui/js/map.js'
)

js_app = Bundle(
    'o5ui/js/main.js',
    'o5ui/js/layout.js',
    'o5ui/js/roadevent.js',
    'o5ui/js/eventdetail.js',
    'o5ui/js/roadevent.js',
    'o5ui/js/router.js',
    js_gmaps,
    'o5ui/js/utils.js'
)

js_editor_app = Bundle(
    'o5ui/js/eventeditor.js'
)

css_libs = Bundle(
    'vendor/bootstrap/css/bootstrap.css'
)

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

register('css_main', css_main)
register('js_main', js_main)
register('css_editor', css_editor)
register('js_editor', js_editor)
