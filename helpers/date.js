'use strict';
var moment = require('moment-timezone');

module.exports = {
  toElapsedTime : function(date){
    var timeAgo = '',
        momentDate = moment.utc(date),
        momentDateNow = moment.utc();
    if (momentDate.isValid()) {
      if (momentDate.isAfter(momentDateNow)) {
        momentDate = momentDateNow;
      }
      timeAgo = momentDate.from();
    }

    return timeAgo;
  }
};
