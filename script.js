// GWA Calculator Logic
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('gwa-page')) {
        const courseInputs = document.getElementById('course-inputs');
        const addCourseBtn = document.getElementById('add-course-btn');
        const calculateGwaBtn = document.getElementById('calculate-gwa-btn');
        const gwaResult = document.getElementById('gwa-result');
        const historyList = document.getElementById('history-list');
        const noHistoryMessage = document.getElementById('no-history-message');
        const clearHistoryBtn = document.getElementById('clear-history-btn');

        // Local Storage keys
        const GWA_HISTORY_KEY = 'gwaCalculatorHistory';

        function readStoredArray(key) {
            try {
                const value = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(value) ? value : [];
            } catch { return []; }
        }
        function writeStoredArray(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); }
            catch { /* Calculations remain usable when browser storage is unavailable. */ }
        }

        // Load saved data from Local Storage on page load
        window.addEventListener('load', function () {
            loadCourseDataFromStorage();
            loadAndDisplayHistory();
        });

        // Save current course data to Local Storage whenever it changes
        function saveCourseDataToStorage() {
            const courses = [];
            const gradeInputs = document.querySelectorAll('.grade-input');
            const unitsInputs = document.querySelectorAll('.units-input');

            gradeInputs.forEach((gradeInput, index) => {
                courses.push({ grade: gradeInput.value, units: unitsInputs[index].value });
            });

            writeStoredArray('gwaCalculatorData', courses);
        }

        // Load saved course data from Local Storage
        function loadCourseDataFromStorage() {
            const courses = readStoredArray('gwaCalculatorData').filter(course => course && ['string', 'number'].includes(typeof course.grade) && ['string', 'number'].includes(typeof course.units));
            if (courses.length) {
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

                        const gradeInput = document.createElement('input');
                        gradeInput.type = 'number';
                        gradeInput.className = 'grade-input';
                        gradeInput.placeholder = 'Grade (e.g., 1.0, 3.0)';
                        gradeInput.step = '0.01';
                        gradeInput.value = course.grade;

                        const unitsInput = document.createElement('input');
                        unitsInput.type = 'number';
                        unitsInput.className = 'units-input';
                        unitsInput.placeholder = 'Units (e.g., 3, 1)';
                        unitsInput.step = '0.5';
                        unitsInput.value = course.units;

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-course-btn';
                        removeBtn.textContent = '-';

                        courseRow.appendChild(gradeInput);
                        courseRow.appendChild(unitsInput);
                        courseRow.appendChild(removeBtn);

                        courseInputs.appendChild(courseRow);
                    }
                });
                updateRemoveButtonsVisibility();
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

            writeStoredArray(GWA_HISTORY_KEY, history);
            displayHistory(history);
        }

        // Get history from Local Storage
        function getHistoryFromStorage() {
            return readStoredArray(GWA_HISTORY_KEY).filter(item => item && Number.isFinite(item.gwa) && Array.isArray(item.courses) && item.courses.every(course => course && Number.isFinite(course.grade) && Number.isFinite(course.units)));
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
            const header = document.createElement('div');
            header.className = 'history-item-header';

            const title = document.createElement('span');
            title.className = 'history-item-title';
            title.textContent = `GWA: ${item.gwa.toFixed(2)}`;

            const timestamp = document.createElement('span');
            timestamp.className = 'history-item-timestamp';
            timestamp.textContent = item.timestamp;

            header.appendChild(title);
            header.appendChild(timestamp);

            const coursesDiv = document.createElement('div');
            coursesDiv.className = 'history-item-courses';

            item.courses.forEach(course => {
                const courseDiv = document.createElement('div');
                courseDiv.className = 'history-item-course';

                const gradeSpan = document.createElement('span');
                gradeSpan.className = 'history-item-course-grade';
                gradeSpan.textContent = `Grade: ${course.grade}`;

                const unitsSpan = document.createElement('span');
                unitsSpan.className = 'history-item-course-units';
                unitsSpan.textContent = `Units: ${course.units}`;

                courseDiv.appendChild(gradeSpan);
                courseDiv.appendChild(unitsSpan);
                coursesDiv.appendChild(courseDiv);
            });

            const gwaDiv = document.createElement('div');
            gwaDiv.className = 'history-item-gwa';
            gwaDiv.textContent = item.gwa < 1.50 ? 'University Scholar!' : item.gwa < 1.75 ? 'College Scholar!' : 'Great Job!';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-actions';

            const loadBtn = document.createElement('button');
            loadBtn.className = 'history-btn load-history-btn';
            loadBtn.dataset.id = item.id;
            loadBtn.textContent = 'Load';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'history-btn delete-history-btn';
            deleteBtn.dataset.id = item.id;
            deleteBtn.textContent = 'Delete';

            actionsDiv.appendChild(loadBtn);
            actionsDiv.appendChild(deleteBtn);

            historyItem.appendChild(header);
            historyItem.appendChild(coursesDiv);
            historyItem.appendChild(gwaDiv);
            historyItem.appendChild(actionsDiv);

            // Add event listeners for the buttons

            loadBtn.addEventListener('click', function () {
                loadHistoryItem(item);
            });

            deleteBtn.addEventListener('click', function () {
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

                    const gradeInput = document.createElement('input');
                    gradeInput.type = 'number';
                    gradeInput.className = 'grade-input';
                    gradeInput.placeholder = 'Grade (e.g., 1.0, 3.0)';
                    gradeInput.step = '0.01';
                    gradeInput.value = course.grade;

                    const unitsInput = document.createElement('input');
                    unitsInput.type = 'number';
                    unitsInput.className = 'units-input';
                    unitsInput.placeholder = 'Units (e.g., 3, 1)';
                    unitsInput.step = '0.5';
                    unitsInput.value = course.units;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-course-btn';
                    removeBtn.textContent = '-';

                    courseRow.appendChild(gradeInput);
                    courseRow.appendChild(unitsInput);
                    courseRow.appendChild(removeBtn);

                    courseInputs.appendChild(courseRow);
                }
            });
            updateRemoveButtonsVisibility();

            saveCourseDataToStorage();

            // Update the result display with the GWA from this history item
            gwaResult.textContent = `Your GWA is: ${item.gwa.toFixed(2)}. ${item.gwa < 1.50 ? 'You are a University Scholar!' : item.gwa < 1.75 ? 'You are a College Scholar!' : ''}`;
            gwaResult.style.color = item.gwa < 1.50 ? 'gold' : item.gwa < 1.75 ? 'silver' : 'green';
        }

        // Delete a history item
        function deleteHistoryItem(id) {
            const history = getHistoryFromStorage();
            const updatedHistory = history.filter(item => item.id !== id);
            writeStoredArray(GWA_HISTORY_KEY, updatedHistory);
            displayHistory(updatedHistory);
        }

        // Clear all history
        function clearHistory() {
            if (confirm('Are you sure you want to clear all history?')) {
                writeStoredArray(GWA_HISTORY_KEY, []);
                loadAndDisplayHistory();
            }
        }

        function addCourseRow() {
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

            saveCourseDataToStorage();
            courseRow.querySelector('.grade-input').focus();
        }

        function removeCourseRow(event) {
            if (courseInputs.children.length > 1) {
                event.target.closest('.course-row').remove();
                updateRemoveButtonsVisibility();
                saveCourseDataToStorage(); // Save after removal
            }
        }

        function updateRemoveButtonsVisibility() {
            courseInputs.querySelectorAll('.course-row').forEach((row, index) => {
                row.querySelector('.grade-input').setAttribute('aria-label', `Grade for course ${index + 1}`);
                row.querySelector('.units-input').setAttribute('aria-label', `Units for course ${index + 1}`);
                row.querySelector('.remove-course-btn').setAttribute('aria-label', `Remove course ${index + 1}`);
            });
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

                if (!Number.isFinite(grade) || !Number.isFinite(units) || grade < 0 || units <= 0) {
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

        // The first row is already present in the HTML. Delegation also covers restored rows.
        updateRemoveButtonsVisibility();
        courseInputs.addEventListener('input', saveCourseDataToStorage);

        addCourseBtn.addEventListener('click', addCourseRow);
        calculateGwaBtn.addEventListener('click', calculateGWA);
        clearHistoryBtn.addEventListener('click', clearHistory);

        courseInputs.addEventListener('keydown', function (event) {
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
        courseInputs.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-course-btn')) {
                removeCourseRow(event);
            }
        });
    }
});