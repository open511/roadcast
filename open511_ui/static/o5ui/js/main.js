window.O5 = window.O5 || {};
window.O5.utils = {};
window.O5.views = {};
window.O5.prototypes = {};
window.O5.init = function(opts) {

    _.defaults(opts, {
      enableEditing: false,
      elementSelector: '#main'
    });
    _.extend(O5, opts);

    $(document).ajaxError(function(e, xhr, settings, exception) {
      O5.utils.notify(xhr.responseText, 'error');
    });

    O5.layout = new O5.prototypes.Layout($(O5.elementSelector));
    O5.layout.draw();

    var $window = $(window);
    $window.resize(function() {
      O5.layout.change({
        height: $window.height(),
        width: $window.width()
      });
    });

    O5.detailViewer = new O5.views.EventDetailView();
    O5.map = new O5.views.MapView({
      el: $('.mappane')[0]
    });

    O5.map.render();

    var events = new O5.RoadEvents();
    O5.events = events;

    events.on('reset', function() {
      events.each(function(event) {
        O5.map.addRoadEvent(event);
      });
    });

    events.on('add', function(event) {
      O5.map.addRoadEvent(event);
    });

    events.on('selection', function(event) {
      O5.detailViewer.displayEvent(event);
      O5.layout.setLeftPane(O5.detailViewer);
      event.navigateTo();
    });

    if (O5.enableEditing) {
      O5.editor = new O5.views.EventEditorView();
      events.on('edit', function(event) {
        O5.editor.selectEvent(event);
        O5.layout.setLeftPane(O5.editor);
      });
    }

    events.fetch({ update: true, remove: false });

    O5.router = new O5.prototypes.Router();

    Backbone.history.start({ pushState: true, root: O5.rootURL });

};
