from django.shortcuts import render

def main(request, event_slug=None):
    return render(request, "o5ui/main.html", {
        'enable_editing': request.user.is_authenticated()
    })