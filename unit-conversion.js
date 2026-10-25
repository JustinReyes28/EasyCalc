'use strict';

const CONVERSION_FACTORS = Object.freeze({
    length: Object.freeze({ m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 }),
    weight: Object.freeze({ g: 1, kg: 1000, mg: 0.001, lb: 453.592, oz: 28.3495 }),
    volume: Object.freeze({ l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.24, 'fl-oz': 0.0295735 }),
    time: Object.freeze({ ns: 1e-9, '\u03bcs': 1e-6, ms: 0.001, s: 1, min: 60, hr: 3600, day: 86400, wk: 604800, mo: 2628000, yr: 31536000 })
});
const UNIT_SYMBOLS = Object.freeze({ c: '\u00b0C', f: '\u00b0F', k: 'K', l: 'L', ml: 'mL', gal: 'gal', qt: 'qt', pt: 'pt', cup: 'cup', 'fl-oz': 'fl oz' });
const CONVERSION_CATEGORIES = ['length', 'weight', 'volume', 'temp', 'time'];

function convertUnitValue(category, value, fromUnit, toUnit) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new RangeError('Enter a finite number.');
    }
    let result;
    if (category === 'temp') {
        if (![fromUnit, toUnit].every(unit => ['c', 'f', 'k'].includes(unit))) {
            throw new RangeError('Choose valid temperature units.');
        }
        if (fromUnit === toUnit) return value;
        const celsius = fromUnit === 'f' ? (value - 32) / 1.8 : fromUnit === 'k' ? value - 273.15 : value;
        result = toUnit === 'f' ? celsius * 1.8 + 32 : toUnit === 'k' ? celsius + 273.15 : celsius;
    } else {
        const factors = CONVERSION_FACTORS[category];
        if (!factors || !Object.hasOwn(factors, fromUnit) || !Object.hasOwn(factors, toUnit)) {
            throw new RangeError('Choose valid conversion units.');
        }
        // Divide the factors first so large valid values do not overflow unnecessarily.
        result = value * (factors[fromUnit] / factors[toUnit]);
    }
    if (!Number.isFinite(result)) {
        throw new RangeError('Result is too large. Enter a smaller value or choose another unit.');
    }
    if (result === 0 && value !== 0 && category !== 'temp') {
        throw new RangeError('Result is too small. Enter a larger value or choose another unit.');
    }
    return result;
}

function formatConversionResult(value) {
    if (!Number.isFinite(value)) throw new RangeError('Result must be a finite number.');
    return String(Number(value.toPrecision(12)));
}

function initializeConversionCard(category, doc = document) {
    const input = doc.getElementById(`${category}-input`);
    const from = doc.getElementById(`from-${category}-unit`);
    const to = doc.getElementById(`to-${category}-unit`);
    const result = doc.getElementById(`${category}-result`);
    const resultValue = doc.getElementById(`${category}-result-value`);
    const resultUnit = doc.getElementById(`${category}-result-unit`);
    const feedback = doc.getElementById(`${category}-feedback`);
    const copyFeedback = doc.getElementById(`${category}-copy-feedback`);
    const copy = doc.getElementById(`${category}-copy`);
    const swap = doc.getElementById(`${category}-swap`);
    const note = category === 'time' ? doc.getElementById('time-note') : null;
    let currentValue = null;
    let revision = 0;

    function update(showEmptyFeedback = true) {
        revision += 1;
        currentValue = null;
        copy.disabled = true;
        copyFeedback.textContent = '';
        resultValue.textContent = '\u2014';
        resultUnit.textContent = '';
        input.setAttribute('aria-invalid', 'false');
        feedback.textContent = '';
        if (note) {
            const usesMonth = [from.value, to.value].includes('mo');
            const usesYear = [from.value, to.value].includes('yr');
            note.hidden = !usesMonth && !usesYear;
            note.textContent = usesMonth ? '1 month = 1/12 of a 365-day year.' : usesYear ? '1 year = 365 days.' : '';
        }
        const rawValue = input.value.trim();
        if (input.validity.badInput || (rawValue && !Number.isFinite(Number(rawValue)))) {
            feedback.textContent = 'Enter a finite number.';
            input.setAttribute('aria-invalid', 'true');
            return null;
        }
        if (!rawValue) {
            if (showEmptyFeedback) feedback.textContent = 'Enter a value to convert.';
            return null;
        }
        try {
            currentValue = formatConversionResult(convertUnitValue(category, Number(rawValue), from.value, to.value));
            resultValue.textContent = currentValue;
            resultUnit.textContent = ` ${UNIT_SYMBOLS[to.value] || to.value}`;
            copy.disabled = false;
            return currentValue;
        } catch (error) {
            feedback.textContent = error.message;
            input.setAttribute('aria-invalid', 'true');
            return null;
        }
    }

    function selectResult() {
        // Keep a manual-copy path for browsers without clipboard access or permission.
        result.focus({ preventScroll: true });
        const selection = doc.defaultView.getSelection();
        const range = doc.createRange();
        range.selectNodeContents(resultValue);
        selection.removeAllRanges();
        selection.addRange(range);
        copyFeedback.textContent = 'Result selected. Use the copy command on your device.';
    }

    input.addEventListener('input', () => update());
    from.addEventListener('change', () => update());
    to.addEventListener('change', () => update());
    swap.addEventListener('click', () => {
        [from.value, to.value] = [to.value, from.value];
        update();
    });
    copy.addEventListener('click', async () => {
        const valueToCopy = update();
        if (valueToCopy === null) return;
        const copyRevision = revision;
        try {
            if (!doc.defaultView.navigator.clipboard?.writeText) {
                selectResult();
                return;
            }
            await doc.defaultView.navigator.clipboard.writeText(valueToCopy);
            if (copyRevision === revision) copyFeedback.textContent = 'Copied.';
        } catch {
            if (copyRevision === revision) selectResult();
        }
    });
    update(false);
    return { update };
}

if (typeof document !== 'undefined') {
    CONVERSION_CATEGORIES.forEach(category => initializeConversionCard(category));
}

// Cache local assets when served over HTTP(S); file previews do not register a worker.
if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol) && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertUnitValue, formatConversionResult, initializeConversionCard };
}
