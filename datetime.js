// Set today as default for date inputs
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    populateTimezones();
};

function populateTimezones() {
    const fromTimezone = document.getElementById('from-timezone');
    const toTimezone = document.getElementById('to-timezone');
    const timezones = Intl.supportedValuesOf('timeZone');

    timezones.forEach(zone => {
        const option1 = document.createElement('option');
        option1.value = zone;
        option1.textContent = zone;
        fromTimezone.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = zone;
        option2.textContent = zone;
        toTimezone.appendChild(option2);
    });

    // Set default values
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fromTimezone.value = localTimezone;
    toTimezone.value = 'UTC';
}

function convertTimezone() {
    const fromTimezone = document.getElementById('from-timezone').value;
    const toTimezone = document.getElementById('to-timezone').value;
    const resultDiv = document.getElementById('timezone-result');

    const now = new Date();
    const fromTime = now.toLocaleString("en-US", {timeZone: fromTimezone, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false});
    const toTime = now.toLocaleString("en-US", {timeZone: toTimezone, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false});

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `Current time in ${fromTimezone} is ${fromTime}.<br>Current time in ${toTimezone} is ${toTime}.`;
}

function filterTimezones(type) {
    const searchInput = document.getElementById(`${type}-timezone-search`);
    const selectElement = document.getElementById(`${type}-timezone`);
    const filter = searchInput.value.toUpperCase();
    const options = selectElement.getElementsByTagName('option');

    // Reset all options to be visible first
    for (let i = 0; i < options.length; i++) {
        options[i].style.display = "";
    }

    // Then hide only those that don't match the filter
    if (filter !== "") {
        for (let i = 0; i < options.length; i++) {
            const txtValue = options[i].textContent || options[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) === -1) {
                options[i].style.display = "none";
            }
        }
    }
}

function calculateDateDifference() {
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);

    if (document.getElementById('start-date').value && document.getElementById('end-date').value) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const resultDiv = document.getElementById('date-diff-result');
        resultDiv.style.display = 'block';

        if (daysDiff >= 0) {
            resultDiv.innerHTML = `${daysDiff} day(s) between the dates`;
        } else {
            resultDiv.innerHTML = `${Math.abs(daysDiff)} day(s) have passed.`;
        }
    } else {
        alert("Please select both dates.");
    }
}

function calculateAge() {
    const birthDateStr = document.getElementById('birth-date').value;
    if (birthDateStr) {
        const birthDate = new Date(birthDateStr);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const resultDiv = document.getElementById('age-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `You are ${age} years old`;
    } else {
        alert("Please select a birth date.");
    }
}

function addSubtractDays() {
    const baseDateStr = document.getElementById('base-date').value;
    const days = parseInt(document.getElementById('days-to-add').value);

    if (baseDateStr && !isNaN(days)) {
        const baseDate = new Date(baseDateStr);
        // Add a day to counteract timezone issues that can make the date off by one.
        const newDate = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000));

        const resultDiv = document.getElementById('date-result');
        resultDiv.style.display = 'block';

        const formattedDate = newDate.toISOString().split('T')[0];
        resultDiv.innerHTML = `New date: ${formattedDate}`;
    } else {
        alert("Please select a base date and enter a valid number of days.");
    }
}

function calculateCountdown() {
    const anniversaryDateStr = document.getElementById('anniversary-date').value;
    if (anniversaryDateStr) {
        const anniversaryDate = new Date(anniversaryDateStr);
        const today = new Date();
        today.setHours(0,0,0,0); // Set today's time to the beginning of the day

        const timeDiff = anniversaryDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const resultDiv = document.getElementById('countdown-result');
        resultDiv.style.display = 'block';

        if (daysLeft > 0) {
            resultDiv.innerHTML = `${daysLeft} day(s) until the event.`;
        } else if (daysLeft === 0) {
            resultDiv.innerHTML = "Today is the event!";
        } else {
            resultDiv.innerHTML = `The event was ${Math.abs(daysLeft)} day(s) ago.`;
        }
    } else {
        alert("Please select an anniversary date.");
    }
}

function calculateTimeInterval() {
    const startHour = parseInt(document.getElementById('start-hour').value) || 0;
    const startMinute = parseInt(document.getElementById('start-minute').value) || 0;
    const startSecond = parseInt(document.getElementById('start-second').value) || 0;

    const endHour = parseInt(document.getElementById('end-hour').value) || 0;
    const endMinute = parseInt(document.getElementById('end-minute').value) || 0;
    const endSecond = parseInt(document.getElementById('end-second').value) || 0;

    if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
        startSecond < 0 || startSecond > 59 || endHour < 0 || endHour > 23 ||
        endMinute < 0 || endMinute > 59 || endSecond < 0 || endSecond > 59) {
        alert("Please enter valid time values (Hours: 0-23, Minutes/Seconds: 0-59).");
        return;
    }

    const startTimeSeconds = startHour * 3600 + startMinute * 60 + startSecond;
    const endTimeSeconds = endHour * 3600 + endMinute * 60 + endSecond;

    let diffSeconds = endTimeSeconds - startTimeSeconds;
    if (diffSeconds < 0) {
        diffSeconds += 86400; // Add 24 hours if end time is on the next day
    }

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    const resultDiv = document.getElementById('time-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `Difference: ${hours}h ${minutes}m ${seconds}s`;
}

function addTime() {
    const addHour = parseInt(document.getElementById('add-hour').value) || 0;
    const addMinute = parseInt(document.getElementById('add-minute').value) || 0;
    const addSecond = parseInt(document.getElementById('add-second').value) || 0;

    if (addHour < 0 || addMinute < 0 || addSecond < 0) {
        alert("Please enter non-negative time values.");
        return;
    }

    const now = new Date();
    now.setHours(now.getHours() + addHour);
    now.setMinutes(now.getMinutes() + addMinute);
    now.setSeconds(now.getSeconds() + addSecond);

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const resultDiv = document.getElementById('add-time-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `The new time will be: ${hours}:${minutes}:${seconds}`;
}
