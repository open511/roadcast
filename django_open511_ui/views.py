from base64 import b64encode
import datetime
from hashlib import sha1
import hmac
import json
from uuid import uuid4

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core import urlresolvers
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.safestring import mark_safe

from django_open511_ui.conf import settings

try:
    from open511.models import Jurisdiction
except ImportError:
    Jurisdiction = None

def main(request, event_slug=None):
    enable_editing = request.user.is_authenticated()

    opts = {
        'rootURL': urlresolvers.reverse('o5ui_home'),
        'apiURL': unicode(settings.OPEN511_UI_API_URL),
        'staticURL': settings.STATIC_URL,
        'enableEditing': enable_editing,
        'mapStartLat': settings.OPEN511_UI_MAP_START_LAT,
        'mapStartLng': settings.OPEN511_UI_MAP_START_LNG,
        'mapStartZoom': settings.OPEN511_UI_MAP_START_ZOOM,
        'pushState': True,
    }

    if enable_editing and settings.OPEN511_UI_AWS_ACCESS_KEY:
        opts['fileUploadURL'] = urlresolvers.reverse('o5ui_file_upload')

    if settings.OPEN511_UI_MAP_TYPE == 'leaflet':
        if settings.OPEN511_UI_MAP_TILE_URL:
            opts['mapTileURL'] = settings.OPEN511_UI_MAP_TILE_URL
        if settings.OPEN511_UI_MAP_TILE_OPTIONS:
            opts['mapTileOptions'] = settings.OPEN511_UI_MAP_TILE_OPTIONS

    if Jurisdiction is not None:
        opts['jurisdictions'] = list(Jurisdiction.objects.all().values('slug'))

        if enable_editing:
            editable_jurisdictions = Jurisdiction.objects.filter(
                permitted_users=request.user).values_list('slug', flat=True)
            for j in opts['jurisdictions']:
                if j['slug'] in editable_jurisdictions:
                    j['editable'] = True

    gmaps = settings.OPEN511_UI_MAP_TYPE == 'google'
    main_js = 'o5ui/js/open511-complete-' + ('googlemaps' if gmaps else 'leaflet') + ('.min' if not settings.DEBUG else '') + '.js'

    if settings.OPEN511_UI_SHOW_LOGIN_BUTTON:
        opts['externalAuth'] = {
            'loginURL': urlresolvers.reverse('login'),
            'logoutURL': urlresolvers.reverse('logout'),
        }
        if request.user.is_authenticated():
            opts['externalAuth']['currentUser'] = (request.user.get_full_name()
                if request.user.get_full_name() else request.user.username)

    ctx = {
        'opts': mark_safe(json.dumps(opts)),
        'enable_editing': enable_editing,
        'gmaps': gmaps,
        'js_files': [main_js],  # FIXME load editor only if necessary
        'header_title': settings.OPEN511_UI_HEADER_TITLE,
        'show_auth_buttons': settings.OPEN511_UI_SHOW_LOGIN_BUTTON,
    }

    return render(request, "o5ui/main.html", ctx)

if settings.OPEN511_UI_REQUIRE_LOGIN:
    main = login_required(main)

@login_required
def s3_file_upload_helper(request):
    if not settings.OPEN511_UI_AWS_ACCESS_KEY:
        return HttpResponse("File upload not configured", status_code=500)
    def make_policy(key):
        policy_object = {
            "expiration": (datetime.datetime.now() + datetime.timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            "conditions": [
                { "bucket": settings.OPEN511_UI_FILE_UPLOAD_S3_BUCKET },
                { "acl": "public-read" },
                { "key": key},
                { "success_action_status": "201" },
                ["starts-with", "$Content-Type", ""],
                ["content-length-range", 0, 10048576], # 10 MB
            ]
        }
        return b64encode(json.dumps(policy_object).replace('\n', '').replace('\r', ''))

    def sign_policy(policy):
        return b64encode(hmac.new(settings.OPEN511_UI_AWS_SECRET_KEY, policy, sha1).digest())

    key = "attachments/" + uuid4().hex + "/" + request.GET.get('filename', 'f')
    policy = make_policy(key)
    return HttpResponse(json.dumps({
        "policy": policy,
        "signature": sign_policy(policy),
        "key": key,
        "AWSAccessKeyId": settings.OPEN511_UI_AWS_ACCESS_KEY,
        "post_url": "https://%s.s3.amazonaws.com/" % settings.OPEN511_UI_FILE_UPLOAD_S3_BUCKET # FIXME
    }), content_type="application/json")
