import json

from django.conf import settings
from django.core import urlresolvers
from django.shortcuts import render

from open511_ui.conf import settings

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
    }

    if Jurisdiction is not None:
        opts['jurisdictions'] = list(Jurisdiction.objects.all().values('slug'))

        if enable_editing:
            editable_jurisdictions = Jurisdiction.objects.filter(
                permitted_users=request.user).values_list('slug', flat=True)
            for j in opts['jurisdictions']:
                if j['slug'] in editable_jurisdictions:
                    j['editable'] = True

    ctx = {
        'opts': json.dumps(opts),
        'enable_editing': enable_editing,
        'gmaps': settings.OPEN511_UI_MAP_TYPE == 'google',
    }

    return render(request, "o5ui/main.html", ctx)