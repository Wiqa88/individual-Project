// Settings Page JavaScript
document.addEventListener("DOMContentLoaded", function() {
    // Initialize settings
    loadSavedSettings();
    setupEventListeners();

    // Set initial active section
    showSection('appearance-section');
});

// Load saved settings from localStorage
function loadSavedSettings() {
    // Theme
    const savedTheme = localStorage.getItem("app-theme") || "light";
    document.getElementById("theme-selector").value = savedTheme;
    applyTheme(savedTheme);

    // Accent Color
    const savedAccentColor = localStorage.getItem("accent-color") || "#1e3a8a";
    setActiveColorOption(savedAccentColor);
    applyAccentColor(savedAccentColor);

    // Font Size
    const savedFontSize = localStorage.getItem("font-size") || "100";
    document.getElementById("font-size-slider").value = savedFontSize;
    document.querySelector(".range-value").textContent = savedFontSize + "%";
    applyFontSize(savedFontSize);

    // Notifications
    const notificationsEnabled = localStorage.getItem("enable-notifications") !== "false";
    document.getElementById("enable-notifications").checked = notificationsEnabled;

    // Sound Alerts
    const soundAlertsEnabled = localStorage.getItem("sound-alerts") === "true";
    document.getElementById("sound-alerts").checked = soundAlertsEnabled;

    // Reminder Time
    const reminderTime = localStorage.getItem("reminder-time") || "30";
    document.getElementById("reminder-time").value = reminderTime;

    // Email Notifications
    const emailNotificationsEnabled = localStorage.getItem("email-notifications") === "true";
    document.getElementById("email-notifications").checked = emailNotificationsEnabled;

    // Default View
    const defaultView = localStorage.getItem("default-view") || "today";
    document.getElementById("default-view").value = defaultView;

    // Default Sort
    const defaultSort = localStorage.getItem("default-sort") || "date";
    document.getElementById("default-sort").value = defaultSort;

    // Confirm Delete
    const confirmDelete = localStorage.getItem("confirm-delete") !== "false";
    document.getElementById("confirm-delete").checked = confirmDelete;

    // Cloud Sync
    const cloudSyncEnabled = localStorage.getItem("cloud-sync") === "true";
    document.getElementById("cloud-sync").checked = cloudSyncEnabled;
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation between sections
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            // Get the section ID from the href attribute
            const sectionId = this.getAttribute('href').substring(1);

            // Show the selected section
            showSection(sectionId);

            // Update active nav item
            document.querySelectorAll('.settings-nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Theme selector
    document.getElementById('theme-selector').addEventListener('change', function() {
        const theme = this.value;
        applyTheme(theme);
        localStorage.setItem("app-theme", theme);
    });

    // Accent color
    document.querySelectorAll('.color-option').forEach(colorOption => {
        colorOption.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            setActiveColorOption(color);
            applyAccentColor(color);
            localStorage.setItem("accent-color", color);
        });
    });

    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    const rangeValue = document.querySelector('.range-value');

    fontSizeSlider.addEventListener('input', function() {
        const fontSize = this.value;
        rangeValue.textContent = fontSize + '%';
        applyFontSize(fontSize);
        localStorage.setItem("font-size", fontSize);
    });

    // Toggle switches
    setupToggleSwitch('enable-notifications');
    setupToggleSwitch('sound-alerts');
    setupToggleSwitch('email-notifications');
    setupToggleSwitch('confirm-delete');
    setupToggleSwitch('cloud-sync');

    // Select dropdowns
    setupSelectChange('reminder-time');
    setupSelectChange('default-view');
    setupSelectChange('default-sort');

    // Buttons
    document.querySelector('.edit-profile-btn').addEventListener('click', function() {
        alert('Edit Profile functionality would be implemented here.');
    });

    document.querySelector('.change-password-btn').addEventListener('click', function() {
        alert('Change Password functionality would be implemented here.');
    });

    document.querySelector('.export-btn').addEventListener('click', function() {
        exportData();
    });

    document.querySelector('.import-btn').addEventListener('click', function() {
        alert('Import functionality would be implemented here. Would normally open a file dialog.');
    });
}

// Toggle switch setup
function setupToggleSwitch(id) {
    const toggleElement = document.getElementById(id);
    toggleElement.addEventListener('change', function() {
        localStorage.setItem(id, this.checked);
    });
}

