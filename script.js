function appendToDisplay(value) {
    const resultDisplay = document.getElementById('result');
    // Replace displayed × with * for calculation
    if (value === '×') {
        value = '*';
    }
    resultDisplay.value += value;
}

function clearDisplay() {
    document.getElementById('result').value = '';
}

function backspace() {
    const resultDisplay = document.getElementById('result');
    resultDisplay.value = resultDisplay.value.slice(0, -1);
}

function calculateResult() {
    const resultDisplay = document.getElementById('result');
    let expression = resultDisplay.value;
    
    // Replace × with * for evaluation
    expression = expression.replace(/×/g, '*');
    
    try {
        // Using Function constructor as a safer alternative to eval
        const result = new Function('return ' + expression)();
        
        // Check if result is a valid number
        if (isNaN(result) || !isFinite(result)) {
            resultDisplay.value = 'Error';
        } else {
            // Format the result to avoid long decimal numbers
            resultDisplay.value = parseFloat(result.toFixed(10)).toString();
        }
    } catch (error) {
        resultDisplay.value = 'Error';
    }
}

// Add keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (/[0-9\+\-\*\/\.]/.test(key)) {
        if (key === '*') {
            appendToDisplay('×');
        } else {
            appendToDisplay(key);
        }
    } else if (key === 'Enter' || key === '=') {
        calculateResult();
    } else if (key === 'Escape') {
        clearDisplay();
    } else if (key === 'Backspace') {
        backspace();
    }
});