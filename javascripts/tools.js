function getAge(birthday_raw)
{
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

module.exports = {getAge};