// Select dropdown setup
function setupSelectChange(id) {
    const selectElement = document.getElementById(id);
    selectElement.addEventListener('change', function() {
        localStorage.setItem(id, this.value);
    });
}

// Show specific settings section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    document.getElementById(sectionId).classList.add('active');
}

// Set active color option
function setActiveColorOption(color) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-color') === color) {
            option.classList.add('active');
        }
    });
}

// Apply theme
function applyTheme(theme) {
    // In a real application, this would apply the theme throughout the app
    // For demo purposes, we'll just log it
    console.log('Theme applied:', theme);

    // You could add a class to the body or html element
    document.documentElement.setAttribute('data-theme', theme);
}

// Apply accent color
function applyAccentColor(color) {
    // For demo purposes, we'll change a few elements to show the effect
    document.documentElement.style.setProperty('--accent-color', color);

    // In a real application, you would update a CSS variable
    console.log('Accent color applied:', color);
}

// Apply font size
function applyFontSize(size) {
    // This would scale text throughout the application
    console.log('Font size applied:', size + '%');
    document.documentElement.style.fontSize = (parseInt(size) / 100) + 'rem';
}

// Export user data
function exportData() {
    // Get all data from localStorage
    const data = {
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
        lists: JSON.parse(localStorage.getItem('custom-lists') || '[]'),
        settings: {
            theme: localStorage.getItem('app-theme'),
            accentColor: localStorage.getItem('accent-color'),
            fontSize: localStorage.getItem('font-size'),
            notifications: localStorage.getItem('enable-notifications'),
            soundAlerts: localStorage.getItem('sound-alerts'),
            reminderTime: localStorage.getItem('reminder-time'),
            emailNotifications: localStorage.getItem('email-notifications'),
            defaultView: localStorage.getItem('default-view'),
            defaultSort: localStorage.getItem('default-sort'),
            confirmDelete: localStorage.getItem('confirm-delete'),
            cloudSync: localStorage.getItem('cloud-sync')
        }
    };

    // Convert to JSON string
    const jsonStr = JSON.stringify(data, null, 2);

    // Create a download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', 'task-manager-backup.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    // Trigger download
    element.click();

    // Clean up
    document.body.removeChild(element);
}
// Settings Page JavaScript
document.addEventListener("DOMContentLoaded", function() {
    // Initialize settings
    loadSavedSettings();
    setupEventListeners();

    // Set initial active section
    const activeSection = document.querySelector('.settings-nav-item.active');
    if (activeSection) {
        const sectionId = activeSection.getAttribute('href').substring(1);
        showSection(sectionId);
    } else {
        showSection('calendar-integration-section');
    }

    // Check for existing calendar connections
    checkCalendarConnections();
});

