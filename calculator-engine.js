(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.EasyCalcMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // A small, explicit math grammar. User input is never executed as JavaScript.
    function evaluateExpression(expression, options = {}) {
        const source = String(expression).replace(/×/g, '*').replace(/÷/g, '/')
            .replace(/−/g, '-').replace(/π/g, 'pi').replace(/\*\*/g, '^');
        if (!source.trim()) throw new Error('Enter a calculation first.');
        if (source.length > 256) throw new Error('Keep the expression under 256 characters.');
        const tokens = [];
        let cursor = 0;
        while (cursor < source.length) {
            const rest = source.slice(cursor);
            const whitespace = /^\s+/.exec(rest);
            if (whitespace) { cursor += whitespace[0].length; continue; }
            const number = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
            const name = /^[a-zA-Z]+/.exec(rest);
            if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); cursor += number[0].length; }
            else if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); cursor += name[0].length; }
            else if ('+-*/^!()'.includes(rest[0])) { tokens.push({ type: rest[0] }); cursor++; }
            else throw new Error('Use numbers, math operators, and supported functions only.');
        }
        let position = 0;
        const peek = () => tokens[position]?.type;
        function take(type) {
            if (peek() === type) return tokens[position++];
            return null;
        }
        function finite(value) {
            if (!Number.isFinite(value)) throw new Error('The result is too large or outside the real-number range.');
            return value;
        }
        function sum() {
            let value = product();
            while (peek() === '+' || peek() === '-') {
                const operator = tokens[position++].type;
                const right = product();
                value = finite(operator === '+' ? value + right : value - right);
            }
            return value;
        }
        function product() {
            let value = unary();
            while (peek() === '*' || peek() === '/' || peek() === '(' || peek() === 'name') {
                const operator = peek();
                if (operator === '*' || operator === '/') position++;
                const right = unary();
                if (operator === '/' && right === 0) throw new Error('Cannot divide by zero. Change the divisor.');
                value = finite(operator === '/' ? value / right : value * right);
            }
            return value;
        }
        function unary() {
            if (take('+')) return unary();
            if (take('-')) return -unary();
            return power();
        }
        function power() {
            const value = postfix();
            return take('^') ? finite(value ** unary()) : value;
        }
        function postfix() {
            let value = primary();
            while (take('!')) {
                if (!Number.isInteger(value) || value < 0) throw new Error('Factorial needs a whole number of zero or more.');
                if (value > 170) throw new Error('Factorial supports numbers up to 170.');
                let result = 1;
                for (let i = 2; i <= value; i++) result *= i;
                value = finite(result);
            }
            return value;
        }
        function primary() {
            const number = take('number');
            if (number) return finite(number.value);
            if (take('(')) {
                const value = sum();
                if (!take(')')) throw new Error('Add a closing parenthesis.');
                return value;
            }
            const name = take('name');
            if (name) {
                if (name.value === 'pi') return Math.PI;
                if (name.value === 'e') return Math.E;
                if (name.value === 'ans') {
                    if (!Number.isFinite(options.answer)) throw new Error('Calculate a result before using Ans.');
                    return options.answer;
                }
                const functions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp'];
                if (!functions.includes(name.value)) throw new Error('Use sin, cos, tan, log, ln, sqrt, or exp.');
                if (!take('(')) throw new Error('Put the function value in parentheses.');
                const value = sum();
                if (!take(')')) throw new Error('Add a closing parenthesis.');
                const radians = options.angleMode === 'rad' ? value : value * Math.PI / 180;
                if (name.value === 'sqrt' && value < 0) throw new Error('Square root needs a number of zero or more.');
                if ((name.value === 'log' || name.value === 'ln') && value <= 0) throw new Error('Logarithms need a number greater than zero.');
                if (name.value === 'tan' && Math.abs(Math.cos(radians)) < 1e-12) throw new Error('Tangent is undefined at this angle.');
                const functionsByName = {
                    sin: () => Math.sin(radians), cos: () => Math.cos(radians), tan: () => Math.tan(radians),
                    log: () => Math.log10(value), ln: () => Math.log(value), sqrt: () => Math.sqrt(value), exp: () => Math.exp(value)
                };
                const result = finite(functionsByName[name.value]());
                // Remove trig noise at exact multiples of a right angle, without rounding tiny inputs to zero.
                if (['sin', 'cos', 'tan'].includes(name.value)) {
                    const quarterTurns = radians / (Math.PI / 2);
                    if (Math.round(quarterTurns) !== 0 && Math.abs(quarterTurns - Math.round(quarterTurns)) < 1e-14 && Math.abs(result) < 1e-14) return 0;
                }
                return result;
            }
            throw new Error(peek() === ')' ? 'Add a value before the closing parenthesis.' : 'Complete the expression with a number.');
        }
        const result = finite(sum());
        if (position !== tokens.length) throw new Error('Check the operators and parentheses in your expression.');
        return Object.is(result, -0) ? 0 : result;
    }

    function formatResult(value) {
        return Number(value.toPrecision(12)).toString();
    }
    return { evaluateExpression, formatResult };
});
