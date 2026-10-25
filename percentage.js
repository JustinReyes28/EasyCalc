(function (root) {
    'use strict';

    function finite(value, name) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new TypeError(`${name} must be a finite number.`);
        }
        return value;
    }

    function result(value) {
        if (!Number.isFinite(value)) {
            throw new RangeError('The result is too large. Try smaller values.');
        }
        return Object.is(value, -0) ? 0 : value;
    }

    function percentOf(percentage, value) {
        finite(percentage, 'Percentage');
        finite(value, 'Value');
        // Divide after multiplication when possible to retain very small inputs.
        const product = percentage * value;
        return result(Number.isFinite(product) ? product / 100 : (percentage / 100) * value);
    }

    function whatPercent(part, whole) {
        finite(part, 'Part');
        finite(whole, 'Whole');
        if (whole === 0) throw new RangeError('Whole cannot be 0.');
        const ratio = part / whole;
        return result(ratio === 0 && part !== 0 ? (part * 100) / whole : ratio * 100);
    }

    function percentageChange(original, newValue) {
        finite(original, 'Original value');
        finite(newValue, 'New value');
        if (original <= 0) throw new RangeError('Original value must be greater than 0.');
        const difference = newValue - original;
        // The difference can overflow even when the relative change is finite.
        return Number.isFinite(difference)
            ? whatPercent(difference, original)
            : result((newValue / original - 1) * 100);
    }

    function discount(price, percentage) {
        finite(price, 'Original price');
        finite(percentage, 'Discount');
        if (price < 0) throw new RangeError('Original price must be 0 or greater.');
        if (percentage < 0 || percentage > 100) throw new RangeError('Discount must be between 0 and 100%.');
        return {
            finalPrice: percentOf(100 - percentage, price),
            savings: percentOf(percentage, price)
        };
    }

    function formatNumber(value) {
        return Number(result(value).toPrecision(12)).toString();
    }

    function formatPrice(value) {
        return result(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    const api = Object.freeze({ percentOf, whatPercent, percentageChange, discount, formatNumber, formatPrice });
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.EasyCalcPercentage = api;
    if (typeof document === 'undefined') return;

    function readInput(form, name) {
        const input = form.elements.namedItem(name);
        const label = input.labels[0].textContent.replace(/ \(%\)$/, '');
        let message;
        if (input.validity.badInput) message = `Enter a finite number for ${label.toLowerCase()}.`;
        else if (input.value.trim() === '') message = `Enter ${label.toLowerCase()}.`;
        else if (!Number.isFinite(Number(input.value))) message = `Enter a finite number for ${label.toLowerCase()}.`;
        if (message) {
            const error = new Error(message);
            error.input = input;
            throw error;
        }
        return Number(input.value);
    }

    function showResult(output, label, value, detail) {
        const heading = document.createElement('span');
        heading.className = 'result-label';
        heading.textContent = label;
        const answer = document.createElement('strong');
        answer.className = 'result-value';
        answer.textContent = value;
        output.replaceChildren(heading, answer);
        if (detail) {
            const description = document.createElement('span');
            description.className = 'result-detail';
            description.textContent = detail;
            output.append(description);
        }
        output.hidden = false;
    }

    function connect(id, calculate, errorField) {
        const form = document.getElementById(`${id}-form`);
        const output = document.getElementById(`${id}-result`);
        const feedback = document.getElementById(`${id}-error`);
        function clear() {
            feedback.hidden = true;
            feedback.textContent = '';
            output.hidden = true;
            output.replaceChildren();
            for (const input of form.querySelectorAll('input')) input.removeAttribute('aria-invalid');
        }
        form.addEventListener('input', clear);
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            clear();
            try {
                calculate(form, output);
            } catch (error) {
                feedback.textContent = error.message;
                feedback.hidden = false;
                const input = error.input || (errorField && errorField(form, error));
                if (input) {
                    input.setAttribute('aria-invalid', 'true');
                    input.focus();
                }
            }
        });
    }

    connect('percent-of', function (form, output) {
        const percentage = readInput(form, 'percentage');
        const value = readInput(form, 'value');
        showResult(output, 'Result', formatNumber(percentOf(percentage, value)));
    });
    connect('what-percent', function (form, output) {
        const part = readInput(form, 'part');
        const whole = readInput(form, 'whole');
        showResult(output, 'Percentage', `${formatNumber(whatPercent(part, whole))}%`);
    }, (form, error) => error.message === 'Whole cannot be 0.' ? form.elements.whole : null);
    connect('change', function (form, output) {
        const original = readInput(form, 'original');
        const newValue = readInput(form, 'newValue');
        const change = percentageChange(original, newValue);
        const direction = change > 0 ? 'Increase' : change < 0 ? 'Decrease' : 'No change';
        showResult(output, direction, `${formatNumber(Math.abs(change))}%`);
    }, (form, error) => error.message === 'Original value must be greater than 0.' ? form.elements.original : null);
    connect('discount', function (form, output) {
        const price = readInput(form, 'price');
        const percentage = readInput(form, 'percentage');
        const amounts = discount(price, percentage);
        showResult(output, 'Final price', formatPrice(amounts.finalPrice), `You save ${formatPrice(amounts.savings)}`);
    }, function (form, error) {
        if (error.message.startsWith('Original price must')) return form.elements.price;
        if (error.message.startsWith('Discount must')) return form.elements.percentage;
        return null;
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
