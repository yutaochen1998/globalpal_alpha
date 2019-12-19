const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');
const tools = require('../javascripts/tools');

suite("demo test", function() {
    test("object boolean value", function () {
        let a = {};
        let b = "original";
        if (a.b) {
            b = "changed";
        }
        assert.equal(b, "original", "blah");
    })
});

suite("getAge() test", function() {
    test("getAge() returns the age", function () {
        let answer = 21;
        let result = tools.getAge('1998-04-01');
        assert.equal(answer, result, "increment() is not working properly!");
    })
});
