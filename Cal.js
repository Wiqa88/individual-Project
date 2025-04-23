// Google API Configuration
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';  // Replace with your actual client ID
const API_KEY = 'YOUR_GOOGLE_API_KEY';  // Replace with your actual API key
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar";

// Global variables
let gapi;
let tokenClient;
let gapiInited = false;
let gisInited = false;
let isSignedIn = false;
let calendars = [];
let events = [];
let currentView = 'month';
let currentDate = new Date();
let currentCalendarIds = ['primary']; // Default to primary calendar

document.addEventListener("DOMContentLoaded", function() {
    // Initialize the application
    initApp();
});

// Initialize Google API functionality
function initGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gapiInited = true;
        maybeEnableButtons();
    }).catch(error => {
        console.error('Error initializing GAPI client:', error);
        showNotification('Error', 'Failed to initialize Google Calendar API.');
    });
}

// Initialize Google Identity Services
function gisInit() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set later
    });
    gisInited = true;
    maybeEnableButtons();
}

// Initialize Google API when script is loaded
function gapiLoaded() {
    gapi.load('client', initGapiClient);
}

// Called when Google Identity Services script is loaded
function gisLoaded() {
    gisInit();
}

// Check if both Google APIs are initialized
function maybeEnableButtons() {
    const googleSigninButton = document.getElementById('google-signin-button');

    if (gapiInited && gisInited) {
        // Create and add the sign-in button
        const signInButton = document.createElement('button');
        signInButton.className = 'g-signin-button';
        signInButton.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google"> Sign in with Google';
        signInButton.onclick = handleAuthClick;
        googleSigninButton.appendChild(signInButton);

        // Update status
        updateSigninStatus();
    }
}

// Handle authentication
function handleAuthClick() {
    if (!isSignedIn) {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error('Error signing in:', resp);
                showNotification('Error', 'Failed to sign in with Google.');
                isSignedIn = false;
                updateSigninStatus();
                return;
            }

            isSignedIn = true;
            updateSigninStatus();
            await loadCalendarList();
            fetchEvents();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } else {
        // Sign out
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                gapi.client.setToken('');
                isSignedIn = false;
                updateSigninStatus();
                clearCalendarData();
            });
        }
    }
}

// Update the sign-in status display
function updateSigninStatus() {
    const statusElement = document.getElementById('google-calendar-status');
    const signInButton = document.querySelector('.g-signin-button');

    if (isSignedIn) {
        statusElement.textContent = 'Connected';
        statusElement.style.color = '#4caf50';
        signInButton.textContent = 'Sign Out';
    } else {
        statusElement.textContent = 'Not connected';
        statusElement.style.color = '';
        if (signInButton) {
            signInButton.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google"> Sign in with Google';
        }
    }
}

// Initialize the application
function initApp() {
    // Add API script tags dynamically
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = gapiLoaded;
    document.head.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = gisLoaded;
    document.head.appendChild(gisScript);

    // Set current date display
    updateCurrentPeriodDisplay();

    // Initialize month view
    renderMonthView(currentDate);

    // Set up navigation listeners
    setupNavigationListeners();

    // Set up view change listeners
    setupViewChangeListeners();

    // Set up modal interactions
    setupModalInteractions();

    // Handle window resize
    window.addEventListener('resize', handleResize);
}

// Load the list of user calendars
async function loadCalendarList() {
    try {
        document.getElementById('calendar-list-container').innerHTML = '<div style="text-align:center">Loading calendars...</div>';

        const response = await gapi.client.calendar.calendarList.list();
        calendars = response.result.items;

        // Render the calendar list
        renderCalendarList();

        // Update calendar dropdown in the event form
        updateCalendarDropdown();

        return calendars;
    } catch (error) {
        console.error('Error loading calendar list:', error);
        document.getElementById('calendar-list-container').innerHTML = '<div style="color:red">Failed to load calendars. Try again.</div>';
        return [];
    }
}

// Render the calendar list in the sidebar
function renderCalendarList() {
    const container = document.getElementById('calendar-list-container');
    container.innerHTML = '';

    calendars.forEach(calendar => {
        const calendarItem = document.createElement('div');
        calendarItem.className = 'calendar-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'calendar-checkbox';
        checkbox.value = calendar.id;
        checkbox.checked = currentCalendarIds.includes(calendar.id);
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                currentCalendarIds.push(calendar.id);
            } else {
                const index = currentCalendarIds.indexOf(calendar.id);
                if (index > -1) {
                    currentCalendarIds.splice(index, 1);
                }
            }
            fetchEvents();
        });

        const colorBox = document.createElement('span');
        colorBox.className = 'calendar-color';
        colorBox.style.backgroundColor = calendar.backgroundColor || '#4285F4';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'calendar-name';
        nameSpan.textContent = calendar.summary;

        calendarItem.appendChild(checkbox);
        calendarItem.appendChild(colorBox);
        calendarItem.appendChild(nameSpan);
        container.appendChild(calendarItem);
    });
}

