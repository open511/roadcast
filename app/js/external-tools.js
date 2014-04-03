// Tiny library to provide basic Open511 tools to
// other apps/pages. This code is not included in the
// main app.

window.O5 = window.O5 || { prototypes: {} };

O5.RoadEvent = function(data) {
	_.extend(this, data);
};

O5.RoadEvent.prototype.parseSchedule = function() {
	return new O5.prototypes.Schedule(this.schedules);
};