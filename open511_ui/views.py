from django.shortcuts import render

from open511_ui.conf import settings

def main(request, event_slug=None):
    ctx = {
        'api_url': settings.OPEN511_UI_API_URL,
        'enable_editing': request.user.is_authenticated()
    }

    return render(request, "o5ui/main.html", ctx)