// Update calendar dropdown in the event form
function updateCalendarDropdown() {
    const dropdown = document.getElementById('event-calendar');

    // Clear current options
    while (dropdown.firstChild) {
        dropdown.removeChild(dropdown.firstChild);
    }

    // Add calendars that user has write access to
    calendars.forEach(calendar => {
        if (calendar.accessRole === 'owner' || calendar.accessRole === 'writer') {
            const option = document.createElement('option');
            option.value = calendar.id;
            option.textContent = calendar.summary;
            dropdown.appendChild(option);
        }
    });
}

// Clear calendar data when signing out
function clearCalendarData() {
    calendars = [];
    events = [];
    document.getElementById('calendar-list-container').innerHTML = '';
    clearEvents();
}

// Setup Navigation Listeners
function setupNavigationListeners() {
    // Previous and Next buttons
    document.getElementById('prev-btn').addEventListener('click', () => {
        navigatePeriod('prev');
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        navigatePeriod('next');
    });

    // Sidebar navigation links
    document.getElementById('today-view').addEventListener('click', (e) => {
        e.preventDefault();
        currentDate = new Date();
        updateCurrentPeriodDisplay();
        renderActiveView();
        fetchEvents();
    });

    document.getElementById('week-view').addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'week';
        activateViewButton('week');
        renderActiveView();
        fetchEvents();
    });

    document.getElementById('month-view').addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'month';
        activateViewButton('month');
        renderActiveView();
        fetchEvents();
    });

    document.getElementById('agenda-view').addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'agenda';
        activateViewButton('agenda');
        renderActiveView();
        fetchEvents();
    });

    // Add event link
    document.getElementById('add-event-link').addEventListener('click', (e) => {
        e.preventDefault();
        if (!isSignedIn) {
            showNotification('Sign in required', 'Please sign in with Google to add events.');
            return;
        }
        openEventModal();
    });

    // Add calendar button
    document.getElementById('add-calendar-btn').addEventListener('click', () => {
        if (!isSignedIn) {
            showNotification('Sign in required', 'Please sign in with Google to add a calendar.');
            return;
        }
        // Redirect to Google Calendar to create a new calendar
        window.open('https://calendar.google.com/calendar/u/0/r/settings/createcalendar', '_blank');
    });
}

// Setup View Change Listeners
function setupViewChangeListeners() {
    const viewButtons = document.querySelectorAll('.view-btn');

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            currentView = view;
            activateViewButton(view);
            renderActiveView();
        });
    });
}

// Show more events modal/popup for a specific day
function showMoreEvents(events, dateKey) {
    // This could be implemented as a modal or dropdown showing all events for the day
    console.log(`Showing all ${events.length} events for ${dateKey}`);

    // For simplicity, we'll use the event details modal to show each event
    if (events.length > 0) {
        openEventDetailsModal(events[0]);
    }
}

// Modal Interactions
function setupModalInteractions() {
    // Event Creation Modal
    const eventModal = document.getElementById('event-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelEvent = document.getElementById('cancel-event');
    const eventForm = document.getElementById('event-form');

    closeModal.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });

    cancelEvent.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });

    // Event Details Modal
    const detailsModal = document.getElementById('event-details-modal');
    const closeDetailsModal = document.querySelector('.close-details-modal');
    const editEventBtn = document.getElementById('edit-event-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');

    closeDetailsModal.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    editEventBtn.addEventListener('click', () => {
        // Get the current event data from the details modal
        const eventId = detailsModal.dataset.eventId;
        const calendarId = detailsModal.dataset.calendarId;

        // Find the event and open the edit modal
        const event = events.find(e => e.id === eventId && e.calendarId === calendarId);
        if (event) {
            openEventModal(null, event);
            detailsModal.style.display = 'none';
        }
    });

    deleteEventBtn.addEventListener('click', () => {
        // Get the current event data from the details modal
        const eventId = detailsModal.dataset.eventId;
        const calendarId = detailsModal.dataset.calendarId;

        // Confirm deletion
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(eventId, calendarId);
            detailsModal.style.display = 'none';
        }
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            eventModal.style.display = 'none';
        }
        if (e.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
}

