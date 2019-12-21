function getAge(birthday_raw) {
    //convert YYYY-MM-DD format date into age
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
    //trim message box and limit to 20 messages
    message_box.push(message_object);
    if (message_box.length > 20) {
        message_box.shift();
    }
}

function selectPipeline(gender, userID) {
    //return the database search pipeline based on selected gender
    return (gender === "all")?{email: {$ne: userID}}:{gender: gender, email: {$ne: userID}}
}

module.exports = {getAge, trimMessage, selectPipeline};
