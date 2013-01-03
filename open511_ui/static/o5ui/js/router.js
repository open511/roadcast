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
      if (event) {
        event.select();
      }
      else {
        // We need to fetch the data for the event
        event = new O5.RoadEvent({
          id: eventID,
          url: O5.events.url() + eventID + '/'
        });
        event.fetch({
          success: function() {
            O5.events.add(event);
            event = O5.events.get(eventID); // In case a duplicate has since been added
            event.select();
          }
        });
      }
    }

  });

})();
