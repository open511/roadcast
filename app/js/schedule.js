(function() {

var weekdays = moment.langData(moment.lang())._weekdaysShort;
var getDayName = function(day) { return weekdays[day === 7 ? 0 : day]; };

var RecurringScheduleComponent = function(data) {
	this.data = data;
	this.start_date = data.start_date ? moment(data.start_date) : null;
	this.end_date = data.end_date ? moment(data.end_date) : null;
	this.days = data.days;
	if (this.days && this.days.length) this.days.sort();
};

RecurringScheduleComponent.prototype.inEffectOn = function(date) {
	if (date.isBefore(this.start_date) || (this.end_date && date.isAfter(this.end_date))) return false;
	if (this.days && !_.contains(this.days, date.isoWeekday())) return false;
	return true;
};

RecurringScheduleComponent.prototype.toString = function() {
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
	if (this.data.daily_start_time) {
		if (s) s += ' ';
		s += O5.utils.formatTime(this.data.daily_start_time) + "\u202f\u2013\u202f" + O5.utils.formatTime(this.data.daily_end_time);
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

var ExceptionComponent = function(specifics) {
	var dates = {};
	_.each(specifics, function(specific) {
		var bits = specific.split(' ');
		dates[bits.shift()] = bits;
	});
	this.dates = dates;
	this.dateList = _.keys(dates);
	this.dateList.sort();
};

ExceptionComponent.prototype.toStrings = function() {
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

ExceptionComponent.prototype.inEffectOn = function(date) {
	// date is a Moment object
	// returns true, false, or null
	var d = date.format('YYYY-MM-DD');
	if (!this.dates[d]) return null;
	return this.dates[d].length >= 1;
};

ExceptionComponent.prototype.earliestDate = function() {
	for (var i = 0; i < this.dateList.length; i++) {
		if (this.dates[this.dateList[i]].length >= 1) return moment(this.dateList[i]);
	}
};

ExceptionComponent.prototype.latestDate = function() {
	for (var i = this.dateList.length - 1; i >= 0; i--) {
		if (this.dates[this.dateList[i]].length >= 1) return moment(this.dateList[i]);
	}
};

var IntervalScheduleComponent = function(data) {
	timestamps = data.split('/');
	this.start_datetime = moment(timestamps[0]);
	this.start_date = moment(timestamps[0].split('T')[0]);
	if (timestamps[1]) {
		this.end_datetime = moment(timestamps[1]);
		this.end_date = moment(timestamps[1].split('T')[0]);
	}
};

IntervalScheduleComponent.prototype.inEffectOn = function(date) {
	if (date.isBefore(this.start_date) || (this.end_date && date.isAfter(this.end_date))) return false;
	return true;
};

IntervalScheduleComponent.prototype.toString = function() {
	s = '';
	if (!this.end_date) {
		s = O5._t('From') + ' ';
	}
	s += this.start_datetime.format('lll');
	if (this.end_date) {
		s += "\u202f\u2013\u202f";
		s += this.end_datetime.format('lll');
	}
	return s;
};

var Schedule = function(schedule) {
	if (!schedule) return;
	if (schedule.intervals) {
		this.intervals = _.map(schedule.intervals, function(i) { return new IntervalScheduleComponent(i); });
		this.schedules = this.intervals;
	}
	else {
		this.recurring_schedules = _.map(schedule.recurring_schedules, function(s) { return new RecurringScheduleComponent(s); });
		this.schedules = this.recurring_schedules;
		if (schedule.exceptions) this.exceptions = new ExceptionComponent(schedule.exceptions);
	}
};

_.extend(Schedule.prototype, {

	toStrings: function() {
		if (this.intervals) return _.map(this.intervals, function(i) { return i.toString(); });

		var scheduled = _.map(this.recurring_schedules, function(sched) { return sched.toString(); });
		if (this.exceptions) scheduled = scheduled.concat(this.exceptions.toStrings());
		return scheduled;
	},

	inEffectOn: function(date) {
		if (!date) date = moment();
		if (this.exceptions) {
			var spec = this.exceptions.inEffectOn(date);
			if (!_.isNull(spec)) return spec;
		}
		return _.any(this.schedules, function(sched) { return sched.inEffectOn(date); });
	},

	earliestDate: function() {
		// TODO doesn't take into account weekdays in recurring schedules
		var candidates = _.map(this.schedules, function(sched) { return sched.start_date; });
		if (this.exceptions) {
			var spec = this.exceptions.earliestDate();
			if (spec) candidates.push(spec);
		}
		if (!candidates.length) return null;
		return _.min(candidates, function(d) { return d.unix(); });
	},

	latestDate: function() {
		// TODO doesn't take into account weekdays in recurring schedules
		var candidates = _.map(this.schedules, function(sched) { return sched.end_date; });
		if (!_.all(candidates))
			return;
		if (this.exceptions) {
			var spec = this.exceptions.latestDate();
			if (spec) candidates.push(spec);
		}
		if (!candidates.length) return null;
		return _.max(candidates, function(d) { return d.unix(); });
	}


});

O5.prototypes.Schedule = Schedule;

})();