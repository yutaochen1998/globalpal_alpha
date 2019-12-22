const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');
const tools = require('../javascripts/tools');

suite("getAge() @ /javascripts/tools.js", function() {
    test("getAge() returns the correct age", function () {
        //test result changes upon date, only valid on the test day
        const date_1 = '1998-04-01';
        const result_1 = tools.getAge(date_1);
        const date_2 = '1998-12-20';
        const result_2 = tools.getAge(date_2);
        const date_3 = '1997-01-20';
        const result_3 = tools.getAge(date_3);
        assert.equal(result_1, 21, "incorrect with " + date_1);
        assert.equal(result_2, 21, "incorrect with " + date_2);
        assert.equal(result_3, 22, "incorrect with " + date_3);
    })
});

suite("trimMessage() @ /javascripts/tools.js", function() {
    test("trimMessage() limits the message box at 30 messages", function () {
        let message_box = [];
        const message_object = {message: "test"};
        for (let i = 0; i < 29; i++) {
            message_box.push(message_object);
        }
        tools.trimMessage(message_box, message_object);
        assert.equal(message_box.length, 30, "incorrect when length === 29");
        tools.trimMessage(message_box, message_object);
        assert.equal(message_box.length, 30, "incorrect when length === 30");
    })
});
