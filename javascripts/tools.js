function getAge(birthday_raw) {
    const moment = require('moment');
    let today = moment().format('YYYY-MM-DD').split("-");
    let birthday = birthday_raw.split("-");

    let count = today[0] - birthday[0];
    if (today[1] < birthday[1]) {
        count -= 1;
    } else if (today[1] - birthday[1] === 0) {
        if (today[2] < birthday[2]) {
            count -= 1;
        }
    }
    return count;
}

function trimMessage(message_box, message_object) {
    message_box.push(message_object);
    //no more than 20 messages
    if (message_box.length > 20) {
        message_box.shift();
    }
}

module.exports = {getAge, trimMessage};