// Open the event creation/edit modal
function openEventModal(date = null, eventToEdit = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const titleField = document.getElementById('event-title');
    const startDateField = document.getElementById('event-start-date');
    const startTimeField = document.getElementById('event-start-time');
    const endDateField = document.getElementById('event-end-date');
    const endTimeField = document.getElementById('event-end-time');
    const descriptionField = document.getElementById('event-description');
    const locationField = document.getElementById('event-location');
    const calendarField = document.getElementById('event-calendar');
    const colorField = document.getElementById('event-color');

    // Clear previous values
    form.reset();

    // If editing an existing event
    if (eventToEdit) {
        form.dataset.mode = 'edit';
        form.dataset.eventId = eventToEdit.id;
        form.dataset.calendarId = eventToEdit.calendarId;

        titleField.value = eventToEdit.summary || '';
        descriptionField.value = eventToEdit.description || '';
        locationField.value = eventToEdit.location || '';

        // Set calendar
        if (eventToEdit.calendarId) {
            calendarField.value = eventToEdit.calendarId;
        }

        // Set color
        if (eventToEdit.colorId) {
            const colorValue = getEventColor(eventToEdit.colorId);
            const colorOption = Array.from(colorField.options).find(opt => opt.value === colorValue);
            if (colorOption) {
                colorField.value = colorValue;
            }
        }

        // Set dates and times
        const start = parseEventDate(eventToEdit.start);
        const end = parseEventDate(eventToEdit.end);

        startDateField.value = formatDateForInput(start);
        endDateField.value = formatDateForInput(end);

        // Only set times if this is not an all-day event
        if (!isAllDayEvent(eventToEdit)) {
            startTimeField.value = formatTimeForInput(start);
            endTimeField.value = formatTimeForInput(end);
        }
    } else {
        // Creating a new event
        form.dataset.mode = 'create';
        form.removeAttribute('data-event-id');
        form.removeAttribute('data-calendar-id');

        // Set default calendar (first writable calendar)
        const writableCalendar = calendars.find(cal =>
            cal.accessRole === 'owner' || cal.accessRole === 'writer');
        if (writableCalendar) {
            calendarField.value = writableCalendar.id;
        }

        // If a date was clicked
        if (date) {
            startDateField.value = formatDateForInput(date);

            // Set end date to the same day by default
            const endDate = new Date(date);
            endDateField.value = formatDateForInput(endDate);

            // If a specific hour was clicked (in day or week view)
            if (date.getHours() > 0) {
                startTimeField.value = formatTimeForInput(date);

                // Set end time to 1 hour later by default
                const endTime = new Date(date);
                endTime.setHours(endTime.getHours() + 1);
                endTimeField.value = formatTimeForInput(endTime);
            }
        } else {
            // Default to today
            const today = new Date();
            startDateField.value = formatDateForInput(today);
            endDateField.value = formatDateForInput(today);
        }
    }

    // Display the modal
    modal.style.display = 'flex';
    titleField.focus();
}

// Open the event details modal
function openEventDetailsModal(event) {
    const modal = document.getElementById('event-details-modal');

    // Set event data
    modal.dataset.eventId = event.id;
    modal.dataset.calendarId = event.calendarId;

    // Populate event details
    document.getElementById('event-details-title').textContent = event.summary;

    const timeElement = document.getElementById('event-details-time').querySelector('span');
    const start = parseEventDate(event.start);
    const end = parseEventDate(event.end);

    if (isAllDayEvent(event)) {
        if (isSameDay(start, end)) {
            timeElement.textContent = `All day, ${formatDateLong(start)}`;
        } else {
            timeElement.textContent = `All day, ${formatDateLong(start)} - ${formatDateLong(end)}`;
        }
    } else {
        if (isSameDay(start, end)) {
            timeElement.textContent = `${formatDateLong(start)}, ${formatTime(start)} - ${formatTime(end)}`;
        } else {
            timeElement.textContent = `${formatDateLong(start)}, ${formatTime(start)} - ${formatDateLong(end)}, ${formatTime(end)}`;
        }
    }

    const locationElement = document.getElementById('event-details-location').querySelector('span');
    locationElement.textContent = event.location || 'No location';

    const calendarElement = document.getElementById('event-details-calendar').querySelector('span');
    calendarElement.textContent = event.calendarName || 'Calendar';

    const descriptionElement = document.getElementById('event-details-description').querySelector('div');
    if (event.description) {
        descriptionElement.textContent = event.description;
    } else {
        descriptionElement.textContent = 'No description';
    }

    // Display the modal
    modal.style.display = 'flex';
}

