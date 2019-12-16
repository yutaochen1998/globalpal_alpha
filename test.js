const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');

function increment (number) {
    return number + 1;
}

suite("Pipeline test", function() {
    test("increment() increases the value by 1", function () {
        let a = 1;
        let b = 2;
        a = increment(a);
        assert.equal(a, b, "increment() is not working properly!");
    })
});