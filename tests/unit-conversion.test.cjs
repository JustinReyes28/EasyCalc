'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { convertUnitValue: convert, formatConversionResult: format, initializeConversionCard } = require('../unit-conversion.js');

for (const [category, value, from, to, expected] of [
    ['length', 1, 'm', 'cm', 100], ['length', 1, 'ft', 'in', 12], ['length', 1, 'mi', 'm', 1609.34],
    ['weight', 1, 'kg', 'g', 1000], ['weight', 1, 'lb', 'g', 453.592], ['weight', 1, 'g', 'mg', 1000],
    ['volume', 1, 'l', 'ml', 1000], ['volume', 1, 'gal', 'l', 3.78541], ['volume', 1, 'cup', 'ml', 240],
    ['time', 1, 'hr', 'min', 60], ['time', 1, 'yr', 'day', 365], ['time', 1, 'mo', 'day', 365 / 12],
    ['time', 1, 'ns', 's', 1e-9], ['time', 1, '\u03bcs', 's', 1e-6],
    ['temp', 0, 'c', 'f', 32], ['temp', 100, 'c', 'k', 373.15],
    ['temp', 32, 'f', 'c', 0], ['temp', 32, 'f', 'k', 273.15],
    ['temp', 273.15, 'k', 'c', 0], ['temp', 273.15, 'k', 'f', 32],
    ['temp', -40, 'c', 'f', -40], ['temp', -40, 'f', 'c', -40],
    ['length', -2, 'm', 'cm', -200], ['length', 0, 'km', 'm', 0]
]) {
    test(`converts ${category}: ${value} ${from} to ${to}`, () => {
        assert.ok(Math.abs(convert(category, value, from, to) - expected) <= 1e-12 * Math.max(1, Math.abs(expected)));
    });
}

test('temperature round trips preserve negative values through all scales', () => {
    for (const from of ['c', 'f', 'k']) for (const to of ['c', 'f', 'k']) {
        const original = -12.3456;
        assert.ok(Math.abs(convert('temp', convert('temp', original, from, to), to, from) - original) < 1e-10);
    }
});

test('formats up to 12 significant digits without hiding tiny results or negative zero', () => {
    assert.equal(format(0.1 + 0.2), '0.3');
    assert.equal(format(1e-12), '1e-12');
    assert.equal(format(123456789012345), '123456789012000');
    assert.equal(format(-0), '0');
    assert.equal(format(1.23456789012345), '1.23456789012');
});

test('rejects invalid numbers, unknown units, and unrepresentable results', () => {
    for (const value of [NaN, Infinity, -Infinity, '', '12', null]) {
        assert.throws(() => convert('length', value, 'm', 'cm'), RangeError);
    }
    for (const [category, value, from, to] of [
        ['length', 1, 'bogus', 'm'], ['temp', 1, 'c', 'bogus'], ['bogus', 1, 'm', 'm'],
        ['length', Number.MAX_VALUE, 'km', 'mm'], ['time', Number.MIN_VALUE, 'ns', 'yr']
    ]) assert.throws(() => convert(category, value, from, to), RangeError);
    assert.equal(convert('length', Number.MAX_VALUE, 'km', 'km'), Number.MAX_VALUE);
    assert.equal(convert('temp', Number.MAX_VALUE, 'c', 'c'), Number.MAX_VALUE);
    assert.throws(() => format(Infinity), RangeError);
});

function cardFixture(category = 'length', clipboard) {
    const nodes = new Map();
    function element(id, value = '') {
        const listeners = {};
        const node = { id, value, textContent: '', disabled: false, hidden: false, attributes: {}, validity: { badInput: false },
            setAttribute(name, value) { this.attributes[name] = value; },
            addEventListener(name, handler) { listeners[name] = handler; },
            fire(name) { return listeners[name](); }, focus() { this.focused = true; }
        };
        nodes.set(id, node);
        return node;
    }
    const input = element(`${category}-input`);
    const from = element(`from-${category}-unit`, category === 'time' ? 's' : 'm');
    const to = element(`to-${category}-unit`, category === 'time' ? 'min' : 'cm');
    for (const suffix of ['result', 'result-value', 'result-unit', 'feedback', 'copy-feedback', 'copy', 'swap']) element(`${category}-${suffix}`);
    if (category === 'time') element('time-note');
    const selection = { removeAllRanges() {}, addRange(range) { this.node = range.node; } };
    const doc = { getElementById: id => nodes.get(id), defaultView: { navigator: { clipboard }, getSelection: () => selection },
        createRange: () => ({ selectNodeContents(node) { this.node = node; } })
    };
    const controller = initializeConversionCard(category, doc);
    return { input, from, to, nodes, selection, controller, get: suffix => nodes.get(`${category}-${suffix}`) };
}

