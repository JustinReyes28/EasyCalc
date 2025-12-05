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
        const historyList = document.getElementById('history-list');
        const noHistoryMessage = document.getElementById('no-history-message');
        const clearHistoryBtn = document.getElementById('clear-history-btn');

        let courseCount = 0;

        // Local Storage keys
        const GWA_HISTORY_KEY = 'gwaCalculatorHistory';

        // Load saved data from Local Storage on page load
        window.addEventListener('load', function() {
            loadCourseDataFromStorage();
            loadAndDisplayHistory();
        });

        // Save current course data to Local Storage whenever it changes
        function saveCourseDataToStorage() {
            const courses = [];
            const gradeInputs = document.querySelectorAll('.grade-input');
            const unitsInputs = document.querySelectorAll('.units-input');

            gradeInputs.forEach((gradeInput, index) => {
                const grade = parseFloat(gradeInput.value);
                const units = parseFloat(unitsInputs[index].value);
                if (!isNaN(grade) && !isNaN(units)) {
                    courses.push({ grade: grade, units: units });
                }
            });

            localStorage.setItem('gwaCalculatorData', JSON.stringify(courses));
        }

        // Load saved course data from Local Storage
        function loadCourseDataFromStorage() {
            const savedData = localStorage.getItem('gwaCalculatorData');
            if (savedData) {
                const courses = JSON.parse(savedData);
                if (courses.length > 0) {
                    // Clear existing rows except the first one
                    while (courseInputs.children.length > 1) {
                        courseInputs.removeChild(courseInputs.lastChild);
                    }

                    // Add saved courses
                    courses.forEach((course, index) => {
                        if (index === 0) {
                            // Update first row
                            const firstRow = courseInputs.querySelector('.course-row');
                            firstRow.querySelector('.grade-input').value = course.grade;
                            firstRow.querySelector('.units-input').value = course.units;
                        } else {
                            // Add new rows for additional courses
                            const courseRow = document.createElement('div');
                            courseRow.classList.add('course-row');
                            courseRow.innerHTML = `
                                <input type="number" class="grade-input" placeholder="Grade (e.g., 1.0, 3.0)" step="0.01" value="${course.grade}">
                                <input type="number" class="units-input" placeholder="Units (e.g., 3, 1)" step="0.5" value="${course.units}">
                                <button class="remove-course-btn">-</button>
                            `;
                            courseInputs.appendChild(courseRow);
                        }
                    });
                    updateRemoveButtonsVisibility();
                }
            }
        }

        // Save GWA calculation to history
        function saveToHistory(gwa, courses) {
            const history = getHistoryFromStorage();
            const timestamp = new Date().toLocaleString();

            const historyItem = {
                id: Date.now(), // Unique ID based on timestamp
                timestamp: timestamp,
                gwa: gwa,
                courses: courses
            };

            history.unshift(historyItem); // Add to the beginning of the array

            // Limit history to 10 items to prevent excessive storage
            if (history.length > 10) {
                history.splice(10);
            }

            localStorage.setItem(GWA_HISTORY_KEY, JSON.stringify(history));
            displayHistory(history);
        }

        // Get history from Local Storage
        function getHistoryFromStorage() {
            const history = localStorage.getItem(GWA_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        }

        // Load and display history
        function loadAndDisplayHistory() {
            const history = getHistoryFromStorage();
            displayHistory(history);
        }

        // Display history items
        function displayHistory(history) {
            if (history.length === 0) {
                historyList.innerHTML = '';
                noHistoryMessage.style.display = 'block';
                return;
            }

            noHistoryMessage.style.display = 'none';
            historyList.innerHTML = '';

            history.forEach(item => {
                const historyItemElement = createHistoryItemElement(item);
                historyList.appendChild(historyItemElement);
            });
        }

        // Create history item element
        function createHistoryItemElement(item) {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-title">GWA: ${item.gwa.toFixed(2)}</span>
                    <span class="history-item-timestamp">${item.timestamp}</span>
                </div>
                <div class="history-item-courses">
                    ${item.courses.map(course => `
                        <div class="history-item-course">
                            <span class="history-item-course-grade">Grade: ${course.grade}</span>
                            <span class="history-item-course-units">Units: ${course.units}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="history-item-gwa">
                    ${item.gwa < 1.50 ? 'University Scholar!' : item.gwa < 1.75 ? 'College Scholar!' : 'Great Job!'}
                </div>
                <div class="history-actions">
                    <button class="history-btn load-history-btn" data-id="${item.id}">Load</button>
                    <button class="history-btn delete-history-btn" data-id="${item.id}">Delete</button>
                </div>
            `;

            // Add event listeners for the buttons
            const loadBtn = historyItem.querySelector('.load-history-btn');
            const deleteBtn = historyItem.querySelector('.delete-history-btn');

            loadBtn.addEventListener('click', function() {
                loadHistoryItem(item);
            });

            deleteBtn.addEventListener('click', function() {
                deleteHistoryItem(item.id);
            });

            return historyItem;
        }

        // Load a history item
        function loadHistoryItem(item) {
            // Clear existing rows except the first one
            while (courseInputs.children.length > 1) {
                courseInputs.removeChild(courseInputs.lastChild);
            }

            // Add courses from history item
            item.courses.forEach((course, index) => {
                if (index === 0) {
                    // Update first row
                    const firstRow = courseInputs.querySelector('.course-row');
                    firstRow.querySelector('.grade-input').value = course.grade;
                    firstRow.querySelector('.units-input').value = course.units;
                } else {
                    // Add new rows for additional courses
                    const courseRow = document.createElement('div');
                    courseRow.classList.add('course-row');
                    courseRow.innerHTML = `
                        <input type="number" class="grade-input" placeholder="Grade (e.g., 1.0, 3.0)" step="0.01" value="${course.grade}">
                        <input type="number" class="units-input" placeholder="Units (e.g., 3, 1)" step="0.5" value="${course.units}">
                        <button class="remove-course-btn">-</button>
                    `;
                    courseInputs.appendChild(courseRow);
                }
            });
            updateRemoveButtonsVisibility();

            // Update the result display with the GWA from this history item
            gwaResult.textContent = `Your GWA is: ${item.gwa.toFixed(2)}. ${item.gwa < 1.50 ? 'You are a University Scholar!' : item.gwa < 1.75 ? 'You are a College Scholar!' : ''}`;
            gwaResult.style.color = item.gwa < 1.50 ? 'gold' : item.gwa < 1.75 ? 'silver' : 'green';
        }

        // Delete a history item
        function deleteHistoryItem(id) {
            const history = getHistoryFromStorage();
            const updatedHistory = history.filter(item => item.id !== id);
            localStorage.setItem(GWA_HISTORY_KEY, JSON.stringify(updatedHistory));
            displayHistory(updatedHistory);
        }

        // Clear all history
        function clearHistory() {
            if (confirm('Are you sure you want to clear all history?')) {
                localStorage.removeItem(GWA_HISTORY_KEY);
                loadAndDisplayHistory();
            }
        }

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

            // Add event listener to save data when input changes
            courseRow.querySelector('.grade-input').addEventListener('input', saveCourseDataToStorage);
            courseRow.querySelector('.units-input').addEventListener('input', saveCourseDataToStorage);
        }

        function removeCourseRow(event) {
            if (courseInputs.children.length > 1) {
                event.target.closest('.course-row').remove();
                courseCount--;
                updateRemoveButtonsVisibility();
                saveCourseDataToStorage(); // Save after removal
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
            const courses = []; // To store the course data for history

            gradeInputs.forEach((gradeInput, index) => {
                const grade = parseFloat(gradeInput.value);
                const units = parseFloat(unitsInputs[index].value);

                if (isNaN(grade) || isNaN(units) || grade < 0 || units <= 0) {
                    isValid = false;
                    return;
                }

                courses.push({ grade: grade, units: units });
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
                let scholarshipStatus = '';
                if (gwa < 1.50) {
                    scholarshipStatus = 'You are a University Scholar!';
                    gwaResult.style.color = 'gold'; // A color that signifies achievement
                } else if (gwa < 1.75) {
                    scholarshipStatus = 'You are a College Scholar!';
                    gwaResult.style.color = 'silver'; // A color that signifies achievement
                } else {
                    gwaResult.style.color = 'green';
                }
                gwaResult.textContent = `Your GWA is: ${gwa.toFixed(2)}. ${scholarshipStatus}`;

                // Save to history
                saveToHistory(gwa, courses);
            }
        }

        // Initial row
        addCourseRow();

        // Add event listeners to initial inputs
        const firstGradeInput = document.querySelector('.grade-input');
        const firstUnitsInput = document.querySelector('.units-input');
        firstGradeInput.addEventListener('input', saveCourseDataToStorage);
        firstUnitsInput.addEventListener('input', saveCourseDataToStorage);

        addCourseBtn.addEventListener('click', addCourseRow);
        calculateGwaBtn.addEventListener('click', calculateGWA);
        clearHistoryBtn.addEventListener('click', clearHistory);

        courseInputs.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                const target = event.target;
                const inputs = Array.from(courseInputs.querySelectorAll('.grade-input, .units-input'));
                const currentIndex = inputs.indexOf(target);

                if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else if (currentIndex === inputs.length - 1) {
                    calculateGWA();
                }
            }
        });

        // Event delegation for remove buttons
        courseInputs.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-course-btn')) {
                removeCourseRow(event);
            }
        });
    }
});