const suite = require('mocha').suite;
const assert = require('assert');

function increment (number) {
    return number + 1;
}

suite("Pipeline test", function() {
    test("increment() increases the value by 1", function () {
        let a = 1;
        const b = 2;
        a = increment(a);
        assert.equal(a, b, "increment() is not working properly!");
    })
});