// Save a new or updated event
function saveEvent() {
    const form = document.getElementById('event-form');
    const titleField = document.getElementById('event-title');
    const startDateField = document.getElementById('event-start-date');
    const startTimeField = document.getElementById('event-start-time');
    const endDateField = document.getElementById('event-end-date');
    const endTimeField = document.getElementById('event-end-time');
    const descriptionField = document.getElementById('event-description');
    const locationField = document.getElementById('event-location');
    const calendarField = document.getElementById('event-calendar');
    const colorField = document.getElementById('event-color');

    // Get values
    const title = titleField.value.trim();
    const description = descriptionField.value.trim();
    const location = locationField.value.trim();
    const calendarId = calendarField.value;
    const colorValue = colorField.value;

    // Get dates
    let startDate = new Date(startDateField.value);
    let endDate = new Date(endDateField.value);

    // Check if times are specified
    const isAllDay = !startTimeField.value && !endTimeField.value;

    if (!isAllDay) {
        // Add time components
        const [startHours, startMinutes] = startTimeField.value.split(':').map(Number);
        const [endHours, endMinutes] = endTimeField.value.split(':').map(Number);

        startDate.setHours(startHours, startMinutes, 0);
        endDate.setHours(endHours, endMinutes, 0);
    } else {
        // All-day events should be set to midnight
        startDate.setHours(0, 0, 0);
        endDate.setHours(23, 59, 59);
    }

    // Validate inputs
    if (!title) {
        alert('Please enter an event title.');
        return;
    }

    if (startDate > endDate) {
        alert('End time cannot be before start time.');
        return;
    }

    // Prepare event data
    const eventData = {
        summary: title,
        description: description,
        location: location,
        start: {
            dateTime: isAllDay ? undefined : startDate.toISOString(),
            date: isAllDay ? formatDateForGoogle(startDate) : undefined
        },
        end: {
            dateTime: isAllDay ? undefined : endDate.toISOString(),
            date: isAllDay ? formatDateForGoogle(new Date(endDate.setDate(endDate.getDate() + 1))) : undefined
        },
        colorId: getColorId(colorValue)
    };

    // Determine if we're creating or updating
    const isEdit = form.dataset.mode === 'edit';

    if (isEdit) {
        // Update existing event
        const eventId = form.dataset.eventId;
        const eventCalendarId = form.dataset.calendarId;

        gapi.client.calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            resource: eventData
        }).then(response => {
            showNotification('Success', 'Event updated successfully!');
            fetchEvents(); // Refresh events
            document.getElementById('event-modal').style.display = 'none';
        }).catch(error => {
            console.error('Error updating event:', error);
            showNotification('Error', 'Failed to update event. Please try again.');
        });
    } else {
        // Create new event
        gapi.client.calendar.events.insert({
            calendarId: calendarId,
            resource: eventData
        }).then(response => {
            showNotification('Success', 'Event created successfully!');
            fetchEvents(); // Refresh events
            document.getElementById('event-modal').style.display = 'none';
        }).catch(error => {
            console.error('Error creating event:', error);
            showNotification('Error', 'Failed to create event. Please try again.');
        });
    }
}

// Delete an event
function deleteEvent(eventId, calendarId) {
    gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
    }).then(response => {
        showNotification('Success', 'Event deleted successfully!');
        fetchEvents(); // Refresh events
    }).catch(error => {
        console.error('Error deleting event:', error);
        showNotification('Error', 'Failed to delete event. Please try again.');
    });
}

// Handle window resize
function handleResize() {
    // Recalculate view layouts if needed
    if (currentView === 'month') {
        // Nothing special needed for month view
    } else if (currentView === 'week' || currentView === 'day') {
        // Might need to recalculate event positions
    }
}

// Utility Functions

// Get the start date of the week containing the given date
function getWeekStartDate(date) {
    const result = new Date(date);
    const day = result.getDay();

    // Set to previous Sunday
    result.setDate(result.getDate() - day);
    result.setHours(0, 0, 0, 0);

    return result;
}

