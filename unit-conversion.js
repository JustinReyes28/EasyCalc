// Length Conversion
function convertLength() {
    const input = document.getElementById('length-input').value;
    const fromUnit = document.getElementById('from-length-unit').value;
    const toUnit = document.getElementById('to-length-unit').value;
    const resultSpan = document.getElementById('length-result');

    if (input === '') {
        resultSpan.textContent = '0';
        return;
    }

    const meters = parseFloat(input) * getMeterMultiplier(fromUnit);
    const result = meters / getMeterMultiplier(toUnit);
    resultSpan.textContent = `${result.toFixed(2)}`;
}

function getMeterMultiplier(unit) {
    switch (unit) {
        case 'm': return 1;
        case 'km': return 1000;
        case 'cm': return 0.01;
        case 'mm': return 0.001;
        case 'mi': return 1609.34;
        case 'yd': return 0.9144;
        case 'ft': return 0.3048;
        case 'in': return 0.0254;
        default: return 1;
    }
}

// Weight Conversion
function convertWeight() {
    const input = document.getElementById('weight-input').value;
    const fromUnit = document.getElementById('from-weight-unit').value;
    const toUnit = document.getElementById('to-weight-unit').value;
    const resultSpan = document.getElementById('weight-result');

    if (input === '') {
        resultSpan.textContent = '0';
        return;
    }

    const grams = parseFloat(input) * getGramMultiplier(fromUnit);
    const result = grams / getGramMultiplier(toUnit);
    resultSpan.textContent = `${result.toFixed(2)}`;
}

function getGramMultiplier(unit) {
    switch (unit) {
        case 'g': return 1;
        case 'kg': return 1000;
        case 'mg': return 0.001;
        case 'lb': return 453.592;
        case 'oz': return 28.3495;
        default: return 1;
    }
}

// Volume Conversion
function convertVolume() {
    const input = document.getElementById('volume-input').value;
    const fromUnit = document.getElementById('from-volume-unit').value;
    const toUnit = document.getElementById('to-volume-unit').value;
    const resultSpan = document.getElementById('volume-result');

    if (input === '') {
        resultSpan.textContent = '0';
        return;
    }

    const liters = parseFloat(input) * getLiterMultiplier(fromUnit);
    const result = liters / getLiterMultiplier(toUnit);

    resultSpan.textContent = `${result.toFixed(2)}`;
}

function getLiterMultiplier(unit) {
    switch (unit) {
        case 'l': return 1;
        case 'ml': return 0.001;
        case 'gal': return 3.78541;
        case 'qt': return 0.946353;
        case 'pt': return 0.473176;
        case 'cup': return 0.24;
        case 'fl-oz': return 0.0295735;
        default: return 1;
    }
}

// Temperature Conversion
function convertTemperature() {
    const inputStr = document.getElementById('temp-input').value;
    const fromUnit = document.getElementById('from-temp-unit').value;
    const toUnit = document.getElementById('to-temp-unit').value;
    const resultSpan = document.getElementById('temp-result');

    if (inputStr === '') {
        resultSpan.textContent = '0';
        return;
    }

    const input = parseFloat(inputStr);
    let result;

    if (fromUnit === toUnit) {
        result = input;
    } else if (fromUnit === 'c') {
        if (toUnit === 'f') {
            result = (input * 9/5) + 32;
        } else if (toUnit === 'k') {
            result = input + 273.15;
        }
    } else if (fromUnit === 'f') {
        if (toUnit === 'c') {
            result = (input - 32) * 5/9;
        } else if (toUnit === 'k') {
            result = (input - 32) * 5/9 + 273.15;
        }
    } else if (fromUnit === 'k') {
        if (toUnit === 'c') {
            result = input - 273.15;
        } else if (toUnit === 'f') {
            result = (input - 273.15) * 9/5 + 32;
        }
    }

    resultSpan.textContent = result.toFixed(2);
}
