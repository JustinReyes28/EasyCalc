// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value) / 100; // Convert cm to m
    
    if ([weight, height].every(value => Number.isFinite(value) && value > 0)) {
        const bmi = weight / (height * height);
        const resultDiv = document.getElementById('bmi-result');
        resultDiv.style.display = 'block';
        
        let category;
        if (bmi < 18.5) category = "Underweight";
        else if (bmi < 25) category = "Normal weight";
        else if (bmi < 30) category = "Overweight";
        else category = "Obese";
        
        resultDiv.innerHTML = `Your BMI is ${bmi.toFixed(1)} (${category})`;
    } else {
        alert("Please enter valid weight and height values.");
    }
}

function calculateBodyFatPercentage(gender, waistCm, hipCm, neckCm, heightCm) {
    const required = gender === 'female' ? [waistCm, hipCm, neckCm, heightCm] : [waistCm, neckCm, heightCm];
    if (!['male', 'female'].includes(gender) || !required.every(value => Number.isFinite(value) && value > 0)) {
        throw new Error('Enter positive waist, neck, and height measurements. Hip is also required for females.');
    }
    // These circumference-equation constants require inches, not the UI's centimetres.
    // Source: https://api.army.mil/e2/c/downloads/566092.pdf (Army body-fat worksheet).
    const waist = waistCm / 2.54;
    const hip = hipCm / 2.54;
    const neck = neckCm / 2.54;
    const height = heightCm / 2.54;
    const circumference = gender === 'male' ? waist - neck : waist + hip - neck;
    if (circumference <= 0) throw new Error('Check the measurements: the circumference difference must be greater than zero.');
    const bodyFat = gender === 'male'
        ? 86.010 * Math.log10(circumference) - 70.041 * Math.log10(height) + 36.76
        : 163.205 * Math.log10(circumference) - 97.684 * Math.log10(height) - 78.387;
    if (!Number.isFinite(bodyFat) || bodyFat <= 0 || bodyFat >= 100) {
        throw new Error('These measurements are outside the range of this formula. Check the values in centimetres.');
    }
    return bodyFat;
}

function calculateBodyFat() {
    const resultDiv = document.getElementById('bodyfat-result');
    resultDiv.style.display = 'block';
    try {
        const bodyFat = calculateBodyFatPercentage(
            document.getElementById('gender').value,
            parseFloat(document.getElementById('waist').value),
            parseFloat(document.getElementById('hip').value),
            parseFloat(document.getElementById('neck').value),
            parseFloat(document.getElementById('height-bodyfat').value)
        );
        resultDiv.textContent = `Estimated Body Fat: ${bodyFat.toFixed(1)}%`;
    } catch (error) {
        resultDiv.textContent = error.message;
    }
}

function calculateIdealWeight() {
    const gender = document.getElementById('gender-ideal').value;
    const height = parseFloat(document.getElementById('height-ideal').value);
    
    if (Number.isFinite(height) && height > 0) {
        let idealWeight;
        
        // Using Devine Formula
        if (gender === 'male') {
            idealWeight = 50 + 2.3 * ((height / 2.54) - 60);
        } else {
            idealWeight = 45.5 + 2.3 * ((height / 2.54) - 60);
        }
        
        const resultDiv = document.getElementById('ideal-result');
        resultDiv.style.display = 'block';
        if (idealWeight > 0) {
            resultDiv.innerHTML = `Your ideal weight is: ${idealWeight.toFixed(1)} kg`;
        } else {
            resultDiv.innerHTML = `Height may be too short for this formula.`;
        }
    } else {
        alert("Please enter a valid height.");
    }
}

function calculateBMR() {
    const gender = document.getElementById('gender-bmr').value;
    const weight = parseFloat(document.getElementById('weight-bmr').value);
    const height = parseFloat(document.getElementById('height-bmr').value);
    const age = parseFloat(document.getElementById('age').value);
    
    if ([weight, height, age].every(value => Number.isFinite(value) && value > 0)) {
        let bmr;
        
        // Revised Harris-Benedict Equation
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        const resultDiv = document.getElementById('bmr-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `Your BMR is: ${bmr.toFixed(0)} calories/day`;
    } else {
        alert("Please enter valid values for weight, height, and age.");
    }
}

window.onload = function() {
    document.getElementById('weight').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBMI();
        }
    });
    document.getElementById('height').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBMI();
        }
    });
    document.getElementById('height-bodyfat').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') calculateBodyFat();
    });
    document.getElementById('waist').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBodyFat();
        }
    });
    document.getElementById('hip').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBodyFat();
        }
    });
    document.getElementById('neck').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBodyFat();
        }
    });
    document.getElementById('height-ideal').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateIdealWeight();
        }
    });
    document.getElementById('weight-bmr').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBMR();
        }
    });
    document.getElementById('height-bmr').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBMR();
        }
    });
    document.getElementById('age').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            calculateBMR();
        }
    });
};
