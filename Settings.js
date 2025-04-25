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

