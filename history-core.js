(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.EasyCalcHistory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const STORAGE_KEY = 'easycalc.calculationHistory.v1';
    const MAX_ENTRIES = 20;
    const MAX_STORAGE_LENGTH = 12000;

    function validEntry(entry) {
        return entry !== null && typeof entry === 'object' && !Array.isArray(entry)
            && typeof entry.expression === 'string' && entry.expression.trim().length > 0
            && entry.expression.length <= 256 && typeof entry.result === 'number'
            && Number.isFinite(entry.result) && [null, 'deg', 'rad'].includes(entry.mode);
    }
    function copyEntry(entry) {
        return { expression: entry.expression, result: entry.result, mode: entry.mode };
    }
    function read(storage) {
        let raw;
        try { raw = storage.getItem(STORAGE_KEY); }
        catch { return null; }
        if (typeof raw !== 'string' || raw.length > MAX_STORAGE_LENGTH) return [];
        try {
            const data = JSON.parse(raw);
            if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > MAX_ENTRIES
                || !data.entries.every(validEntry)) return [];
            return data.entries.map(copyEntry);
        } catch { return []; }
    }
    function createHistory(storage) {
        let entries = [];
        let persistent = Boolean(storage);
        function refresh() {
            if (!persistent) return;
            const stored = read(storage);
            if (stored === null) persistent = false;
            else entries = stored;
        }
        refresh();
        return {
            entries: () => entries.map(copyEntry),
            refresh,
            add(entry) {
                if (!validEntry(entry)) return false;
                // Another calculator tab may have added or cleared history since the last render.
                refresh();
                entries = [copyEntry(entry), ...entries].slice(0, MAX_ENTRIES);
                if (persistent) {
                    try { storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries })); }
                    catch { persistent = false; }
                }
                return true;
            },
            clear() {
                entries = [];
                if (persistent) {
                    try { storage.removeItem(STORAGE_KEY); }
                    catch { persistent = false; }
                }
            },
        };
    }
    return { createHistory, STORAGE_KEY, MAX_ENTRIES };
});
