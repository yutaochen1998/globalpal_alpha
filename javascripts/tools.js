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
    //trim message box and limit to 30 messages
    message_box.push(message_object);
    if (message_box.length > 30) {
        message_box.shift();
    }
}

function selectPipeline(gender, userID, userID_search) {
    //return the database search pipeline based on selected gender and prevent from getting two same result in a row
    return (gender === "all")?{email: {$nin: [userID, userID_search]}}:{gender: gender, email: {$nin: [userID, userID_search]}}
}

module.exports = {getAge, trimMessage, selectPipeline};