// Format a date for dataset attributes (YYYY-MM-DD)
function formatDateForDataset(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format a date for Google API (YYYY-MM-DD)
function formatDateForGoogle(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format a date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format a time for input fields (HH:MM)
function formatTimeForInput(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Format a date for agenda view grouping (YYYY-MM-DD)
function formatDateForAgenda(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format a date header for agenda view (Day of week, Month Day)
function formatDateHeader(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

// Format a date as a long string (Month Day, Year)
function formatDateLong(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Format time in 12-hour format (e.g., "1:30 PM")
function formatTime(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
}

// Parse date from Google Calendar event
function parseEventDate(dateObj) {
    if (!dateObj) return new Date();

    if (dateObj.dateTime) {
        return new Date(dateObj.dateTime);
    } else if (dateObj.date) {
        // All-day events have a date string only
        return new Date(dateObj.date);
    }

    return new Date();
}

// Check if a date is within a specific week
function isDateInWeek(date, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return date >= weekStart && date < weekEnd;
}

// Check if two dates are on the same day
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// Get event color from color ID
function getEventColor(colorId) {
    const colors = {
        '1': '#7986CB', // Lavender
        '2': '#33B679', // Sage
        '3': '#8E24AA', // Grape
        '4': '#E67C73', // Flamingo
        '5': '#F6BF26', // Banana
        '6': '#F4511E', // Tangerine
        '7': '#039BE5', // Peacock
        '8': '#616161', // Graphite
        '9': '#3F51B5', // Blueberry
        '10': '#0B8043', // Basil
        '11': '#D50000'  // Tomato
    };

    return colors[colorId] || '#4285F4'; // Default to blue
}

// Get color ID from color value
function getColorId(colorValue) {
    const colorMap = {
        '#7986CB': '1', // Lavender
        '#33B679': '2', // Sage
        '#8E24AA': '3', // Grape
        '#E67C73': '4', // Flamingo
        '#F6BF26': '5', // Banana
        '#F4511E': '6', // Tangerine
        '#039BE5': '7', // Peacock
        '#616161': '8', // Graphite
        '#3F51B5': '9', // Blueberry
        '#0B8043': '10', // Basil
        '#D50000': '11', // Tomato
        '#4285F4': null // Default blue (no specific ID)
    };

    return colorMap[colorValue] || null;
}

// Check if an event is an all-day event
function isAllDayEvent(event) {
    return Boolean(event.start?.date || event.end?.date);
}

// Show a notification to the user
function showNotification(title, message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    // Set content
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
    `;

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide after timeout
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize the application
// Add gapiLoaded and gisLoaded functions globally for script tags
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;

// Activate the selected view button
function activateViewButton(view) {
    const viewButtons = document.querySelectorAll('.view-btn');

    viewButtons.forEach(button => {
        if (button.getAttribute('data-view') === view) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Navigate to previous or next period
function navigatePeriod(direction) {
    if (currentView === 'month') {
        if (direction === 'prev') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    } else if (currentView === 'week') {
        if (direction === 'prev') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else {
            currentDate.setDate(currentDate.getDate() + 7);
        }
    } else if (currentView === 'day') {
        if (direction === 'prev') {
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            currentDate.setDate(currentDate.getDate() + 1);
        }
    } else if (currentView === 'agenda') {
        if (direction === 'prev') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    }

    updateCurrentPeriodDisplay();
    renderActiveView();
    fetchEvents();
}

// Update the display of the current period
function updateCurrentPeriodDisplay() {
    const element = document.getElementById('current-period');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (currentView === 'month') {
        element.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
        const weekStart = getWeekStartDate(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        if (weekStart.getMonth() === weekEnd.getMonth()) {
            element.textContent = `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
            element.textContent = `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
    } else if (currentView === 'day') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        element.textContent = `${days[currentDate.getDay()]}, ${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    } else if (currentView === 'agenda') {
        element.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

// Render the appropriate view based on the current selection
function renderActiveView() {
    const viewElements = document.querySelectorAll('.calendar-view');

    viewElements.forEach(element => {
        if (element.id === `${currentView}-grid`) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });

    if (currentView === 'month') {
        renderMonthView(currentDate);
    } else if (currentView === 'week') {
        renderWeekView(currentDate);
    } else if (currentView === 'day') {
        renderDayView(currentDate);
    } else if (currentView === 'agenda') {
        renderAgendaView(currentDate);
    }
}

// Calendar View Rendering Functions
function renderMonthView(date) {
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = ''; // Clear existing content

    const today = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // Get the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);

    // Get the first day to display (might be in the previous month)
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    // Create 6 weeks (42 days) of calendar cells
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(startDay);
        currentDay.setDate(startDay.getDate() + i);

        const isToday = currentDay.getDate() === today.getDate() &&
            currentDay.getMonth() === today.getMonth() &&
            currentDay.getFullYear() === today.getFullYear();

        const isOtherMonth = currentDay.getMonth() !== currentMonth;

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = formatDateForDataset(currentDay);

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        // Day number wrapper
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDay.getDate();
        dayElement.appendChild(dayNumber);

        // Add click handler for adding events
        dayElement.addEventListener('click', function(e) {
            if (e.target === dayElement || e.target === dayNumber) {
                if (!isSignedIn) {
                    showNotification('Sign in required', 'Please sign in with Google to add events.');
                    return;
                }

                const clickedDate = new Date(this.dataset.date);
                openEventModal(clickedDate);
            }
        });

        calendarDays.appendChild(dayElement);
    }
}

function renderWeekView(date) {
    const weekDays = document.getElementById('week-days');
    const weekSlots = document.getElementById('week-slots');

    weekDays.innerHTML = '';
    weekSlots.innerHTML = '';

    const today = new Date();
    const weekStart = getWeekStartDate(date);

    // Add the day headers
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);

        const isToday = currentDay.getDate() === today.getDate() &&
            currentDay.getMonth() === today.getMonth() &&
            currentDay.getFullYear() === today.getFullYear();

        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        if (isToday) dayHeader.classList.add('today');

        const dayName = document.createElement('div');
        dayName.className = 'week-day-name';
        dayName.textContent = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDay.getDay()];

        const dayDate = document.createElement('div');
        dayDate.className = 'week-day-date';
        dayDate.textContent = currentDay.getDate();

        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);
        weekDays.appendChild(dayHeader);
    }

    // Create the time slots for each day
    for (let hour = 0; hour < 24; hour++) {
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + day);
            currentDay.setHours(hour, 0, 0, 0);

            const isCurrentHour = today.getHours() === hour &&
                today.getDate() === currentDay.getDate() &&
                today.getMonth() === currentDay.getMonth() &&
                today.getFullYear() === currentDay.getFullYear();

            const timeSlot = document.createElement('div');
            timeSlot.className = 'week-time-slot';
            timeSlot.dataset.date = formatDateForDataset(currentDay);
            timeSlot.dataset.hour = hour;

            // Add current time indicator if this is the current hour
            if (isCurrentHour) {
                const currentMinute = today.getMinutes();
                const indicatorPosition = (currentMinute / 60) * 100;

                const nowIndicator = document.createElement('div');
                nowIndicator.className = 'week-time-now-indicator';
                nowIndicator.style.top = `${indicatorPosition}%`;
                timeSlot.appendChild(nowIndicator);
            }

            // Add click handler for adding events
            timeSlot.addEventListener('click', function() {
                if (!isSignedIn) {
                    showNotification('Sign in required', 'Please sign in with Google to add events.');
                    return;
                }

                const clickedDate = new Date(this.dataset.date);
                clickedDate.setHours(parseInt(this.dataset.hour), 0, 0, 0);
                openEventModal(clickedDate);
            });

            weekSlots.appendChild(timeSlot);
        }
    }
}

function renderDayView(date) {
    const dayHeader = document.getElementById('current-day');
    const daySlots = document.getElementById('day-slots');

    dayHeader.innerHTML = '';
    daySlots.innerHTML = '';

    const today = new Date();

    // Add the day header
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const headerText = document.createElement('div');
    headerText.textContent = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    dayHeader.appendChild(headerText);

    // Create the time slots
    for (let hour = 0; hour < 24; hour++) {
        const currentDay = new Date(date);
        currentDay.setHours(hour, 0, 0, 0);

        const isCurrentHour = today.getHours() === hour &&
            today.getDate() === date.getDate() &&
            today.getMonth() === date.getMonth() &&
            today.getFullYear() === date.getFullYear();

        const timeSlot = document.createElement('div');
        timeSlot.className = 'day-time-slot';
        timeSlot.dataset.date = formatDateForDataset(currentDay);
        timeSlot.dataset.hour = hour;

        // Add current time indicator if this is the current hour
        if (isCurrentHour) {
            const currentMinute = today.getMinutes();
            const indicatorPosition = (currentMinute / 60) * 100;

            const nowIndicator = document.createElement('div');
            nowIndicator.className = 'day-time-now-indicator';
            nowIndicator.style.top = `${indicatorPosition}%`;
            timeSlot.appendChild(nowIndicator);
        }

        // Add click handler for adding events
        timeSlot.addEventListener('click', function() {
            if (!isSignedIn) {
                showNotification('Sign in required', 'Please sign in with Google to add events.');
                return;
            }

            const clickedDate = new Date(this.dataset.date);
            clickedDate.setHours(parseInt(this.dataset.hour), 0, 0, 0);
            openEventModal(clickedDate);
        });

        daySlots.appendChild(timeSlot);
    }
}

function renderAgendaView(date) {
    const agendaEvents = document.getElementById('agenda-events');
    agendaEvents.innerHTML = '<div style="text-align:center; padding:20px;">Loading events...</div>';

    // Will be populated by events when they are fetched
}

// Event Fetching and Rendering
function fetchEvents() {
    if (!isSignedIn || currentCalendarIds.length === 0) {
        clearEvents();
        if (currentView === 'agenda') {
            document.getElementById('agenda-events').innerHTML = '<div style="text-align:center; padding:20px;">Sign in with Google to view your events.</div>';
        }
        return;
    }

    const calendarContainer = document.querySelector('.calendar-container');
    calendarContainer.classList.add('loading');

    // Determine date range based on current view
    let timeMin, timeMax;

    if (currentView === 'month') {
        // Start from the first day shown (previous month)
        const firstDay = document.querySelector('.calendar-day');
        const firstDate = new Date(firstDay.dataset.date);
        timeMin = firstDate.toISOString();

        // End at the last day shown (next month)
        const lastDay = document.querySelectorAll('.calendar-day')[41];
        const lastDate = new Date(lastDay.dataset.date);
        lastDate.setHours(23, 59, 59);
        timeMax = lastDate.toISOString();
    } else if (currentView === 'week') {
        const weekStart = getWeekStartDate(currentDate);
        timeMin = weekStart.toISOString();

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        weekEnd.setSeconds(-1);
        timeMax = weekEnd.toISOString();
    } else if (currentView === 'day') {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        timeMin = dayStart.toISOString();

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        timeMax = dayEnd.toISOString();
    } else if (currentView === 'agenda') {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        timeMin = monthStart.toISOString();

        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        timeMax = monthEnd.toISOString();
    }

    // Clear existing events
    clearEvents();

    // Promises array for all calendar requests
    const promises = [];

    // Fetch events from each selected calendar
    currentCalendarIds.forEach(calendarId => {
        const promise = gapi.client.calendar.events.list({
            'calendarId': calendarId,
            'timeMin': timeMin,
            'timeMax': timeMax,
            'singleEvents': true,
            'orderBy': 'startTime'
        }).then(response => {
            const calendarEvents = response.result.items;

            // Find this calendar's color
            const calendar = calendars.find(cal => cal.id === calendarId);
            const calendarColor = calendar ? calendar.backgroundColor : '#4285F4';

            // Add the events to our global array with the calendar color
            calendarEvents.forEach(event => {
                events.push({
                    ...event,
                    calendarId: calendarId,
                    calendarName: calendar ? calendar.summary : 'Calendar',
                    color: event.colorId ? getEventColor(event.colorId) : calendarColor
                });
            });
        }).catch(error => {
            console.error(`Error fetching events for calendar ${calendarId}:`, error);
        });

        promises.push(promise);
    });

    // When all promises are resolved, render events
    Promise.all(promises).then(() => {
        renderEvents();
        calendarContainer.classList.remove('loading');
    }).catch(error => {
        console.error('Error fetching events:', error);
        calendarContainer.classList.remove('loading');
        showNotification('Error', 'Failed to fetch events. Please try again.');
    });
}

// Clear events from all views
function clearEvents() {
    events = [];

    // Clear month view events
    document.querySelectorAll('.calendar-event').forEach(el => el.remove());
    document.querySelectorAll('.more-events').forEach(el => el.remove());

    // Clear week view events
    document.querySelectorAll('.week-event').forEach(el => el.remove());

    // Clear day view events
    document.querySelectorAll('.day-event').forEach(el => el.remove());

    // Clear agenda view
    if (currentView === 'agenda') {
        document.getElementById('agenda-events').innerHTML = '';
    }
}

// Render events in the current view
function renderEvents() {
    if (events.length === 0) {
        if (currentView === 'agenda') {
            document.getElementById('agenda-events').innerHTML = '<div style="text-align:center; padding:20px;">No events found for this period.</div>';
        }
        return;
    }

    if (currentView === 'month') {
        renderMonthEvents();
    } else if (currentView === 'week') {
        renderWeekEvents();
    } else if (currentView === 'day') {
        renderDayEvents();
    } else if (currentView === 'agenda') {
        renderAgendaEvents();
    }
}

// Render events in month view
function renderMonthEvents() {
    // Group events by day
    const eventsByDay = {};

    events.forEach(event => {
        const start = parseEventDate(event.start);
        const end = parseEventDate(event.end);

        // For multi-day events, add to each day in the range
        let currentDay = new Date(start);
        while (currentDay <= end) {
            const dateKey = formatDateForDataset(currentDay);

            if (!eventsByDay[dateKey]) {
                eventsByDay[dateKey] = [];
            }

            eventsByDay[dateKey].push(event);

            // Move to next day
            currentDay.setDate(currentDay.getDate() + 1);
        }
    });

    // Render events in each day cell
    Object.keys(eventsByDay).forEach(dateKey => {
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);
        if (!dayCell) return;

        const dayEvents = eventsByDay[dateKey];
        const maxVisibleEvents = 3; // Maximum number of events to show before "more" link

        // Sort events by start time
        dayEvents.sort((a, b) => {
            const aStart = parseEventDate(a.start);
            const bStart = parseEventDate(b.start);
            return aStart - bStart;
        });

        // Render visible events
        const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
        visibleEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event';
            eventElement.style.backgroundColor = event.color;
            eventElement.textContent = event.summary;
            eventElement.dataset.eventId = event.id;
            eventElement.dataset.calendarId = event.calendarId;

            // Click handler to show event details
            eventElement.addEventListener('click', e => {
                e.stopPropagation();
                openEventDetailsModal(event);
            });

            dayCell.appendChild(eventElement);
        });

        // Add "more" link if there are more events
        if (dayEvents.length > maxVisibleEvents) {
            const moreLink = document.createElement('div');
            moreLink.className = 'more-events';
            moreLink.textContent = `+ ${dayEvents.length - maxVisibleEvents} more`;

            moreLink.addEventListener('click', e => {
                e.stopPropagation();
                showMoreEvents(dayEvents, dateKey);
            });

            dayCell.appendChild(moreLink);
        }
    });
}

