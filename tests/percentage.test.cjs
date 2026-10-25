"use strict";
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { percentOf, whatPercent, percentageChange, discount, formatNumber, formatPrice } = require('../percentage.js');

function near(actual, expected) {
    assert.ok(Math.abs(actual - expected) <= 1e-12 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

for (const [percentage, value, expected] of [[15, 200, 30], [0, 200, 0], [100, 0, 0], [125, 80, 100], [-10, 50, -5], [12.5, -80, -10]]) {
    test(`${percentage}% of ${value} is ${expected}`, () => near(percentOf(percentage, value), expected));
}
for (const [part, whole, expected] of [[25, 200, 12.5], [0, 40, 0], [120, 80, 150], [-5, 10, -50], [5, -10, -50]]) {
    test(`${part} out of ${whole} is ${expected}%`, () => near(whatPercent(part, whole), expected));
}
for (const [original, newValue, expected] of [[80, 100, 25], [200, 150, -25], [40, 40, 0], [60, 0, -100], [60, -60, -200], [0.1, 0.15, 50]]) {
    test(`change from ${original} to ${newValue} is ${expected}%`, () => near(percentageChange(original, newValue), expected));
}
for (const [price, percentage, finalPrice, savings] of [[200, 15, 170, 30], [99.99, 20, 79.992, 19.998], [60, 0, 60, 0], [60, 100, 0, 60], [0, 50, 0, 0]]) {
    test(`${percentage}% discount on ${price}`, () => {
        const amounts = discount(price, percentage);
        near(amounts.finalPrice, finalPrice);
        near(amounts.savings, savings);
    });
}

test('handles very large values whose final result is finite', () => {
    assert.equal(percentOf(100, Number.MAX_VALUE), Number.MAX_VALUE);
    assert.equal(whatPercent(Number.MAX_VALUE, Number.MAX_VALUE), 100);
    assert.equal(percentageChange(Number.MAX_VALUE, -Number.MAX_VALUE), -200);
    assert.equal(discount(Number.MAX_VALUE, 100).finalPrice, 0);
});
test('retains representable tiny values', () => {
    assert.equal(percentOf(100, Number.MIN_VALUE), Number.MIN_VALUE);
    assert.equal(whatPercent(Number.MIN_VALUE, 100), Number.MIN_VALUE);
});
test('formats decimal noise, signed zero, and tiny values', () => {
    assert.equal(formatNumber(0.1 + 0.2), '0.3');
    assert.equal(formatNumber(-0), '0');
    assert.equal(formatNumber(1e-20), '1e-20');
    assert.equal(formatNumber(1 / 3), '0.333333333333');
});
test('formats prices without assuming a currency', () => {
    assert.equal(formatPrice(79.992), '79.99');
    assert.equal(formatPrice(0), '0.00');
    assert.equal(formatPrice(1234.5), '1,234.50');
});
test('rejects zero whole and nonpositive original values', () => {
    assert.throws(() => whatPercent(1, 0), /Whole cannot be 0/);
    assert.throws(() => whatPercent(1, -0), /Whole cannot be 0/);
    assert.throws(() => percentageChange(0, 1), /greater than 0/);
    assert.throws(() => percentageChange(-10, -5), /greater than 0/);
});
test('rejects discounts outside the price and percentage bounds', () => {
    assert.throws(() => discount(-1, 10), /0 or greater/);
    assert.throws(() => discount(100, -1), /between 0 and 100/);
    assert.throws(() => discount(100, 100.01), /between 0 and 100/);
});
for (const invalid of [NaN, Infinity, -Infinity, '', '20', null, undefined]) {
    test(`rejects nonnumeric or nonfinite input ${String(invalid)}`, () => {
        for (const calculate of [percentOf, whatPercent, percentageChange, discount]) {
            assert.throws(() => calculate(invalid, 1), /finite number/);
            assert.throws(() => calculate(1, invalid), /finite number/);
        }
    });
}
test('rejects results beyond the finite number range', () => {
    assert.throws(() => percentOf(1e308, 1e308), /too large/);
    assert.throws(() => whatPercent(1e308, 0.01), /too large/);
    assert.throws(() => percentageChange(1e-308, 1e308), /too large/);
    assert.throws(() => formatNumber(Infinity), /too large/);
});
