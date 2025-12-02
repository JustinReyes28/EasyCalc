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
                gwaResult.style.color = 'white';
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