// Render events in week view
function renderWeekEvents() {
    events.forEach(event => {
        const start = parseEventDate(event.start);
        const end = parseEventDate(event.end);

        // Check if this is an all-day event
        const isAllDay = isAllDayEvent(event);

        if (isAllDay) {
            // Handle all-day events
            renderAllDayEvent(event, 'week');
        } else {
            // Regular timed event
            // For each day the event spans
            let currentDay = new Date(start);
            while (currentDay <= end && currentDay.getDate() <= end.getDate()) {
                if (isDateInWeek(currentDay, getWeekStartDate(currentDate))) {
                    // Find the correct time slot
                    const dateKey = formatDateForDataset(currentDay);
                    const startHour = currentDay.getHours();
                    const timeSlot = document.querySelector(`.week-time-slot[data-date="${dateKey}"][data-hour="${startHour}"]`);

                    if (timeSlot) {
                        // Calculate event position and height
                        const eventStart = new Date(Math.max(currentDay, start));
                        const eventEnd = new Date(Math.min(
                            new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 23, 59, 59),
                            end
                        ));

                        const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                        const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
                        const durationMinutes = endMinutes - startMinutes;

                        const topPosition = (eventStart.getMinutes() / 60) * 100;
                        const height = (durationMinutes / 60) * 100;

                        // Create event element
                        const eventElement = document.createElement('div');
                        eventElement.className = 'week-event';
                        eventElement.style.backgroundColor = event.color;
                        eventElement.style.top = `${topPosition}%`;
                        eventElement.style.height = `${height}%`;
                        eventElement.dataset.eventId = event.id;
                        eventElement.dataset.calendarId = event.calendarId;

                        // Format time for display
                        const startTime = formatTime(eventStart);
                        eventElement.innerHTML = `<strong>${startTime}</strong> ${event.summary}`;

                        // Click handler to show event details
                        eventElement.addEventListener('click', e => {
                            e.stopPropagation();
                            openEventDetailsModal(event);
                        });

                        timeSlot.appendChild(eventElement);
                    }
                }

                // Move to next day
                currentDay.setDate(currentDay.getDate() + 1);
            }
        }
    });
}

