(function(){

  // Defining the application router, you can attach sub routers here.
  O5.prototypes.Router = Backbone.Router.extend({
    routes: {
      "": "index",
      "events/*eventID": "eventDetails"
    },

    index: function() {

    },

    eventDetails: function(eventID) {
      var event = O5.events.get(eventID);
      // FIXME what if we don't have the event?
      event.select();
    }

  });

})();
