(() => {
    'use strict';
    const display = document.getElementById('display');
    const feedback = document.getElementById('calculation-feedback');
    const copyButton = document.getElementById('copy-result');
    const angleMode = document.getElementById('angle-mode');
    let answer;
    let evaluated = false;

    function editing() {
        evaluated = false;
        display.removeAttribute('aria-invalid');
        feedback.classList.remove('is-error');
        feedback.textContent = 'Ready to calculate';
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
            answer = EasyCalcMath.evaluateExpression(expression, { answer, angleMode: angleMode?.value || 'deg' });
            display.value = EasyCalcMath.formatResult(answer);
            display.removeAttribute('aria-invalid');
            feedback.classList.remove('is-error');
            feedback.textContent = `${expression} = ${display.value}`;
            copyButton.disabled = false;
            evaluated = true;
            display.focus({ preventScroll: true });
            display.setSelectionRange(display.value.length, display.value.length);
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
        if (target !== display && target.closest('button, a, select, textarea, input')) return;
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