// Render events in day view
function renderDayEvents() {
    events.forEach(event => {
        const start = parseEventDate(event.start);
        const end = parseEventDate(event.end);

        // Check if event is on the current day
        const eventDate = formatDateForDataset(start);
        const currentDateStr = formatDateForDataset(currentDate);

        if (eventDate === currentDateStr || (start <= currentDate && end >= currentDate)) {
            // Check if this is an all-day event
            const isAllDay = isAllDayEvent(event);

            if (isAllDay) {
                // Handle all-day events
                renderAllDayEvent(event, 'day');
            } else {
                // Regular timed event
                // Calculate event positions relative to this day
                const dayStart = new Date(currentDate);
                dayStart.setHours(0, 0, 0, 0);

                const eventStart = new Date(Math.max(start, dayStart));
                const eventEnd = new Date(Math.min(end, new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59)));

                const startHour = eventStart.getHours();
                const timeSlot = document.querySelector(`.day-time-slot[data-hour="${startHour}"]`);

                if (timeSlot) {
                    // Calculate position and height
                    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
                    const durationMinutes = endMinutes - startMinutes;

                    const topPosition = (eventStart.getMinutes() / 60) * 100;
                    const height = (durationMinutes / 60) * 100;

                    // Create event element
                    const eventElement = document.createElement('div');
                    eventElement.className = 'day-event';
                    eventElement.style.backgroundColor = event.color;
                    eventElement.style.top = `${topPosition}%`;
                    eventElement.style.height = `${height}%`;
                    eventElement.dataset.eventId = event.id;
                    eventElement.dataset.calendarId = event.calendarId;

                    // Format time for display
                    const startTime = formatTime(eventStart);
                    eventElement.innerHTML = `<strong>${startTime}</strong> ${event.summary}`;

                    // Click handler to show event details
                    eventElement.addEventListener('click', e => {
                        e.stopPropagation();
                        openEventDetailsModal(event);
                    });

                    timeSlot.appendChild(eventElement);
                }
            }
        }
    });
}

