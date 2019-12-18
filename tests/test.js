const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');
const tools = require('../javascripts/tools');

function increment (number) {
    return number + 1;
}

suite("demo test", function() {
    test("increment() increases the value by 1", function () {
        let a = 1;
        let b = 2;
        a = increment(a);
        assert.equal(a, b, "increment() is not working properly!");
    })
});

suite("getAge() test", function() {
    test("getAge() returns the age", function () {
        let answer = 21;
        let result = tools.getAge('1998-04-01');
        assert.equal(answer, result, "increment() is not working properly!");
    })
});
