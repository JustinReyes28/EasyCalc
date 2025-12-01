// Add CSS styles dynamically
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary-color: #3498db;
            --secondary-color: #2c3e50;
            --accent-color: #e74c3c;
            --light-color: #ecf0f1;
            --dark-color: #2c3e50;
            --success-color: #2ecc71;
            --warning-color: #f39c12;
            --card-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
            --border-radius: 12px;
            --font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: var(--font-primary);
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            opacity: 0;
            animation: fadeIn 1.5s ease-in forwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Initial hidden state for fade-in effect */
        .hidden {
            opacity: 0;
            transition: opacity 1.5s ease-in-out;
        }

        /* Visible state for fade-in effect */
        .visible {
            opacity: 1;
        }

        /* Logo container styling for initial display */
        .logo-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }

        .logo {
            font-size: 4rem;
            opacity: 1;
            animation: pulse 1.5s infinite alternate;
        }

        @keyframes pulse {
            from { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            to { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }

        /* Content container styling */
        .content-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .content-container > div {
            text-align: center;
            color: white;
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: var(--border-radius);
            backdrop-filter: blur(10px);
            box-shadow: var(--card-shadow);
            max-width: 500px;
            width: 100%;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        p {
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
            opacity: 0.9;
        }
    `;
    document.head.appendChild(style);
}

// Run the style injection when the page loads
document.addEventListener('DOMContentLoaded', addStyles);

// Add fade-in effect after page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for a brief moment before starting the fade-in
    setTimeout(function() {
        // Hide the logo
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.opacity = '0';
            logoContainer.style.transition = 'opacity 0.5s ease-out';

            // After logo fades out, show the content
            setTimeout(function() {
                logoContainer.style.display = 'none';

                // Show the content
                const contentContainer = document.querySelector('.content-container');
                if (contentContainer) {
                    contentContainer.classList.remove('hidden');
                    contentContainer.classList.add('visible');
                }
            }, 500);
        }
    }, 500); // Show the logo for 500ms before starting fade-in
});

// GWA Calculator Logic
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('gwa-page')) {
        const courseInputs = document.getElementById('course-inputs');
        const addCourseBtn = document.getElementById('add-course-btn');
        const calculateGwaBtn = document.getElementById('calculate-gwa-btn');
        const gwaResult = document.getElementById('gwa-result');

        let courseCount = 0;

        function addCourseRow() {
            courseCount++;
            const courseRow = document.createElement('div');
            courseRow.classList.add('course-row');
            courseRow.innerHTML = `
                <input type="number" class="grade-input" placeholder="Grade (e.g., 1.0, 3.0)" step="0.01">
                <input type="number" class="units-input" placeholder="Units (e.g., 3, 1)" step="0.5">
                <button class="remove-course-btn">-</button>
            `;
            courseInputs.appendChild(courseRow);
            // Show remove button for all rows if there's more than one course
            updateRemoveButtonsVisibility();
        }

        function removeCourseRow(event) {
            if (courseInputs.children.length > 1) {
                event.target.closest('.course-row').remove();
                courseCount--;
                updateRemoveButtonsVisibility();
            }
        }

        function updateRemoveButtonsVisibility() {
            const removeButtons = document.querySelectorAll('.remove-course-btn');
            if (courseInputs.children.length <= 1) {
                removeButtons.forEach(button => button.style.display = 'none');
            } else {
                removeButtons.forEach(button => button.style.display = 'inline-block');
            }
        }

        function calculateGWA() {
            let totalGradePoints = 0;
            let totalUnits = 0;
            let isValid = true;

            const gradeInputs = document.querySelectorAll('.grade-input');
            const unitsInputs = document.querySelectorAll('.units-input');

            gradeInputs.forEach((gradeInput, index) => {
                const grade = parseFloat(gradeInput.value);
                const units = parseFloat(unitsInputs[index].value);

                if (isNaN(grade) || isNaN(units) || grade < 0 || units <= 0) {
                    isValid = false;
                    return;
                }

                totalGradePoints += (grade * units);
                totalUnits += units;
            });

            if (!isValid) {
                gwaResult.textContent = 'Please enter valid numbers for all grades and units. Units must be greater than 0.';
                gwaResult.style.color = 'red';
            } else if (totalUnits === 0) {
                gwaResult.textContent = 'Please add at least one course with units.';
                gwaResult.style.color = 'orange';
            } else {
                const gwa = totalGradePoints / totalUnits;
                gwaResult.textContent = `Your GWA is: ${gwa.toFixed(2)}`;
                gwaResult.style.color = 'green';
            }
        }

        // Initial row
        addCourseRow();

        addCourseBtn.addEventListener('click', addCourseRow);
        calculateGwaBtn.addEventListener('click', calculateGWA);

        // Event delegation for remove buttons
        courseInputs.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-course-btn')) {
                removeCourseRow(event);
            }
        });
    }
});