'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateExpression: evaluate, formatResult } = require('../calculator-engine.js');
const fs = require('node:fs');
const vm = require('node:vm');

for (const [expression, expected, options] of [
    ['2+3*4', 14], ['(2+3)*4', 20], ['2^3^2', 512], ['2**3', 8],
    ['-2^2', -4], ['(-2)^2', 4], ['2^-2', .25], ['1--2', 3],
    ['0!', 1], ['5!', 120], ['(2+3)!', 120], ['3!^2', 36],
    ['2pi', 2 * Math.PI], ['2(3+4)', 14], ['pi', Math.PI], ['e', Math.E],
    ['1e-12*2', 2e-12], ['π×2÷2', Math.PI], ['exp(1)', Math.E],
    ['sin(30)', .5], ['cos(180)', -1], ['tan(45)', 1], ['sin(180)', 0],
    ['sin(cos(0)*30)', .5], ['log(100)+ln(e)', 3], ['sqrt(9+7)', 4],
    ['sin(pi/2)', 1, { angleMode: 'rad' }], ['ans*3', 21, { answer: 7 }],
]) {
    test(`evaluates ${expression}`, () => {
        assert.ok(Math.abs(evaluate(expression, options) - expected) <= 1e-12 * Math.max(1, Math.abs(expected)));
    });
}
for (const expression of ['', '2+', '1/0', '0/0', 'sqrt(-1)', 'ln(0)', 'log(-1)', 'tan(90)', '-3!', '(-3)!', '1.5!', '171!', '2^1024', 'sin(30', '2+)', 'Math.PI', 'alert(1)', 'process.exit()', '2;3', '1..2', 'ans', '('.repeat(257)]) {
    if (expression === '-3!') continue; // Unary minus correctly applies after factorial.
    test(`rejects ${expression.slice(0, 40) || 'empty expression'}`, () => assert.throws(() => evaluate(expression), Error));
}
test('factorial binds more tightly than a unary sign', () => assert.equal(evaluate('-3!'), -6));
test('retains tiny trigonometric values', () => {
    assert.ok(evaluate('sin(1e-13)') > 0);
    assert.ok(evaluate('tan(1e-13)') > 0);
});
test('formats decimal noise without erasing very small or very large values', () => {
    assert.equal(formatResult(evaluate('0.1+0.2')), '0.3');
    assert.equal(formatResult(1e-12), '1e-12');
    assert.equal(formatResult(1e100), '1e+100');
    assert.equal(formatResult(-0), '0');
});

const health = { window: {} };
vm.createContext(health);
vm.runInContext(fs.readFileSync(require.resolve('../health.js'), 'utf8'), health);
test('body-fat formulas convert centimetres to inches for both equations', () => {
    // Known inch inputs converted to the UI units: male 35/15/70; female 30/38/13/65.
    const male = health.calculateBodyFatPercentage('male', 88.9, NaN, 38.1, 177.8);
    const female = health.calculateBodyFatPercentage('female', 76.2, 96.52, 33.02, 165.1);
    assert.ok(Math.abs(male - 19.4290781064) < 1e-8);
    assert.ok(Math.abs(female - 28.5562644086) < 1e-8);
});
for (const args of [
    ['male', 30, NaN, 40, 170], ['male', -80, NaN, 40, 170],
    ['male', 80, NaN, 40, 0], ['male', Infinity, NaN, 40, 170],
    ['female', 70, NaN, 35, 160], ['female', 30, 20, 60, 160],
]) test(`rejects invalid body-fat measurements ${args}`, () => assert.throws(() => health.calculateBodyFatPercentage(...args)));
