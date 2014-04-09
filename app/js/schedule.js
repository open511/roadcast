(function() {

var weekdays = moment.langData(moment.lang())._weekdaysShort;
var getDayName = function(day) { return weekdays[day === 7 ? 0 : day]; };

var RecurringSchedule = function(data) {
	this.data = data;
	this.start_date = data.start_date ? moment(data.start_date) : null;
	this.end_date = data.end_date ? moment(data.end_date) : null;
	this.days = data.days;
	if (this.days && this.days.length) this.days.sort();
};

RecurringSchedule.prototype.inEffectOn = function(date) {
	if (date.isBefore(this.start_date) || (this.end_date && date.isAfter(this.end_date))) return false;
	if (this.days && !_.contains(this.days, date.isoWeekday())) return false;
	return true;
};

RecurringSchedule.prototype.toString = function() {
	var s = '';
	if (this.days) {
		if (this.days.length > 2 && (this.days[this.days.length - 1] - this.days[0]) === this.days.length - 1) {
			// Range: Mon-Fri
			s += getDayName(this.days[0]) + "\u2013" + getDayName(this.days[this.days.length-1]);
		}
		else {
			// Mon, Tue, Thu
			s += O5._t('every') + ' ' + _.map(this.days, getDayName).join(', ');
		}
	}
	if (this.data.start_time) {
		if (s) s += ' ';
		s += O5.utils.formatTime(this.data.start_time) + "\u202f\u2013\u202f" + O5.utils.formatTime(this.data.end_time);
	}
	if (s) s += ', ';

	if (this.start_date.isBefore()) {
		if (this.end_date) {
			s += O5._t('until') + ' ' + O5.utils.formatDate(this.end_date);
		}
		else {
			s += O5._t('since') + ' ' + O5.utils.formatDate(this.start_date);
		}
	}
	else {
		if (this.end_date) {
			s += O5.utils.formatDate(this.start_date) + "\u202f\u2013\u202f" + O5.utils.formatDate(this.end_date);
		}
		else {
			s+= O5._t('starting') + ' ' + O5.utils.formatDate(this.start_date);
		}
	}
	return s;
};

var SpecificDatesSchedule = function(specifics) {
	var dates = {};
	_.each(specifics, function(specific) {
		var bits = specific.split(' ');
		dates[bits.shift()] = bits;
	});
	this.dates = dates;
	this.dateList = _.keys(dates);
	this.dateList.sort();
};

SpecificDatesSchedule.prototype.toStrings = function() {
	var self = this;
	return _.map(this.dateList, function(date) {
		var s = O5.utils.formatDate(moment(date)) + ' ';
		if (self.dates[date].length) {
			s += _.map(self.dates[date], function(timerange) {
				var bits = timerange.split('-');
				return O5.utils.formatTime(bits[0]) + "\u202f\u2013\u202f" + O5.utils.formatTime(bits[1]);
			}).join(', ');
		}
		else {
			s += O5._t('not in effect');
		}
		return s;
	});
};

SpecificDatesSchedule.prototype.inEffectOn = function(date) {
	// date is a Moment object
	// returns true, false, or null
	var d = date.format('YYYY-MM-DD');
	if (!this.dates[d]) return null;
	return this.dates[d].length >= 1;
};

SpecificDatesSchedule.prototype.earliestDate = function() {
	for (var i = 0; i < this.dateList.length; i++) {
		if (this.dates[this.dateList[i]].length >= 1) return moment(this.dateList[i]);
	}
};

SpecificDatesSchedule.prototype.latestDate = function() {
	for (var i = this.dateList.length - 1; i >= 0; i--) {
		if (this.dates[this.dateList[i]].length >= 1) return moment(this.dateList[i]);
	}
};

var Schedule = function(schedules) {
	this.schedules = [];
	if (!schedules) return;
	for (var i = 0; i < schedules.length; i++) {
		if (schedules[i].hasOwnProperty('specific_dates')) {
			if (this.specific) throw "Multiple specific_dates blocks";
			this.specific = new SpecificDatesSchedule(schedules[i].specific_dates);
		}
		else {
			this.schedules.push(new RecurringSchedule(schedules[i]));
		}
	}
};

_.extend(Schedule.prototype, {

	toStrings: function() {
		var scheduled = _.map(this.schedules, function(sched) { return sched.toString(); });
		var specific = this.specific ? this.specific.toStrings() : [];
		return scheduled.concat(specific);
	},

	inEffectOn: function(date) {
		if (!date) date = moment();
		if (this.specific) {
			var spec = this.specific.inEffectOn(date);
			if (!_.isNull(spec)) return spec;
		}
		return _.any(this.schedules, function(sched) { return sched.inEffectOn(date); });
	},

	earliestDate: function() {
		// TODO doesn't take into account weekdays in recurring schedules
		var candidates = _.map(this.schedules, function(sched) { return sched.start_date; });
		if (this.specific) {
			var spec = this.specific.earliestDate();
			if (spec) candidates.push(spec);
		}
		return _.min(candidates, function(d) { return d.unix(); });
	},

	latestDate: function() {
		// TODO doesn't take into account weekdays in recurring schedules
		var candidates = _.map(this.schedules, function(sched) { return sched.end_date; });
		if (!_.all(candidates))
			return '';
		if (this.specific) {
			var spec = this.specific.latestDate();
			if (spec) candidates.push(spec);
		}
		return _.min(candidates, function(d) { return d.unix(); });
	}


});

O5.prototypes.Schedule = Schedule;

})();