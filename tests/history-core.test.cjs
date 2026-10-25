'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHistory, STORAGE_KEY, MAX_ENTRIES } = require('../history-core.js');

function memoryStorage(initial) {
    let value = initial ?? null;
    return {
        getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
        setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
        removeItem(key) { assert.equal(key, STORAGE_KEY); value = null; },
        value: () => value,
    };
}
const entry = (result = 5) => ({ expression: '2+3', result, mode: null });

test('successful calculations persist with the original expression and exact numeric result', () => {
    const storage = memoryStorage();
    const history = createHistory(storage);
    const result = Math.PI / 3;
    assert.equal(history.add({ expression: 'pi/3', result, mode: 'rad' }), true);
    assert.deepEqual(createHistory(storage).entries(), [{ expression: 'pi/3', result, mode: 'rad' }]);
});

test('history keeps the 20 most recent calculations, newest first', () => {
    const storage = memoryStorage();
    const history = createHistory(storage);
    for (let i = 0; i < 35; i++) history.add({ expression: `${i}+1`, result: i + 1, mode: null });
    assert.equal(history.entries().length, MAX_ENTRIES);
    assert.deepEqual(history.entries().map(value => value.result), Array.from({ length: 20 }, (_, i) => 35 - i));
    assert.deepEqual(createHistory(storage).entries(), history.entries());
});

test('read and add return independent copies rather than exposing mutable state', () => {
    const history = createHistory();
    const source = entry();
    history.add(source);
    source.result = 100;
    const saved = history.entries();
    saved[0].result = 200;
    saved.push(entry(300));
    assert.deepEqual(history.entries(), [entry()]);
});

test('clear removes persisted history and leaves the current instance empty', () => {
    const storage = memoryStorage();
    const history = createHistory(storage);
    history.add(entry());
    history.clear();
    assert.deepEqual(history.entries(), []);
    assert.equal(storage.value(), null);
    assert.deepEqual(createHistory(storage).entries(), []);
});

for (const badEntry of [
    null, [], {}, { ...entry(), expression: '' }, { ...entry(), expression: '   ' },
    { ...entry(), expression: 'a'.repeat(257) }, { ...entry(), result: '5' },
    { ...entry(), result: NaN }, { ...entry(), result: Infinity },
    { ...entry(), mode: 'turns' }, { ...entry(), mode: undefined },
]) {
    test(`rejects invalid history entry ${JSON.stringify(badEntry)}`, () => {
        const storage = memoryStorage();
        const history = createHistory(storage);
        assert.equal(history.add(badEntry), false);
        assert.deepEqual(history.entries(), []);
        assert.equal(storage.value(), null);
    });
}

for (const badData of [
    '{broken', 'null', '{}', '[]', '1', '"hello"',
    JSON.stringify({ version: 2, entries: [entry()] }),
    JSON.stringify({ version: 1, entries: {} }),
    JSON.stringify({ version: 1, entries: [entry(), { ...entry(), result: '5' }] }),
    JSON.stringify({ version: 1, entries: Array.from({ length: 21 }, () => entry()) }),
    ' '.repeat(12001),
]) {
    test(`ignores malformed or oversized stored data ${badData.slice(0, 60)}`, () => {
        const storage = memoryStorage(badData);
        const history = createHistory(storage);
        assert.deepEqual(history.entries(), []);
        history.add(entry());
        assert.deepEqual(createHistory(storage).entries(), [entry()]);
    });
}

test('blocked reads, writes, and clears preserve usable in-memory history', () => {
    const blocked = {
        getItem() { throw new Error('blocked'); },
        setItem() { throw new Error('quota'); },
        removeItem() { throw new Error('blocked'); },
    };
    const history = createHistory(blocked);
    history.add(entry());
    assert.deepEqual(history.entries(), [entry()]);
    history.clear();
    assert.deepEqual(history.entries(), []);
    history.add(entry(9));
    assert.equal(history.entries()[0].result, 9);
});

test('history stores Ans-dependent results directly without evaluating old expressions', () => {
    const history = createHistory();
    history.add({ expression: 'ans*2', result: 10, mode: 'deg' });
    history.add({ expression: '100', result: 100, mode: null });
    const restored = history.entries()[1];
    assert.equal(restored.result, 10);
    assert.equal(restored.expression, 'ans*2');
});


test('calculator instances append to the latest shared history without overwriting each other', () => {
    const storage = memoryStorage();
    const arithmetic = createHistory(storage);
    const scientific = createHistory(storage);
    arithmetic.add(entry());
    scientific.add({ expression: 'sin(30)', result: .5, mode: 'deg' });
    arithmetic.add({ expression: '7*6', result: 42, mode: null });
    assert.deepEqual(createHistory(storage).entries(), [
        { expression: '7*6', result: 42, mode: null },
        { expression: 'sin(30)', result: .5, mode: 'deg' },
        entry(),
    ]);
});

test('adding from a stale calculator after another tab clears cannot resurrect old entries', () => {
    const storage = memoryStorage();
    const arithmetic = createHistory(storage);
    arithmetic.add(entry());
    const scientific = createHistory(storage);
    arithmetic.clear();
    scientific.add({ expression: 'cos(0)', result: 1, mode: 'deg' });
    assert.deepEqual(createHistory(storage).entries(), [{ expression: 'cos(0)', result: 1, mode: 'deg' }]);
});

test('refresh reflects another instance adding or clearing shared history', () => {
    const storage = memoryStorage();
    const first = createHistory(storage);
    const second = createHistory(storage);
    first.add(entry());
    second.refresh();
    assert.deepEqual(second.entries(), [entry()]);
    first.clear();
    second.refresh();
    assert.deepEqual(second.entries(), []);
});

test('a readable malformed snapshot replaces stale cached entries before the next add', () => {
    const storage = memoryStorage();
    const history = createHistory(storage);
    history.add(entry());
    storage.setItem(STORAGE_KEY, '{broken');
    history.add({ expression: '3*3', result: 9, mode: null });
    assert.deepEqual(createHistory(storage).entries(), [{ expression: '3*3', result: 9, mode: null }]);
});

test('a write failure preserves subsequent in-memory calculations instead of rereading an older snapshot', () => {
    const storage = memoryStorage(JSON.stringify({ version: 1, entries: [entry()] }));
    storage.setItem = () => { throw new Error('quota'); };
    const history = createHistory(storage);
    history.add({ expression: '3*3', result: 9, mode: null });
    history.refresh();
    history.add({ expression: '4*4', result: 16, mode: null });
    assert.deepEqual(history.entries().map(value => value.result), [16, 9, 5]);
    history.clear();
    history.refresh();
    assert.deepEqual(history.entries(), []);
});

test('a read failure preserves the page history while calculations and clear remain available', () => {
    const storage = memoryStorage();
    const history = createHistory(storage);
    history.add(entry());
    storage.getItem = () => { throw new Error('blocked'); };
    history.refresh();
    history.add({ expression: '3*3', result: 9, mode: null });
    assert.deepEqual(history.entries().map(value => value.result), [9, 5]);
    history.clear();
    history.refresh();
    assert.deepEqual(history.entries(), []);
});
