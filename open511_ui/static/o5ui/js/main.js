$(function() {
    var drawPage = function() {
      var topOffset = $('.header').outerHeight();
      var leftOffset = $('.infopane').outerWidth();
      $('.infopane,.mappane').height($(window).height() - topOffset);
      $('.mappane').width($(window).width() - leftOffset).css({left: leftOffset, top: topOffset});
    };
    drawPage();
    $(window).resize(drawPage);

    O5.detailViewer = new O5.views.EventDetailView({
      el: $('.infopane')[0]
    });
    O5.editor = new O5.views.EventEditorView({
      el: $('.infopane')[0]
    });
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
      event.navigateTo();
    });

    events.on('edit', function(event) {
      O5.editor.selectEvent(event);
    });

    events.fetch();

    O5.router = new O5.prototypes.Router();

    Backbone.history.start({ pushState: true, root: O5.rootURL });

});
