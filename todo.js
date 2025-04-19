// Global state
let tasks = [];
let lists = [];

// Wait for DOM to be fully loaded before executing any code
document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    // Task creation elements
    const taskCreationBox = document.querySelector(".task-creation-box");
    const taskTitle = document.getElementById("task-title");
    const taskDescription = document.getElementById("task-description");
    const dueDate = document.getElementById("due-date");
    const priority = document.getElementById("priority");
    const reminder = document.getElementById("reminder");
    const listSelect = document.getElementById("list");
    const addTaskButton = document.getElementById("add-task");
    const cancelTaskButton = document.getElementById("cancel-task");
    const taskList = document.getElementById("task-list");

    // List management elements
    const listsContainer = document.getElementById("lists-container");
    const addListBtn = document.getElementById("add-list-btn");

    // Add sorting container to the DOM
    const taskListContainer = document.querySelector(".task-list-container");
    const taskListHeading = taskListContainer.querySelector("h2");
    const sortingContainer = document.createElement("div");
    sortingContainer.classList.add("sorting-container");
    taskListHeading.after(sortingContainer);

    // Create sort button with icon
    const sortButton = document.createElement("button");
    sortButton.classList.add("sort-button");
    sortButton.innerHTML = '<img src="sort.png" alt="Sort"> Sort';
    sortingContainer.appendChild(sortButton);

    // Create sort menu
    const sortMenu = document.createElement("div");
    sortMenu.classList.add("sort-menu");
    sortMenu.innerHTML = `
        <div class="sort-option" data-sort="date">Sort by date</div>
        <div class="sort-option" data-sort="priority">Sort by priority</div>
        <div class="sort-option" data-sort="list">Sort by list</div>
    `;
    document.body.appendChild(sortMenu);

    // Initialize the application
    initApp();

    // --------------------------
    // Application Initialization
    // --------------------------
    function initApp() {
        // Load saved data from localStorage
        loadLists();
        loadTasks();

        // Set up event listeners
        setupTaskCreationEvents();
        setupSortingEvents();
        setupListManagementEvents();
        setupNavigationEvents();
    }

    // ----------------------
    // Event Setup Functions
    // ----------------------
    function setupTaskCreationEvents() {
        // Task creation box toggling
        const taskCreationHeader = taskCreationBox.querySelector("h3");

        // Click on header to toggle box
        taskCreationHeader.addEventListener("click", function() {
            taskCreationBox.classList.toggle("expanded");
            if (taskCreationBox.classList.contains("expanded")) {
                taskTitle.focus();
            }
        });

        // Focus on title expands the box
        taskTitle.addEventListener("focus", function() {
            taskCreationBox.classList.add("expanded");
        });

        // Clicking in task box keeps it expanded
        taskCreationBox.addEventListener("click", function(e) {
            if (e.target !== taskCreationHeader) {
                taskCreationBox.classList.add("expanded");
            }
        });

        // Click outside collapses box if title is empty
        document.addEventListener("click", function(e) {
            if (!taskCreationBox.contains(e.target) && taskTitle.value.trim() === '') {
                taskCreationBox.classList.remove("expanded");
            }
        });

        // Add task button click handler
        addTaskButton.addEventListener("click", addTask);

        // Cancel task button click handler
        cancelTaskButton.addEventListener("click", function() {
            // Reset form
            clearTaskForm();
            // Collapse box
            taskCreationBox.classList.remove("expanded");
        });

        // Auto-expand textareas when typing
        taskTitle.addEventListener('input', () => autoExpand(taskTitle));
        taskDescription.addEventListener('input', () => autoExpand(taskDescription));

        // Allow pressing Enter in task title to add task or expand box
        taskTitle.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (taskCreationBox.classList.contains("expanded")) {
                    addTask();
                } else {
                    taskCreationBox.classList.add("expanded");
                }
            }
        });

        // Format date inputs on change (just for feedback)
        dueDate.addEventListener('change', function() {
            const dateValue = this.value;
            if (dateValue) {
                const formattedDate = formatDate(dateValue);
                console.log(`Date will be saved as: ${formattedDate}`);
            }
        });

        reminder.addEventListener('change', function() {
            const dateValue = this.value;
            if (dateValue) {
                const formattedDate = formatDate(dateValue);
                console.log(`Reminder will be saved as: ${formattedDate}`);
            }
        });
    }

    function setupSortingEvents() {
        // Toggle sort menu visibility when sort button is clicked
        sortButton.addEventListener("click", function(e) {
            e.stopPropagation();

            // Position the menu below the sort button
            const rect = sortButton.getBoundingClientRect();
            sortMenu.style.top = `${rect.bottom + window.scrollY}px`;
            sortMenu.style.left = `${rect.left + window.scrollX}px`;

            sortMenu.classList.toggle("visible");
        });

        // Hide sort menu when clicking outside
        document.addEventListener("click", function() {
            sortMenu.classList.remove("visible");
        });

        // Prevent menu from closing when clicking inside it
        sortMenu.addEventListener("click", function(e) {
            e.stopPropagation();
        });

        // Sorting functionality
        document.querySelectorAll(".sort-option").forEach(option => {
            option.addEventListener("click", function() {
                const sortType = this.dataset.sort;

                // Mark active sort option
                document.querySelectorAll(".sort-option").forEach(opt => {
                    opt.classList.remove("active");
                });
                this.classList.add("active");

                // Sort tasks
                sortTasks(sortType);

                // Hide menu after selection
                sortMenu.classList.remove("visible");
            });
        });
    }

    function setupListManagementEvents() {
        // Add a new list
        addListBtn.addEventListener("click", addNewList);
    }

    function setupNavigationEvents() {
        // Show all tasks when "Today" is clicked
        document.querySelector(".menu a:nth-child(3)").addEventListener("click", function() {
            const taskItems = document.querySelectorAll(".task-item");
            taskItems.forEach(taskItem => {
                taskItem.style.display = "flex";
            });
            document.querySelector(".today-title").textContent = "Today";
        });
    }

    // ----------------------
    // Task Management
    // ----------------------
    function addTask() {
        const titleValue = taskTitle.value.trim();

        if (titleValue) {
            const newTask = {
                id: Date.now(), // Unique ID using timestamp
                title: titleValue,
                description: taskDescription.value.trim(),
                date: dueDate.value || null,
                reminder: reminder.value || null,
                priority: priority.value !== 'priority' ? priority.value : 'medium',
                list: listSelect.value !== 'default' ? listSelect.value : 'N/A',
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Add task to global array
            tasks.push(newTask);

            // Create task element
            const taskItem = createTaskElement(newTask);
            taskList.appendChild(taskItem);

            // Save tasks to localStorage
            saveTasks();

            // Reset form
            clearTaskForm();

            // Collapse creation box
            taskCreationBox.classList.remove("expanded");
        } else {
            alert("Please enter a task title");
        }
    }

    function clearTaskForm() {
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';
        priority.value = 'priority';
        listSelect.value = 'default';

        // Reset heights
        taskTitle.style.height = 'auto';
        taskDescription.style.height = 'auto';
    }

    function createTaskElement(task) {
        const taskItem = document.createElement("li");

        // Set left border color based on priority
        const priorityColors = {
            high: '#ff5555',
            medium: '#ffa500',
            low: '#1e3a8a',
            'N/A': '#1e3a8a'
        };
        taskItem.style.borderLeftColor = priorityColors[task.priority] || '#1e3a8a';

        // Add opacity if task is completed
        if (task.completed) {
            taskItem.style.opacity = '0.6';
        }

        // Task item inner structure
        const taskItemInner = document.createElement("div");
        taskItemInner.className = "task-item";

        // Task completion ring
        const taskRing = document.createElement("div");
        taskRing.className = task.completed ? "task-ring completed" : "task-ring";
        taskRing.addEventListener("click", function() {
            toggleTaskCompletion(task, taskRing, taskItem);
        });

        // Task content container
        const taskContent = document.createElement("div");
        taskContent.style.width = "100%";

        // Format dates for display
        const formattedDueDate = formatDate(task.date);
        const formattedReminderDate = formatDate(task.reminder);

        // Title with inline editing
        const titleDiv = createEditableField('title', task.title, 'task-title', task);

        // Description with inline editing
        const descDiv = createEditableField('description', task.description, 'task-desc', task);

        // Metadata container
        const metadata = document.createElement("div");
        metadata.classList.add("task-metadata");

        // Date with inline editing
        const dateDiv = createEditableField('date', formattedDueDate, '', task, 'Date: ');

        // Reminder with inline editing
        const reminderDiv = createEditableField('reminder', formattedReminderDate, '', task, 'Reminder: ');

        // Priority with inline editing (select dropdown)
        const priorityDiv = createEditableSelectField('priority', task.priority, task, ['low', 'medium', 'high'], 'Priority: ');

        // List with inline editing (select dropdown)
        const listDiv = createEditableSelectField('list', task.list, task, ['N/A', ...lists], 'List: ');

        // Store task ID in the DOM element for reference
        taskItem.dataset.id = task.id;

// Create new subtask button
        const editButton = document.createElement("button");
        editButton.className = "subtask-button";
        editButton.innerHTML = '<i class="fas fa-plus"></i> Add Subtask'; // Changed to plus icon
        editButton.addEventListener("click", function(e) {
            e.stopPropagation(); // Prevent event bubbling
            // Add your functionality here later
            alert("Add Subtask clicked for task: " + task.title);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "delete-task";
        deleteButton.addEventListener("click", function() {
            deleteTask(task.id, taskItem);
        });

        // Assemble the task item
        metadata.append(dateDiv, reminderDiv, priorityDiv, listDiv, editButton);
        taskContent.append(titleDiv, descDiv, metadata);
        taskItemInner.append(taskRing, taskContent);
        taskItem.append(taskItemInner, deleteButton);

        return taskItem;
    }

    function createEditableField(fieldName, value, className, task, prefix = '') {
        const containerDiv = document.createElement("div");
        if (className) containerDiv.classList.add(className);

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        // Display text element
        const displayText = document.createElement("div");
        displayText.className = "display-text";
        displayText.textContent = prefix + (value || 'N/A');

        // Edit element (input or textarea)
        const isTextArea = fieldName === 'description' || (value && value.length > 30);
        const editInput = isTextArea ?
            document.createElement("textarea") :
            document.createElement("input");

        editInput.className = "edit-input";

        // For date fields, set the type to date
        if (fieldName === 'date' || fieldName === 'reminder') {
            editInput.type = "date";
            // Convert formatted date back to yyyy-mm-dd for input
            editInput.value = convertToInputDateFormat(value);
        } else {
            editInput.value = value || '';
        }

        editInput.style.display = "none";

        // Set up editing functionality
        displayText.addEventListener("dblclick", function() {
            // Enter edit mode
            displayText.style.display = "none";
            editInput.style.display = "block";

            if (isTextArea) {
                autoExpand(editInput);
                editInput.addEventListener('input', () => autoExpand(editInput));
            }

            editInput.focus();
        });

        // Handle saving on blur or Enter key
        editInput.addEventListener("blur", function() {
            saveFieldEdit(fieldName, this.value, task, displayText, prefix);
        });

        editInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey && !isTextArea) {
                e.preventDefault();
                this.blur(); // Trigger blur to save
            } else if (e.key === "Escape") {
                // Cancel edit and restore original value
                displayText.style.display = "block";
                editInput.style.display = "none";
                editInput.value = task[fieldName] || '';
            }
        });

        // Assemble the editable field
        editableContent.append(displayText, editInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }

    function createEditableSelectField(fieldName, value, task, options, prefix = '') {
        const containerDiv = document.createElement("div");

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        // Display text element
        const displayText = document.createElement("div");
        displayText.className = "display-text";
        displayText.textContent = prefix + (value || 'N/A');

        // Create select element
        const selectInput = document.createElement("select");
        selectInput.className = "edit-input";
        selectInput.style.display = "none";

        // Add options
        options.forEach(optionValue => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            if (value === optionValue) {
                option.selected = true;
            }
            selectInput.appendChild(option);
        });

        // Set up editing functionality
        displayText.addEventListener("dblclick", function() {
            // Enter edit mode
            displayText.style.display = "none";
            selectInput.style.display = "block";
            selectInput.focus();
        });

        // Handle saving on blur or Enter key
        selectInput.addEventListener("blur", function() {
            const selectedValue = this.options[this.selectedIndex].value;
            saveFieldEdit(fieldName, selectedValue, task, displayText, prefix);
        });

        selectInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.blur(); // Trigger blur to save
            } else if (e.key === "Escape") {
                // Cancel edit
                displayText.style.display = "block";
                selectInput.style.display = "none";
            }
        });

        // Assemble the editable field
        editableContent.append(displayText, selectInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }

    function saveFieldEdit(fieldName, value, task, displayElement, prefix = '') {
        // Get the original value
        const originalValue = task[fieldName];

        // Clean up value
        if (typeof value === 'string') {
            value = value.trim();
        }

        // Handle empty values
        if (value === '' || value === null || value === undefined) {
            if (fieldName === 'title') {
                value = 'Untitled'; // Don't allow empty titles
            } else {
                value = null;
            }
        }

        // Update task object
        task[fieldName] = value;

        // Update display
        displayElement.textContent = prefix + (value || 'N/A');
        displayElement.style.display = "block";

        // Hide the edit input
        const editInput = displayElement.nextElementSibling;
        editInput.style.display = "none";

        // Only save if value actually changed
        if (originalValue !== value) {
            // Find task in global array and update it
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex][fieldName] = value;
                saveTasks();
            }
        }
    }

    function toggleTaskCompletion(task, taskRingElement, taskItemElement) {
        task.completed = !task.completed;

        // Update UI
        if (task.completed) {
            taskRingElement.classList.add("completed");
            taskItemElement.style.opacity = "0.6";
        } else {
            taskRingElement.classList.remove("completed");
            taskItemElement.style.opacity = "1";
        }

        // Update task in global array
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = task.completed;
            saveTasks();
        }
    }

    function deleteTask(taskId, taskElement) {
        if (confirm("Are you sure you want to delete this task?")) {
            // Remove from DOM
            taskElement.remove();

            // Remove from global array
            tasks = tasks.filter(task => task.id !== taskId);

            // Save changes
            saveTasks();
        }
    }

    function sortTasks(sortType) {
        const taskElements = Array.from(taskList.querySelectorAll("li"));

        taskElements.sort((a, b) => {
            if (sortType === "date") {
                const dateA = a.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");
                const dateB = b.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");

                // Handle "N/A" values
                if (dateA === "N/A" && dateB === "N/A") return 0;
                if (dateA === "N/A") return 1;
                if (dateB === "N/A") return -1;

                // Parse dates properly
                return parseDateString(dateA) - parseDateString(dateB);

            } else if (sortType === "priority") {
                const priorityA = a.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");
                const priorityB = b.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");

                // Define priority order
                const priorityOrder = { "high": 1, "medium": 2, "low": 3, "N/A": 4 };

                return priorityOrder[priorityA] - priorityOrder[priorityB];

            } else if (sortType === "list") {
                const listA = a.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");
                const listB = b.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

                // Alphabetical sort
                return listA.localeCompare(listB);
            }

            return 0;
        });

        // Reorder the DOM elements
        taskElements.forEach(task => {
            taskList.appendChild(task);
        });
    }

    // ----------------------
    // List Management
    // ----------------------
    function addNewList() {
        const newListName = prompt("Enter a name for the new list:");

        if (newListName && newListName.trim()) {
            // Check if list already exists
            if (lists.includes(newListName.trim())) {
                alert("A list with this name already exists");
                return;
            }

            // Add to global array
            lists.push(newListName.trim());

            // Save and update UI
            saveLists();
            renderLists();
            updateListDropdown();
        }
    }

    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");

            // List name (clickable)
            const listName_el = document.createElement("span");
            listName_el.className = "list-name";
            listName_el.dataset.index = index;
            listName_el.textContent = listName;
            listName_el.addEventListener('click', function() {
                filterTasksByList(listName);
            });

            // List actions (edit, delete)
            const listActions = document.createElement("div");
            listActions.className = "list-actions";

// Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "list-edit-btn";
            editBtn.dataset.index = index;
            editBtn.textContent = "Edit";

// Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "list-delete-btn";
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = "Delete";

            // Assemble list item
            listActions.append(editBtn, deleteBtn);
            listItem.append(listName_el, listActions);
            listsContainer.appendChild(listItem);
        });
    }

    function editList(index, listItem) {
        const listNameEl = listItem.querySelector('.list-name');
        const currentName = lists[index];

        // Create edit input
        const editInput = document.createElement("input");
        editInput.className = "list-edit-input";
        editInput.value = currentName;

        // Replace list name with input
        listNameEl.style.display = 'none';
        listItem.insertBefore(editInput, listNameEl);
        editInput.focus();

        // Setup save on enter or blur
        editInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveListEdit(index, editInput.value, listItem, listNameEl, editInput);
            } else if (e.key === 'Escape') {
                cancelListEdit(listItem, listNameEl, editInput);
            }
        });

        editInput.addEventListener('blur', function() {
            saveListEdit(index, editInput.value, listItem, listNameEl, editInput);
        });
    }

    function saveListEdit(index, newName, listItem, listNameEl, editInput) {
        newName = newName.trim();

        if (newName && newName !== lists[index]) {
            // Check if the new name already exists
            if (lists.includes(newName)) {
                alert("A list with this name already exists");
                cancelListEdit(listItem, listNameEl, editInput);
                return;
            }

            const oldName = lists[index];
            lists[index] = newName;

            // Update tasks with this list name
            updateTasksWithNewListName(oldName, newName);

            // Save and update UI
            saveLists();
            updateListDropdown();
        }

        // Restore display
        listNameEl.textContent = lists[index];
        listNameEl.style.display = '';
        editInput.remove();
    }

    function cancelListEdit(listItem, listNameEl, editInput) {
        listNameEl.style.display = '';
        editInput.remove();
    }

    function deleteList(index, listName) {
        // Prevent deleting default lists
        if (['Personal', 'Work', 'Shopping'].includes(listName)) {
            alert('Cannot delete default lists');
            return;
        }

        if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
            // Remove from global array
            lists.splice(index, 1);

            // Update tasks that were in this list
            updateTasksWithDeletedList(listName);

            // Save and update UI
            saveLists();
            renderLists();
            updateListDropdown();
        }
    }

    function updateTasksWithNewListName(oldName, newName) {
        let tasksUpdated = false;

        // Update in memory tasks
        tasks.forEach(task => {
            if (task.list === oldName) {
                task.list = newName;
                tasksUpdated = true;
            }
        });

        // Update task elements in the DOM
        document.querySelectorAll(".task-item").forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${oldName}`) {
                listDisplay.textContent = `List: ${newName}`;
            }
        });

        if (tasksUpdated) {
            saveTasks();
        }
    }

    function updateTasksWithDeletedList(deletedListName) {
        let tasksUpdated = false;

        // Update in memory tasks
        tasks.forEach(task => {
            if (task.list === deletedListName) {
                task.list = 'N/A';
                tasksUpdated = true;
            }
        });

        // Update task elements in the DOM
        document.querySelectorAll(".task-item").forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${deletedListName}`) {
                listDisplay.textContent = "List: N/A";
            }
        });

        if (tasksUpdated) {
            saveTasks();
        }
    }

    function updateListDropdown() {
        // Clear current options except the default one
        while (listSelect.options.length > 1) {
            listSelect.remove(1);
        }

        // Add list options
        lists.forEach(listName => {
            const option = document.createElement("option");
            option.value = listName;
            option.textContent = listName;
            listSelect.appendChild(option);
        });
    }

    function filterTasksByList(listName) {
        const taskItems = document.querySelectorAll(".task-item");

        taskItems.forEach(taskItem => {
            const parentLi = taskItem.closest('li');
            const taskList = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

            if (listName === taskList) {
                parentLi.style.display = "flex";
            } else {
                parentLi.style.display = "none";
            }
        });

        // Update the page title to show which list is being viewed
        document.querySelector(".today-title").textContent = listName;
    }

    // ----------------------
    // Persistence Functions
    // ----------------------
    function loadTasks() {
        const savedTasks = localStorage.getItem("tasks");

        tasks = savedTasks ? JSON.parse(savedTasks) : [];

        // Render tasks to DOM
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';

        // Sort tasks: completed at bottom, then by date, then by priority
        const sortedTasks = [...tasks].sort((a, b) => {
            // Completed tasks at bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Sort by date
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            } else if (a.date) {
                return -1;
            } else if (b.date) {
                return 1;
            }

            // Sort by priority
            const priorityOrder = { high: 0, medium: 1, low: 2, 'N/A': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Create task elements
        sortedTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }

    function loadLists() {
        const savedLists = localStorage.getItem("custom-lists");

        lists = savedLists ? JSON.parse(savedLists) : ["Personal", "Work", "Shopping"];

        // Update UI
        renderLists();
        updateListDropdown();
    }

    function saveLists() {
        localStorage.setItem("custom-lists", JSON.stringify(lists));
    }

    // ----------------------
    // Utility Functions
    // ----------------------
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        // Check if the date is already in dd/mm/yyyy format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        // Convert from yyyy-mm-dd to dd/mm/yyyy
        try {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } catch (e) {
            // If any error occurs, return the original string
        }

        return dateString;
    }

    function convertToInputDateFormat(dateString) {
        if (!dateString || dateString === 'N/A') return '';

        // If already in yyyy-mm-dd format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Convert from dd/mm/yyyy to yyyy-mm-dd
        try {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        } catch (e) {
            // If any error occurs, return empty string
        }

        return '';
    }

    function parseDateString(dateString) {
        // Handle special cases
        if (dateString === 'N/A') return Number.MAX_SAFE_INTEGER; // Put at the end

        // Parse dd/mm/yyyy format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(year, month - 1, day).getTime();
        }

        // Fallback to regular date parsing
        return new Date(dateString).getTime();
    }

    // Auto-expand textarea based on content
    window.autoExpand = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };
});