// Render all-day events in week or day view
function renderAllDayEvent(event, viewType) {
    // Implementation depends on your HTML structure for all-day events
    // This is a placeholder for that functionality
    console.log(`Rendering all-day event in ${viewType} view:`, event.summary);
}

// Render events in agenda view
function renderAgendaEvents() {
    const agendaContainer = document.getElementById('agenda-events');
    agendaContainer.innerHTML = '';

    // Group events by date
    const eventsByDate = {};

    events.forEach(event => {
        const start = parseEventDate(event.start);
        const dateKey = formatDateForAgenda(start);

        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }

        eventsByDate[dateKey].push(event);
    });

    // If no events found
    if (Object.keys(eventsByDate).length === 0) {
        agendaContainer.innerHTML = '<div style="text-align:center; padding:20px;">No events found for this period.</div>';
        return;
    }

    // Sort dates
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    // Create agenda items for each date
    sortedDates.forEach(dateKey => {
        // Create date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'agenda-date-header';
        dateHeader.textContent = formatDateHeader(new Date(dateKey));
        agendaContainer.appendChild(dateHeader);

        // Sort events by start time
        const dayEvents = eventsByDate[dateKey].sort((a, b) => {
            return parseEventDate(a.start) - parseEventDate(b.start);
        });

        // Create event items
        dayEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'agenda-item';
            eventItem.style.borderLeftColor = event.color;

            const timeElement = document.createElement('div');
            timeElement.className = 'agenda-time';

            if (isAllDayEvent(event)) {
                timeElement.textContent = 'All day';
            } else {
                const start = parseEventDate(event.start);
                const end = parseEventDate(event.end);
                timeElement.textContent = `${formatTime(start)} - ${formatTime(end)}`;
            }

            const detailsElement = document.createElement('div');
            detailsElement.className = 'agenda-details';

            const titleElement = document.createElement('div');
            titleElement.className = 'agenda-title';
            titleElement.textContent = event.summary;

            detailsElement.appendChild(titleElement);

            if (event.location) {
                const locationElement = document.createElement('div');
                locationElement.className = 'agenda-location';
                locationElement.textContent = event.location;
                detailsElement.appendChild(locationElement);
            }

            eventItem.appendChild(timeElement);
            eventItem.appendChild(detailsElement);

            // Click handler to show event details
            eventItem.addEventListener('click', () => {
                openEventDetailsModal(event);
            });

            agendaContainer.appendChild(eventItem);
        });
    });
}