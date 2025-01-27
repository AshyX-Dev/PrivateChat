const momentTimezone = require("moment-timezone");

function getTime(){
    return new Date(momentTimezone.tz("Asia/Tehran").toDate().getTime());
}

module.exports = { getTime };