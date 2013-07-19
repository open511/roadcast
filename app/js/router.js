(function(){

	O5.prototypes.Router = Backbone.Router.extend({
		routes: {
			"": "index",
			"events/*eventID": "eventDetails"
		},

		index: function() {
			O5.app.layout.setLeftPane(null);
		},

		eventDetails: function(eventID) {
			var event = O5.app.events.get(eventID);
			if (event) {
				event.select({ panTo: true});
			}
			else {
				// We need to fetch the data for the event
				event = new O5.RoadEvent({
					id: eventID,
					url: O5.app.events.url + eventID + '/'
				});
				event.fetch({
					success: function() {
						O5.app.events.add(event);
						event = O5.app.events.get(eventID); // In case a duplicate has since been added
						event.select({
							panTo: true
						});
					}
				});
			}
		}

	});

})();