// Load saved settings from localStorage
function loadSavedSettings() {
    // Theme
    const savedTheme = localStorage.getItem("app-theme") || "light";
    document.getElementById("theme-selector").value = savedTheme;
    applyTheme(savedTheme);

    // Accent Color
    const savedAccentColor = localStorage.getItem("accent-color") || "#1e3a8a";
    setActiveColorOption(savedAccentColor);
    applyAccentColor(savedAccentColor);

    // Font Size
    const savedFontSize = localStorage.getItem("font-size") || "100";
    document.getElementById("font-size-slider").value = savedFontSize;
    document.querySelector(".range-value").textContent = savedFontSize + "%";
    applyFontSize(savedFontSize);

    // Notifications
    const notificationsEnabled = localStorage.getItem("enable-notifications") !== "false";
    document.getElementById("enable-notifications").checked = notificationsEnabled;

    // Sound Alerts
    const soundAlertsEnabled = localStorage.getItem("sound-alerts") === "true";
    document.getElementById("sound-alerts").checked = soundAlertsEnabled;

    // Reminder Time
    const reminderTime = localStorage.getItem("reminder-time") || "30";
    document.getElementById("reminder-time").value = reminderTime;

    // Email Notifications
    const emailNotificationsEnabled = localStorage.getItem("email-notifications") === "true";
    document.getElementById("email-notifications").checked = emailNotificationsEnabled;

    // Default View
    const defaultView = localStorage.getItem("default-view") || "today";
    document.getElementById("default-view").value = defaultView;

    // Default Sort
    const defaultSort = localStorage.getItem("default-sort") || "date";
    document.getElementById("default-sort").value = defaultSort;

    // Confirm Delete
    const confirmDelete = localStorage.getItem("confirm-delete") !== "false";
    document.getElementById("confirm-delete").checked = confirmDelete;

    // Cloud Sync
    const cloudSyncEnabled = localStorage.getItem("cloud-sync") === "true";
    document.getElementById("cloud-sync").checked = cloudSyncEnabled;

    // Calendar Integration Settings
    const googleCalendarSync = localStorage.getItem("google-calendar-sync") === "true";
    document.getElementById("google-calendar-sync").checked = googleCalendarSync;

    const outlookCalendarSync = localStorage.getItem("outlook-calendar-sync") === "true";
    document.getElementById("outlook-calendar-sync").checked = outlookCalendarSync;

    const calendarSyncFrequency = localStorage.getItem("calendar-sync-frequency") || "30";
    document.getElementById("calendar-sync-frequency").value = calendarSyncFrequency;

    const twoWaySync = localStorage.getItem("two-way-sync") !== "false";
    document.getElementById("two-way-sync").checked = twoWaySync;
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation between sections
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            // Get the section ID from the href attribute
            const sectionId = this.getAttribute('href').substring(1);

            // Show the selected section
            showSection(sectionId);

            // Update active nav item
            document.querySelectorAll('.settings-nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Theme selector
    document.getElementById('theme-selector').addEventListener('change', function() {
        const theme = this.value;
        applyTheme(theme);
        localStorage.setItem("app-theme", theme);
    });

    // Accent color
    document.querySelectorAll('.color-option').forEach(colorOption => {
        colorOption.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            setActiveColorOption(color);
            applyAccentColor(color);
            localStorage.setItem("accent-color", color);
        });
    });

    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    const rangeValue = document.querySelector('.range-value');

    fontSizeSlider.addEventListener('input', function() {
        const fontSize = this.value;
        rangeValue.textContent = fontSize + '%';
        applyFontSize(fontSize);
        localStorage.setItem("font-size", fontSize);
    });

    // Toggle switches
    setupToggleSwitch('enable-notifications');
    setupToggleSwitch('sound-alerts');
    setupToggleSwitch('email-notifications');
    setupToggleSwitch('confirm-delete');
    setupToggleSwitch('cloud-sync');
    setupToggleSwitch('google-calendar-sync');
    setupToggleSwitch('outlook-calendar-sync');
    setupToggleSwitch('two-way-sync');

    // Select dropdowns
    setupSelectChange('reminder-time');
    setupSelectChange('default-view');
    setupSelectChange('default-sort');
    setupSelectChange('calendar-sync-frequency');

    // Buttons
    document.querySelector('.edit-profile-btn').addEventListener('click', function() {
        alert('Edit Profile functionality would be implemented here.');
    });

    document.querySelector('.change-password-btn').addEventListener('click', function() {
        alert('Change Password functionality would be implemented here.');
    });

    document.querySelector('.export-btn').addEventListener('click', function() {
        exportData();
    });

    document.querySelector('.import-btn').addEventListener('click', function() {
        alert('Import functionality would be implemented here. Would normally open a file dialog.');
    });

    // Calendar integration specific listeners
    setupCalendarIntegrationListeners();
}

