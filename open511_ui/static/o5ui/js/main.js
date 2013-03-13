(function() {
window.O5 = window.O5 || {};
window.O5.utils = {};
window.O5.prototypes = {};
window.O5.init = function(opts) {

    _.defaults(opts, {
      enableEditing: false,
      elementSelector: '#main'
    });
    _.extend(O5, opts);

    var app = {};

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
    O5.map = new O5.views.MapView();
    $('.mappane').append(O5.map.el);
    O5.map.render();

    var filterWidget = new O5.views.FilterView({app:app});
    $('.mappane-buttons').prepend(filterWidget.el);
    filterWidget.render();

    app.activeFilter = new O5.prototypes.FilteredSet({
      app: app
    });

    var events = new O5.RoadEvents();
    O5.events = events;

    var addToMap = function(event) {
      if (!app.activeFilter.evaluateEvent(event)) {
        event.set('visible', false);
      }
      O5.map.addRoadEvent(event);
    };

    events.on('reset', function() {
      events.each(addToMap);
    });

    events.on('add', addToMap);

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
      O5.editableJurisdictionSlugs = [];
      _.each(O5.jurisdictions, function(jur) {
        if (jur.editable) {
          O5.editableJurisdictionSlugs.push(jur.slug);
        }
      });
      if (O5.editableJurisdictionSlugs.length && $('.add-event .dropdown-menu').length) {
        if (O5.editableJurisdictionSlugs.length === 1) {
          // No need for a dropdown
          $('.add-event.single').show();
          $('.add-event.single .create-new-event').attr('data-slug', O5.editableJurisdictionSlugs[0]);
        }
        else {
          _.each(O5.editableJurisdictionSlugs, function(js) {
            var $link = $('<a href="#" tabindex="-1"/>');
            $link.text(js).attr('data-slug', js);
            var $li = $('<li />').append($link);
            $('.add-event.multiple .dropdown-menu').append($li);
          });
          $('.add-event.multiple').show();
        }
      }
    }

    events.fetch({ update: true, remove: false });

    O5.router = new O5.prototypes.Router();

    O5.app = app;

    Backbone.history.start({ pushState: true, root: O5.rootURL });

    return app;

};
window.O5.views = {
  BaseView: Backbone.View.extend({
    initialize: function() {
      this.app = this.options.app;
    }
  })
};
})();
