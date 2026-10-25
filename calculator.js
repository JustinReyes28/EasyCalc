(() => {
    'use strict';
    const display = document.getElementById('display');
    const feedback = document.getElementById('calculation-feedback');
    const copyButton = document.getElementById('copy-result');
    const angleMode = document.getElementById('angle-mode');
    let answer;
    let evaluated = false;
    let storage;
    try { storage = window.localStorage; } catch { /* History still works without persistence. */ }
    const history = EasyCalcHistory.createHistory(storage);
    const historyList = document.getElementById('history-list');
    const historyCount = document.getElementById('history-count');
    const historyEmpty = document.getElementById('history-empty');
    const clearHistoryButton = document.getElementById('clear-history');

    function showResult(result, expression) {
        answer = result;
        display.value = EasyCalcMath.formatResult(result);
        display.removeAttribute('aria-invalid');
        feedback.classList.remove('is-error');
        feedback.textContent = `${expression} = ${display.value}`;
        copyButton.disabled = false;
        evaluated = true;
        display.focus({ preventScroll: true });
        display.setSelectionRange(display.value.length, display.value.length);
    }
    function renderHistory() {
        const entries = history.entries();
        historyCount.textContent = `(${entries.length})`;
        historyEmpty.hidden = entries.length > 0;
        historyList.hidden = entries.length === 0;
        clearHistoryButton.hidden = entries.length === 0;
        const rows = entries.map(entry => {
            const row = document.createElement('li');
            row.className = 'history-entry';
            const calculation = document.createElement('div');
            calculation.className = 'history-calculation';
            const expression = document.createElement('p');
            expression.className = 'history-expression';
            expression.textContent = entry.expression;
            const result = document.createElement('p');
            result.className = 'history-result';
            result.textContent = `= ${EasyCalcMath.formatResult(entry.result)}`;
            if (entry.mode) {
                const mode = document.createElement('span');
                mode.className = 'history-mode';
                mode.textContent = entry.mode.toUpperCase();
                result.append(' ', mode);
            }
            const use = document.createElement('button');
            use.type = 'button';
            use.className = 'history-button';
            use.textContent = 'Use result';
            use.setAttribute('aria-label', `Use result ${EasyCalcMath.formatResult(entry.result)} from ${entry.expression}`);
            use.addEventListener('click', () => showResult(entry.result, entry.expression));
            calculation.append(expression, result);
            row.append(calculation, use);
            return row;
        });
        historyList.replaceChildren(...rows);
    }
    clearHistoryButton.addEventListener('click', () => {
        history.clear();
        renderHistory();
        document.querySelector('#calculation-history summary').focus();
    });
    function refreshHistory() {
        history.refresh();
        renderHistory();
    }
    window.addEventListener('storage', event => {
        if (!storage || event.storageArea !== storage
            || (event.key !== EasyCalcHistory.STORAGE_KEY && event.key !== null)) return;
        refreshHistory();
    });
    document.getElementById('calculation-history').addEventListener('toggle', event => {
        if (event.currentTarget.open) refreshHistory();
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) refreshHistory();
    });
    renderHistory();

    function editing() {
        evaluated = false;
        display.removeAttribute('aria-invalid');
        feedback.classList.remove('is-error');
        feedback.textContent = '';
        copyButton.disabled = true;
    }
    function insert(value) {
        if (evaluated && !/^[+*/^!\-]/.test(value) && value !== ')') display.value = '';
        editing();
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;
        if (display.value.length - (end - start) + value.length > 256) return;
        display.setRangeText(value, start, end, 'end');
        display.focus({ preventScroll: true });
        display.scrollLeft = display.scrollWidth;
    }
    function calculate() {
        const expression = display.value;
        try {
            const result = EasyCalcMath.evaluateExpression(expression, { answer, angleMode: angleMode?.value || 'deg' });
            showResult(result, expression);
            history.add({ expression, result, mode: angleMode?.value || null });
            renderHistory();
        } catch (error) {
            display.setAttribute('aria-invalid', 'true');
            feedback.classList.add('is-error');
            feedback.textContent = error.message;
            copyButton.disabled = true;
            evaluated = false;
            display.focus({ preventScroll: true });
        }
    }
    function clear() {
        display.value = '';
        editing();
        display.focus({ preventScroll: true });
    }
    function backspace() {
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;
        editing();
        display.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
        display.focus({ preventScroll: true });
    }
    document.querySelector('.buttons').addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.value !== undefined) insert(button.dataset.value);
        else if (button.dataset.action === 'calculate') calculate();
        else if (button.dataset.action === 'clear') clear();
        else if (button.dataset.action === 'backspace') backspace();
        else if (['square', 'cube', 'inverse'].includes(button.dataset.action)) {
            if (!display.value.trim()) return;
            display.value = button.dataset.action === 'inverse' ? `1/(${display.value})` : `(${display.value})^${button.dataset.action === 'square' ? 2 : 3}`;
            editing();
            display.focus({ preventScroll: true });
            display.setSelectionRange(display.value.length, display.value.length);
        }
    });
    display.addEventListener('input', editing);
    display.addEventListener('beforeinput', event => {
        if (evaluated && event.inputType === 'insertText' && !/^[+*/^!\-)]/.test(event.data || '')) display.value = '';
    });
    document.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
        const target = event.target;
        if (target !== display && target.closest('button, a, select, textarea, input, summary')) return;
        if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
        else if (event.key === 'Escape') { event.preventDefault(); clear(); }
        else if (target !== display && event.key === 'Backspace') { event.preventDefault(); backspace(); }
        else if (target !== display && /^[0-9.+\-*/^!()]$/.test(event.key)) { event.preventDefault(); insert(event.key); }
    });
    angleMode?.addEventListener('change', () => {
        feedback.classList.remove('is-error');
        feedback.textContent = `Trigonometry uses ${angleMode.value === 'deg' ? 'degrees' : 'radians'}.`;
    });
    copyButton.addEventListener('click', async () => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(display.value);
            feedback.classList.remove('is-error');
            feedback.textContent = 'Result copied.';
        } catch {
            display.focus();
            display.select();
            feedback.textContent = 'Result selected. Use your device’s copy command.';
        }
    });
})();