test('typing or changing units updates results immediately, with no stale copy state', () => {
    const card = cardFixture();
    assert.equal(card.get('copy').disabled, true);
    assert.equal(card.get('result-value').textContent, '\u2014');
    card.input.value = '1.5';
    card.input.fire('input');
    assert.equal(card.get('result-value').textContent, '150');
    assert.equal(card.get('copy').disabled, false);
    card.to.value = 'mm';
    card.to.fire('change');
    assert.equal(card.get('result-value').textContent, '1500');
    card.from.value = 'cm';
    card.from.fire('change');
    assert.equal(card.get('result-value').textContent, '15');
    card.input.value = '';
    card.input.fire('input');
    assert.equal(card.get('result-value').textContent, '\u2014');
    assert.equal(card.get('result-unit').textContent, '');
    assert.equal(card.get('copy').disabled, true);
    assert.match(card.get('feedback').textContent, /Enter a value/);
});

test('zero is a valid copyable result; invalid and overflow input clears it', () => {
    const card = cardFixture();
    for (const value of ['0', '-2']) {
        card.input.value = value;
        card.input.fire('input');
        assert.equal(card.get('copy').disabled, false);
        assert.equal(card.get('result-value').textContent, value === '0' ? '0' : '-200');
    }
    for (const value of ['Infinity', '12abc', '1e309']) {
        card.input.value = value;
        card.input.fire('input');
        assert.equal(card.input.attributes['aria-invalid'], 'true');
        assert.equal(card.get('copy').disabled, true);
        assert.equal(card.get('result-value').textContent, '\u2014');
    }
    card.input.value = '';
    card.input.validity.badInput = true;
    card.input.fire('input');
    assert.match(card.get('feedback').textContent, /finite number/);
    card.input.validity.badInput = false;
    card.input.value = String(Number.MAX_VALUE);
    card.input.fire('input');
    assert.match(card.get('feedback').textContent, /too large/);
    assert.equal(card.get('copy').disabled, true);
});

test('swapping units updates the current input in the opposite direction', () => {
    const card = cardFixture();
    card.input.value = '2';
    card.input.fire('input');
    card.get('swap').fire('click');
    assert.equal(card.from.value, 'cm');
    assert.equal(card.to.value, 'm');
    assert.equal(card.input.value, '2');
    assert.equal(card.get('result-value').textContent, '0.02');
});

test('copy writes only the current formatted value and clears feedback on edits', async () => {
    const copied = [];
    const card = cardFixture('length', { async writeText(value) { copied.push(value); } });
    card.input.value = '3';
    card.input.fire('input');
    await card.get('copy').fire('click');
    assert.deepEqual(copied, ['300']);
    assert.equal(card.get('copy-feedback').textContent, 'Copied.');
    card.input.value = '4';
    card.input.fire('input');
    assert.equal(card.get('copy-feedback').textContent, '');
    card.input.value = '';
    await card.get('copy').fire('click');
    assert.deepEqual(copied, ['300']);
    assert.equal(card.get('copy').disabled, true);
});

test('unavailable or denied clipboard access selects the current result for manual copy', async () => {
    for (const clipboard of [undefined, { async writeText() { throw new Error('Denied'); } }]) {
        const card = cardFixture('length', clipboard);
        card.input.value = '2';
        card.input.fire('input');
        await card.get('copy').fire('click');
        assert.equal(card.selection.node, card.get('result-value'));
        assert.equal(card.get('result').focused, true);
        assert.match(card.get('copy-feedback').textContent, /Result selected/);
    }
});

test('a delayed clipboard result does not overwrite feedback after input changes', async () => {
    let finish;
    const card = cardFixture('length', { writeText() { return new Promise(resolve => { finish = resolve; }); } });
    card.input.value = '2';
    card.input.fire('input');
    const pending = card.get('copy').fire('click');
    card.input.value = '';
    card.input.fire('input');
    finish();
    await pending;
    assert.equal(card.get('copy-feedback').textContent, '');
    assert.equal(card.get('copy').disabled, true);
});

test('fixed month and year definitions appear only when used', () => {
    const card = cardFixture('time');
    const note = card.nodes.get('time-note');
    assert.equal(note.hidden, true);
    card.from.value = 'mo';
    card.from.fire('change');
    assert.equal(note.hidden, false);
    assert.match(note.textContent, /1 month = 1\/12/);
    card.from.value = 'yr';
    card.from.fire('change');
    assert.match(note.textContent, /365 days/);
    card.from.value = 's';
    card.from.fire('change');
    assert.equal(note.hidden, true);
});
