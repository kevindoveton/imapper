// datecompare
moment = require('moment');
module.exports = {
	lt: function (date) {
		date = moment(date,"DD-MMM-YYYY");
		return function (d,format) {
			var m = moment(d,format);
			return m.diff(date) < 0 && m.date() !== date.date();
		};
	},
	ge: function (date) {
		date = moment(date,"DD-MMM-YYYY");
		return function (d,format) {
			var m = moment(d,format);
			return m.diff(date,'days') > 0 || (m.diff(date,'days') === 0 && m.date() === date.date());
		};
	},
	eq: function (date) {
		date = moment(date,"DD-MMM-YYYY");
		return function (d,format) {
			var m = moment(d,format);
			return m.diff(date,'days') === 0 && m.date() === date.date();
		};
	}
};