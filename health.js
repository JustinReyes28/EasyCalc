function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value) / 100; // Convert cm to m
    
    if (weight && height) {
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

function calculateBodyFat() {
    const gender = document.getElementById('gender').value;
    const waist = parseFloat(document.getElementById('waist').value);
    const hip = parseFloat(document.getElementById('hip').value);
    const neck = parseFloat(document.getElementById('neck').value);
    
    // Height is needed for the formula but missing from the body fat card.
    // Let's try to get it from the BMI card's height input.
    const height = parseFloat(document.getElementById('height').value);
    
    if (waist && neck && height) {
        let bodyFat;
        
        if (gender === 'male') {
            // Using a common formula (U.S. Navy method)
            bodyFat = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
        } else if (gender === 'female' && hip) {
            bodyFat = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
        }
        
        const resultDiv = document.getElementById('bodyfat-result');
        resultDiv.style.display = 'block';
        
        if (bodyFat && bodyFat > 0) {
            resultDiv.innerHTML = `Estimated Body Fat: ${bodyFat.toFixed(1)}%`;
        } else {
            resultDiv.innerHTML = "Please ensure all measurements are correct. Hip is required for females.";
        }
    } else {
        alert("Please enter valid measurements for waist, neck, and height (in the BMI card).");
    }
}

function calculateIdealWeight() {
    const gender = document.getElementById('gender-ideal').value;
    const height = parseFloat(document.getElementById('height-ideal').value);
    
    if (height) {
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
    
    if (weight && height && age) {
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