// Setup calendar integration specific event listeners
function setupCalendarIntegrationListeners() {
    // Google Calendar
    document.getElementById('google-connect-btn').addEventListener('click', function() {
        showGoogleAuthModal();
    });

    document.getElementById('google-calendar-sync').addEventListener('change', function() {
        toggleGoogleCalendarSync(this.checked);
    });

    // Outlook Calendar
    document.getElementById('outlook-connect-btn').addEventListener('click', function() {
        showOutlookAuthModal();
    });

    document.getElementById('outlook-calendar-sync').addEventListener('change', function() {
        toggleOutlookCalendarSync(this.checked);
    });

    // Sync Now button
    document.getElementById('sync-now-btn').addEventListener('click', function() {
        syncCalendarsNow();
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Google auth flow
    document.getElementById('google-auth-button').addEventListener('click', function() {
        initiateGoogleAuth();
    });

    document.getElementById('google-submit-code').addEventListener('click', function() {
        submitGoogleAuthCode();
    });

    // Outlook auth flow
    document.getElementById('outlook-auth-button').addEventListener('click', function() {
        initiateOutlookAuth();
    });

    document.getElementById('outlook-submit-code').addEventListener('click', function() {
        submitOutlookAuthCode();
    });
}

// Google Calendar Integration Functions
function showGoogleAuthModal() {
    document.getElementById('google-auth-modal').style.display = 'flex';
}

function initiateGoogleAuth() {
    // Real Google OAuth 2.0 flow
    const clientId = '233840126993-uned9hu7bedgpnursvggctc8c0qvussl.apps.googleusercontent.com';

    // Replace this with your actual registered redirect URI from Google Cloud Console
    const redirectUri = encodeURIComponent('http://localhost:63342/todo.css/Settings.html');

    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=${accessType}&prompt=${prompt}`;

    // Open the OAuth consent window
    window.open(authUrl, '_blank', 'width=500,height=600');
}

function submitGoogleAuthCode() {
    const authCode = document.getElementById('google-auth-code').value.trim();

    if (!authCode) {
        alert("Please enter an authentication code");
        return;
    }

    // In a real implementation, you would exchange this code for an access token
    // For demo purposes, we'll simulate a successful auth

    // Simulate API call delay
    document.getElementById('google-submit-code').textContent = "Processing...";

    setTimeout(() => {
        // Save the "token" (for demo purposes)
        localStorage.setItem('google-auth-token', 'simulated_token_' + Date.now());
        localStorage.setItem('google-calendar-sync', 'true');
        document.getElementById('google-calendar-sync').checked = true;

        // Update UI
        updateGoogleConnectionStatus(true);

        // Close the modal
        document.getElementById('google-auth-modal').style.display = 'none';

        // Fetch calendars
        fetchGoogleCalendars();

        // Reset button text
        document.getElementById('google-submit-code').textContent = "Submit Code";

        // Show success message
        alert("Successfully connected to Google Calendar!");
    }, 1500);
}

function toggleGoogleCalendarSync(enabled) {
    if (enabled) {
        // Check if we have a token
        const hasToken = localStorage.getItem('google-auth-token');

        if (!hasToken) {
            // No token, need to authenticate
            showGoogleAuthModal();
            return;
        }

        // We have a token, enable sync
        localStorage.setItem('google-calendar-sync', 'true');
        updateGoogleConnectionStatus(true);
        fetchGoogleCalendars();
    } else {
        // Disable sync
        localStorage.setItem('google-calendar-sync', 'false');
        updateGoogleConnectionStatus(false);
        document.getElementById('google-calendars-container').style.display = 'none';
    }
}

function updateGoogleConnectionStatus(connected) {
    const connectBtn = document.getElementById('google-connect-btn');

    if (connected) {
        connectBtn.textContent = 'Connected';
        connectBtn.classList.add('connected');
        connectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    } else {
        connectBtn.textContent = 'Connect';
        connectBtn.classList.remove('connected');
        connectBtn.innerHTML = '<i class="fab fa-google"></i> Connect';
    }
}

function fetchGoogleCalendars() {
    // In a real implementation, you would make an API call to Google
    // For demo purposes, we'll simulate getting a list of calendars

    // Show the calendars container
    const calendarsContainer = document.getElementById('google-calendars-container');
    calendarsContainer.style.display = 'block';

    // Get the list container
    const calendarList = document.getElementById('google-calendar-list');
    calendarList.innerHTML = '<div class="loading-calendars">Loading calendars...</div>';

    // Simulate API call delay
    setTimeout(() => {
        // Demo calendar data
        const demoCalendars = [
            { id: 'primary', name: 'Main Calendar', color: '#4285F4', selected: true },
            { id: 'work', name: 'Work', color: '#DB4437', selected: true },
            { id: 'family', name: 'Family', color: '#0F9D58', selected: false },
            { id: 'birthdays', name: 'Birthdays', color: '#F4B400', selected: false }
        ];

        // Clear loading message
        calendarList.innerHTML = '';

        // Create calendar items
        demoCalendars.forEach(calendar => {
            const calendarItem = document.createElement('div');
            calendarItem.className = 'calendar-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'calendar-checkbox';
            checkbox.checked = calendar.selected;
            checkbox.dataset.calendarId = calendar.id;
            checkbox.dataset.calendarService = 'google';

            const colorDot = document.createElement('span');
            colorDot.className = 'calendar-color';
            colorDot.style.backgroundColor = calendar.color;

            const calendarName = document.createElement('span');
            calendarName.className = 'calendar-name';
            calendarName.textContent = calendar.name;

            calendarItem.appendChild(checkbox);
            calendarItem.appendChild(colorDot);
            calendarItem.appendChild(calendarName);

            calendarList.appendChild(calendarItem);

            // Add event listener to save selection changes
            checkbox.addEventListener('change', function() {
                saveCalendarSelection('google', calendar.id, this.checked);
            });
        });

        // Save initial calendar selections
        saveAllCalendarSelections();
    }, 1000);
}

// Outlook Calendar Integration Functions
function showOutlookAuthModal() {
    document.getElementById('outlook-auth-modal').style.display = 'flex';
}

function initiateOutlookAuth() {
    // In a real implementation, this would redirect to Microsoft's OAuth page
    // For demo purposes, we'll simulate the auth flow
    const authUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=Calendars.Read&response_type=code";

    // In a real app, you would redirect to this URL:
    // window.open(authUrl, '_blank');

    // For demo purposes, we'll simulate the process
    alert("In a real implementation, this would open Microsoft's authentication page. For this demo, we'll simulate the process.");

    // Show instructions for the auth code
    document.getElementById('outlook-auth-code').focus();
}

function submitOutlookAuthCode() {
    const authCode = document.getElementById('outlook-auth-code').value.trim();

    if (!authCode) {
        alert("Please enter an authentication code");
        return;
    }

    // In a real implementation, you would exchange this code for an access token
    // For demo purposes, we'll simulate a successful auth

    // Simulate API call delay
    document.getElementById('outlook-submit-code').textContent = "Processing...";

    setTimeout(() => {
        // Save the "token" (for demo purposes)
        localStorage.setItem('outlook-auth-token', 'simulated_token_' + Date.now());
        localStorage.setItem('outlook-calendar-sync', 'true');
        document.getElementById('outlook-calendar-sync').checked = true;

        // Update UI
        updateOutlookConnectionStatus(true);

        // Close the modal
        document.getElementById('outlook-auth-modal').style.display = 'none';

        // Fetch calendars
        fetchOutlookCalendars();

        // Reset button text
        document.getElementById('outlook-submit-code').textContent = "Submit Code";

        // Show success message
        alert("Successfully connected to Outlook Calendar!");
    }, 1500);
}

function toggleOutlookCalendarSync(enabled) {
    if (enabled) {
        // Check if we have a token
        const hasToken = localStorage.getItem('outlook-auth-token');

        if (!hasToken) {
            // No token, need to authenticate
            showOutlookAuthModal();
            return;
        }

        // We have a token, enable sync
        localStorage.setItem('outlook-calendar-sync', 'true');
        updateOutlookConnectionStatus(true);
        fetchOutlookCalendars();
    } else {
        // Disable sync
        localStorage.setItem('outlook-calendar-sync', 'false');
        updateOutlookConnectionStatus(false);
        document.getElementById('outlook-calendars-container').style.display = 'none';
    }
}

function updateOutlookConnectionStatus(connected) {
    const connectBtn = document.getElementById('outlook-connect-btn');

    if (connected) {
        connectBtn.textContent = 'Connected';
        connectBtn.classList.add('connected');
        connectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    } else {
        connectBtn.textContent = 'Connect';
        connectBtn.classList.remove('connected');
        connectBtn.innerHTML = '<i class="fab fa-microsoft"></i> Connect';
    }
}

function fetchOutlookCalendars() {
    // In a real implementation, you would make an API call to Microsoft Graph
    // For demo purposes, we'll simulate getting a list of calendars

    // Show the calendars container
    const calendarsContainer = document.getElementById('outlook-calendars-container');
    calendarsContainer.style.display = 'block';

    // Get the list container
    const calendarList = document.getElementById('outlook-calendar-list');
    calendarList.innerHTML = '<div class="loading-calendars">Loading calendars...</div>';

    // Simulate API call delay
    setTimeout(() => {
        // Demo calendar data
        const demoCalendars = [
            { id: 'primary', name: 'Calendar', color: '#0078D4', selected: true },
            { id: 'work', name: 'Work Schedule', color: '#107C10', selected: true },
            { id: 'personal', name: 'Personal', color: '#A4262C', selected: false },
            { id: 'holidays', name: 'Holidays', color: '#5C2E91', selected: false }
        ];

        // Clear loading message
        calendarList.innerHTML = '';

        // Create calendar items
        demoCalendars.forEach(calendar => {
            const calendarItem = document.createElement('div');
            calendarItem.className = 'calendar-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'calendar-checkbox';
            checkbox.checked = calendar.selected;
            checkbox.dataset.calendarId = calendar.id;
            checkbox.dataset.calendarService = 'outlook';

            const colorDot = document.createElement('span');
            colorDot.className = 'calendar-color';
            colorDot.style.backgroundColor = calendar.color;

            const calendarName = document.createElement('span');
            calendarName.className = 'calendar-name';
            calendarName.textContent = calendar.name;

            calendarItem.appendChild(checkbox);
            calendarItem.appendChild(colorDot);
            calendarItem.appendChild(calendarName);

            calendarList.appendChild(calendarItem);

            // Add event listener to save selection changes
            checkbox.addEventListener('change', function() {
                saveCalendarSelection('outlook', calendar.id, this.checked);
            });
        });

        // Save initial calendar selections
        saveAllCalendarSelections();
    }, 1000);
}

// General Calendar Integration Functions
function checkCalendarConnections() {
    // Check Google connection
    const googleToken = localStorage.getItem('google-auth-token');
    const googleSyncEnabled = localStorage.getItem('google-calendar-sync') === 'true';

    if (googleToken && googleSyncEnabled) {
        updateGoogleConnectionStatus(true);
        fetchGoogleCalendars();
    } else {
        updateGoogleConnectionStatus(false);
    }

    // Check Outlook connection
    const outlookToken = localStorage.getItem('outlook-auth-token');
    const outlookSyncEnabled = localStorage.getItem('outlook-calendar-sync') === 'true';

    if (outlookToken && outlookSyncEnabled) {
        updateOutlookConnectionStatus(true);
        fetchOutlookCalendars();
    } else {
        updateOutlookConnectionStatus(false);
    }
}

function saveCalendarSelection(service, calendarId, selected) {
    // In a real implementation, you would save this preference to your backend
    // For demo purposes, we'll store it in localStorage

    // Get existing selections or create new object
    const selections = JSON.parse(localStorage.getItem(`${service}-calendar-selections`) || '{}');

    // Update selection
    selections[calendarId] = selected;

    // Save back to localStorage
    localStorage.setItem(`${service}-calendar-selections`, JSON.stringify(selections));

    // Simulate syncing if selected
    if (selected) {
        console.log(`Calendar ${calendarId} from ${service} will be synced.`);
    } else {
        console.log(`Calendar ${calendarId} from ${service} will not be synced.`);
    }
}

function saveAllCalendarSelections() {
    // Save all currently visible calendar selections
    document.querySelectorAll('.calendar-checkbox').forEach(checkbox => {
        const service = checkbox.dataset.calendarService;
        const calendarId = checkbox.dataset.calendarId;
        const selected = checkbox.checked;

        saveCalendarSelection(service, calendarId, selected);
    });
}

function showGoogleAuthModal() {
    console.log('Attempting to show Google auth modal');
    const modal = document.getElementById('google-auth-modal');
    console.log('Modal element:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Set modal display to flex');
    } else {
        console.error('Google auth modal element not found!');
    }
}

function showOutlookAuthModal() {
    console.log('Attempting to show Outlook auth modal');
    const modal = document.getElementById('outlook-auth-modal');
    console.log('Modal element:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Set modal display to flex');
    } else {
        console.error('Outlook auth modal element not found!');
    }
}


function syncCalendarsNow() {
    // Show loading state
    const syncButton = document.getElementById('sync-now-btn');
    const originalText = syncButton.innerHTML;
    syncButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
    syncButton.disabled = true;

    // In a real implementation, you would make API calls to fetch updated calendar data
    // For demo purposes, we'll simulate the sync process

    setTimeout(() => {
        // Check which services are enabled
        const googleSyncEnabled = localStorage.getItem('google-calendar-sync') === 'true';
        const outlookSyncEnabled = localStorage.getItem('outlook-calendar-sync') === 'true';

        let syncMessage = "Calendar sync completed: ";

        if (googleSyncEnabled && outlookSyncEnabled) {
            syncMessage += "Google Calendar and Outlook Calendar synchronized.";
        } else if (googleSyncEnabled) {
            syncMessage += "Google Calendar synchronized.";
        } else if (outlookSyncEnabled) {
            syncMessage += "Outlook Calendar synchronized.";
        } else {
            syncMessage = "No calendars are enabled for synchronization.";
        }

        // Reset button
        syncButton.innerHTML = originalText;
        syncButton.disabled = false;

        // Show success message
        alert(syncMessage);

        // Log to console (in a real app, this would update the calendar view)
        console.log("Calendars synchronized at", new Date().toLocaleTimeString());
    }, 2000);
}
