// Define lists globally so it can be accessed by all functions
window.lists = [];
// Global lists array
let lists = [];



document.addEventListener("DOMContentLoaded", function () {
    const addTaskButton = document.getElementById("add-task");
    const cancelTaskButton = document.getElementById("cancel-task");
    const taskList = document.getElementById("task-list");
    const taskTitle = document.getElementById("task-title");
    const taskDescription = document.getElementById("task-description");
    const dueDate = document.getElementById("due-date");
    const priority = document.getElementById("priority");
    const list = document.getElementById("list");
    const reminder = document.getElementById("reminder");

    // Add sorting container to the DOM
    const taskListContainer = document.querySelector(".task-list-container");
    const sortingContainer = document.createElement("div");
    sortingContainer.classList.add("sorting-container");

    // Insert sorting container after the h2 but before the task list
    const taskListHeading = taskListContainer.querySelector("h2");
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

    function sortTasks(sortType) {
        const tasks = Array.from(taskList.querySelectorAll("li"));

        tasks.sort((a, b) => {
            if (sortType === "date") {
                const dateA = a.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");
                const dateB = b.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");

                // Handle "N/A" values
                if (dateA === "N/A" && dateB === "N/A") return 0;
                if (dateA === "N/A") return 1;
                if (dateB === "N/A") return -1;

                // Convert dd/mm/yyyy to date objects
                const [dayA, monthA, yearA] = dateA.split("/");
                const [dayB, monthB, yearB] = dateB.split("/");

                const dateObjA = new Date(yearA, monthA - 1, dayA);
                const dateObjB = new Date(yearB, monthB - 1, dayB);

                return dateObjA - dateObjB;

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
        tasks.forEach(task => {
            taskList.appendChild(task);
        });
    }

    // Function to auto-expand textarea height based on content
    window.autoExpand = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };

    // Function to format date from yyyy-mm-dd to dd/mm/yyyy
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

    // Function to convert date from dd/mm/yyyy to yyyy-mm-dd for input fields
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

    // Set up auto-expand for input fields
    taskTitle.addEventListener('input', () => autoExpand(taskTitle));
    taskDescription.addEventListener('input', () => autoExpand(taskDescription));

    // Add task button click handler
    addTaskButton.addEventListener("click", function () {
        const title = taskTitle.value.trim();
        const description = taskDescription.value.trim();
        const dateValue = dueDate.value.trim();
        const reminderValue = reminder.value.trim();
        const priorityValue = priority.value;
        const listValue = list.value;

        if (title) {
            const taskItem = createTaskElement({
                title,
                description,
                date: dateValue,
                reminder: reminderValue,
                priority: priorityValue,
                list: listValue,
                completed: false
            });

            taskList.appendChild(taskItem);
            saveTasks();

            // Reset input fields
            taskTitle.value = '';
            taskDescription.value = '';
            dueDate.value = '';
            reminder.value = '';
            priority.value = 'priority';
            list.value = 'default';
        }
    });

    // Cancel task button click handler
    cancelTaskButton.addEventListener("click", function() {
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';
        priority.value = 'priority';
        list.value = 'default';
    });

    // Create a task element
    function createTaskElement(task) {
        const taskItem = document.createElement("li");
        taskItem.classList.add("task-item");

        // Task completion ring
        const taskRing = document.createElement("div");
        taskRing.classList.add("task-ring");
        if (task.completed) taskRing.classList.add("completed");

        taskRing.addEventListener("click", function () {
            taskRing.classList.toggle("completed");
            task.completed = taskRing.classList.contains("completed");
            saveTasks();
        });

        // Task content container
        const taskContent = document.createElement("div");
        taskContent.style.width = "100%";

        // Format dates for display
        const formattedDueDate = formatDate(task.date);
        const formattedReminderDate = formatDate(task.reminder);

        // Title with inline editing
        const titleDiv = document.createElement("div");
        titleDiv.innerHTML = `
            <div class="editable-content" data-field="title">
                <div class="display-text">${task.title}</div>
                <input type="text" class="edit-input" value="${task.title}" style="display: none;">
            </div>
        `;
        titleDiv.classList.add("task-title");
        setupInlineEditing(titleDiv.querySelector('.editable-content'), task);

        // Description with inline editing
        const descDiv = document.createElement("div");
        descDiv.innerHTML = `
            <div class="editable-content" data-field="description">
                <div class="display-text">${task.description}</div>
                <textarea class="edit-input" style="display: none;">${task.description}</textarea>
            </div>
        `;
        descDiv.classList.add("task-desc");
        setupInlineEditing(descDiv.querySelector('.editable-content'), task);

        // Metadata container
        const metadata = document.createElement("div");
        metadata.classList.add("task-metadata");

        // Date with inline editing
        const dateDiv = document.createElement("div");
        dateDiv.innerHTML = `
            <div class="editable-content" data-field="date">
                <div class="display-text">Date: ${formattedDueDate}</div>
                <input type="date" class="edit-input" value="${convertToInputDateFormat(task.date)}" style="display: none;">
            </div>
        `;
        setupInlineEditing(dateDiv.querySelector('.editable-content'), task);

        // Reminder with inline editing
        const reminderDiv = document.createElement("div");
        reminderDiv.innerHTML = `
            <div class="editable-content" data-field="reminder">
                <div class="display-text">Reminder: ${formattedReminderDate}</div>
                <input type="date" class="edit-input" value="${convertToInputDateFormat(task.reminder)}" style="display: none;">
            </div>
        `;
        setupInlineEditing(reminderDiv.querySelector('.editable-content'), task);

        // Priority with inline editing
        const priorityDiv = document.createElement("div");
        priorityDiv.innerHTML = `
            <div class="editable-content" data-field="priority">
                <div class="display-text">Priority: ${task.priority || 'N/A'}</div>
                <select class="edit-input" style="display: none;">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
        `;
        setupInlineEditing(priorityDiv.querySelector('.editable-content'), task);

        // List with inline editing
// List with inline editing
        const listDiv = document.createElement("div");
        listDiv.innerHTML = `
    <div class="editable-content" data-field="list">
        <div class="display-text">List: ${task.list || 'N/A'}</div>
        <select class="edit-input" style="display: none;">
            <option value="N/A">N/A</option>
        </select>
    </div>
`;

// Get the select element
        const listSelect = listDiv.querySelector('.edit-input');

// Add options for each list
        lists.forEach(listName => {
            const option = document.createElement("option");
            option.value = listName;
            option.textContent = listName;
            if (task.list === listName) {
                option.selected = true;
            }
            listSelect.appendChild(option);
        });

        setupInlineEditing(listDiv.querySelector('.editable-content'), task);

        // Add delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.classList.add("delete-task");
        deleteButton.style.marginLeft = "10px";
        deleteButton.style.background = "#ff5555";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.borderRadius = "50%";
        deleteButton.style.width = "24px";
        deleteButton.style.height = "24px";
        deleteButton.style.cursor = "pointer";
        deleteButton.addEventListener("click", function() {
            taskItem.remove();
            saveTasks();
        });

        // Assemble the task item
        metadata.appendChild(dateDiv);
        metadata.appendChild(reminderDiv);
        metadata.appendChild(priorityDiv);
        metadata.appendChild(listDiv);

        taskContent.appendChild(titleDiv);
        taskContent.appendChild(descDiv);
        taskContent.appendChild(metadata);

        taskItem.appendChild(taskRing);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(deleteButton);

        return taskItem;
    }

    // Setup inline editing for a specific element
    function setupInlineEditing(element, task) {
        const displayText = element.querySelector('.display-text');
        const editInput = element.querySelector('.edit-input');
        const field = element.dataset.field;

        // Double-click to edit
        displayText.addEventListener('dblclick', function() {
            displayText.style.display = 'none';
            editInput.style.display = 'block';

            if (editInput.tagName === 'TEXTAREA') {
                autoExpand(editInput);
                editInput.addEventListener('input', () => autoExpand(editInput));
            }

            editInput.focus();
        });

        // Save on enter, blur or escape
        editInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });

        editInput.addEventListener('blur', saveEdit);

        function saveEdit() {
            let value = editInput.value.trim();

            // Update display and task object
            if (field === 'title') {
                task.title = value || 'Untitled';
                displayText.textContent = task.title;
            } else if (field === 'description') {
                task.description = value;
                displayText.textContent = task.description;
            } else if (field === 'date') {
                task.date = value;
                displayText.textContent = `Date: ${formatDate(value)}`;
            } else if (field === 'reminder') {
                task.reminder = value;
                displayText.textContent = `Reminder: ${formatDate(value)}`;
            } else if (field === 'priority') {
                task.priority = editInput.options[editInput.selectedIndex].value;
                displayText.textContent = `Priority: ${task.priority || 'N/A'}`;
            } else if (field === 'list') {
                task.list = editInput.options[editInput.selectedIndex].value;
                displayText.textContent = `List: ${task.list || 'N/A'}`;
            }

            // Hide input, show display text
            displayText.style.display = 'block';
            editInput.style.display = 'none';

            // Save tasks to localStorage
            saveTasks();
        }

        function cancelEdit() {
            // Reset input to match task
            if (field === 'title') {
                editInput.value = task.title;
            } else if (field === 'description') {
                editInput.value = task.description;
            } else if (field === 'date') {
                editInput.value = convertToInputDateFormat(task.date);
            } else if (field === 'reminder') {
                editInput.value = convertToInputDateFormat(task.reminder);
            } else if (field === 'priority' || field === 'list') {
                for (let i = 0; i < editInput.options.length; i++) {
                    if (editInput.options[i].value === task[field]) {
                        editInput.selectedIndex = i;
                        break;
                    }
                }
            }

            // Hide input, show display text
            displayText.style.display = 'block';
            editInput.style.display = 'none';
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        const tasks = [];
        const taskItems = document.querySelectorAll(".task-item");

        taskItems.forEach(taskItem => {
            const titleText = taskItem.querySelector("[data-field='title'] .display-text").textContent;
            const descText = taskItem.querySelector("[data-field='description'] .display-text").textContent;
            const dateText = taskItem.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");
            const reminderText = taskItem.querySelector("[data-field='reminder'] .display-text").textContent.replace("Reminder: ", "");
            const priorityText = taskItem.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");
            const listText = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");
            const completed = taskItem.querySelector(".task-ring").classList.contains("completed");

            const task = {
                title: titleText,
                description: descText,
                date: dateText,
                reminder: reminderText,
                priority: priorityText,
                list: listText,
                completed: completed
            };
            tasks.push(task);
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // Load tasks from localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem("tasks");

        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);

            tasks.forEach(task => {
                const taskItem = createTaskElement(task);
                taskList.appendChild(taskItem);
            });
        }
    }

    // Render tasks
    function renderTasks() {
        taskList.innerHTML = '';
        loadTasks();
    }

    // Format date inputs on change
    dueDate.addEventListener('change', function() {
        // Just for visual feedback that the date format will be correct
        const dateValue = this.value;
        if (dateValue) {
            const formattedDate = formatDate(dateValue);
            console.log(`Date will be saved as: ${formattedDate}`);
        }
    });

    reminder.addEventListener('change', function() {
        // Just for visual feedback that the date format will be correct
        const dateValue = this.value;
        if (dateValue) {
            const formattedDate = formatDate(dateValue);
            console.log(`Reminder will be saved as: ${formattedDate}`);
        }
    });

    // Initialize by loading tasks
    loadTasks();
});

// Add this to the beginning of your DOMContentLoaded event handler
document.addEventListener("DOMContentLoaded", function () {
    // ... existing code ...

    // Task creation box expand/collapse functionality
    const taskCreationBox = document.querySelector(".task-creation-box");
    const taskCreationHeader = taskCreationBox.querySelector("h3");
    const taskTitleInput = document.getElementById("task-title");

    // Function to expand the task creation box
    function expandTaskCreation() {
        taskCreationBox.classList.add("expanded");
    }

    // Function to collapse the task creation box
    function collapseTaskCreation() {
        if (taskTitleInput.value.trim() === '') {
            taskCreationBox.classList.remove("expanded");
        }
    }

    // Click on the header to toggle
    taskCreationHeader.addEventListener("click", function() {
        taskCreationBox.classList.toggle("expanded");
        if (taskCreationBox.classList.contains("expanded")) {
            taskTitleInput.focus();
        }
    });

    // Focus on title expands the box
    taskTitleInput.addEventListener("focus", expandTaskCreation);

    // Clicking anywhere in the task box keeps it expanded
    taskCreationBox.addEventListener("click", function(e) {
        if (e.target !== taskCreationHeader) {
            expandTaskCreation();
        }
    });

    // Click outside collapses the box if title is empty
    document.addEventListener("click", function(e) {
        if (!taskCreationBox.contains(e.target)) {
            collapseTaskCreation();
        }
    });

    // Cancel button collapses the box
    cancelTaskButton.addEventListener("click", function() {
        // Existing code for resetting fields
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';
        priority.value = 'priority';
        list.value = 'default';

        // Add this line to collapse the box
        collapseTaskCreation();
    });

    // Add task button should collapse the box after adding
    const originalAddTaskHandler = addTaskButton.onclick;
    addTaskButton.addEventListener("click", function() {
        // Original functionality will be called normally

        // After task is added and fields are reset, collapse the box
        setTimeout(collapseTaskCreation, 0);
    });

    // Start with the box collapsed
    collapseTaskCreation();

    // ... rest of your existing code ...
});

// Add these functions to your existing JavaScript file

document.addEventListener("DOMContentLoaded", function() {
    // Get references to list management elements
    const listsContainer = document.getElementById("lists-container");
    const addListBtn = document.getElementById("add-list-btn");
    const listSelect = document.getElementById("list");

    // Initialize lists array
    let lists = [];

    // Load lists from localStorage
    function loadLists() {
        const savedLists = localStorage.getItem("custom-lists");

        if (savedLists) {
            lists = JSON.parse(savedLists);
        } else {
            // Default lists if none exist
            lists = ["Personal", "Work", "Shopping"];
            saveLists();
        }

        renderLists();
        updateListDropdown();
    }

    // Save lists to localStorage
    function saveLists() {
        localStorage.setItem("custom-lists", JSON.stringify(lists));
    }

    // Render lists in the sidebar
    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");
            listItem.innerHTML = `
                <span class="list-name" data-index="${index}">${listName}</span>
                <div class="list-actions">
                    <button class="list-edit-btn" data-index="${index}">Edit</button>
                    <button class="list-delete-btn" data-index="${index}">Delete</button>
                </div>
            `;

            // Add click event to list name to filter tasks
            listItem.querySelector('.list-name').addEventListener('click', function() {
                filterTasksByList(listName);
            });

            // Add edit functionality
            listItem.querySelector('.list-edit-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                startEditingList(index, listItem);
            });

            // Add delete functionality
            listItem.querySelector('.list-delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
                    deleteList(index);
                }
            });

            listsContainer.appendChild(listItem);
        });
    }

    // Update the list dropdown in the task creation form
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

    // Start editing a list
    function startEditingList(index, listItem) {
        const listNameEl = listItem.querySelector('.list-name');
        const currentName = lists[index];

        // Create edit input
        const editInput = document.createElement("input");
        editInput.classList.add("list-edit-input");
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

    // Save list edit
    function saveListEdit(index, newName, listItem, listNameEl, editInput) {
        newName = newName.trim();

        if (newName && newName !== lists[index]) {
            const oldName = lists[index];
            lists[index] = newName;
            saveLists();
            updateListDropdown();

            // Update tasks with this list name
            updateTasksWithNewListName(oldName, newName);
        }

        // Restore display
        listNameEl.textContent = lists[index];
        listNameEl.style.display = '';
        editInput.remove();
    }

    // Cancel list edit
    function cancelListEdit(listItem, listNameEl, editInput) {
        listNameEl.style.display = '';
        editInput.remove();
    }

    // Delete a list
    function deleteList(index) {
        const listName = lists[index];
        lists.splice(index, 1);
        saveLists();
        renderLists();
        updateListDropdown();

        // Update tasks that were in this list
        updateTasksWithDeletedList(listName);
    }

    // Update tasks when a list is renamed
    function updateTasksWithNewListName(oldName, newName) {
        const taskItems = document.querySelectorAll(".task-item");
        let tasksUpdated = false;

        taskItems.forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${oldName}`) {
                listDisplay.textContent = `List: ${newName}`;
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks(); // Call your existing saveTasks function
        }
    }

    // Update tasks when a list is deleted
    function updateTasksWithDeletedList(deletedListName) {
        const taskItems = document.querySelectorAll(".task-item");
        let tasksUpdated = false;

        taskItems.forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${deletedListName}`) {
                listDisplay.textContent = "List: N/A";
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks(); // Call your existing saveTasks function
        }
    }

    // Filter tasks by list
    function filterTasksByList(listName) {
        const taskItems = document.querySelectorAll(".task-item");

        taskItems.forEach(taskItem => {
            const taskList = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

            if (listName === taskList) {
                taskItem.style.display = "flex";
            } else {
                taskItem.style.display = "none";
            }
        });

        // Update the page title to show which list is being viewed
        document.querySelector(".today-title").textContent = listName;
    }

    // Add a new list
    function addNewList() {
        const newListName = prompt("Enter a name for the new list:");

        if (newListName && newListName.trim()) {
            lists.push(newListName.trim());
            saveLists();
            renderLists();
            updateListDropdown();
        }
    }

    // Add click event to add list button
    addListBtn.addEventListener("click", addNewList);

    // Add event to show all tasks when "Today" is clicked
    document.querySelector(".menu a:nth-child(3)").addEventListener("click", function() {
        const taskItems = document.querySelectorAll(".task-item");
        taskItems.forEach(taskItem => {
            taskItem.style.display = "flex";
        });
        document.querySelector(".today-title").textContent = "Today";
    });

    // Initialize
    loadLists();

    // Add function to update list select in task editing
    // Modify your existing setupInlineEditing function for list field
    const originalSetupInlineEditing = window.setupInlineEditing || setupInlineEditing;
    window.setupInlineEditing = function(element, task) {
        // Call the original function first
        originalSetupInlineEditing(element, task);

        // Add special handling for list field dropdown
        const field = element.dataset.field;
        if (field === 'list') {
            const editInput = element.querySelector('.edit-input');

            // Clear and update options when editing starts
            element.querySelector('.display-text').addEventListener('dblclick', function() {
                // Clear current options
                while (editInput.options.length > 0) {
                    editInput.remove(0);
                }

                // Add N/A option
                const naOption = document.createElement("option");
                naOption.value = "N/A";
                naOption.textContent = "N/A";
                editInput.appendChild(naOption);

                // Add list options
                lists.forEach(listName => {
                    const option = document.createElement("option");
                    option.value = listName;
                    option.textContent = listName;
                    editInput.appendChild(option);
                });

                // Set current value
                const currentList = element.querySelector('.display-text').textContent.replace("List: ", "");
                for (let i = 0; i < editInput.options.length; i++) {
                    if (editInput.options[i].value === currentList) {
                        editInput.selectedIndex = i;
                        break;
                    }
                }
            });
        }
    };
});

// Add these functions to your existing JavaScript file

document.addEventListener("DOMContentLoaded", function() {
    // Get references to list management elements
    const listsContainer = document.getElementById("lists-container");
    const addListBtn = document.getElementById("add-list-btn");
    const listSelect = document.getElementById("list");

    // Initialize lists array
    let lists = [];

    // Load lists from localStorage
    function loadLists() {
        const savedLists = localStorage.getItem("custom-lists");

        if (savedLists) {
            lists = JSON.parse(savedLists);
        } else {
            // Default lists if none exist
            lists = ["Personal", "Work", "Shopping"];
            saveLists();
        }

        renderLists();
        updateListDropdown();
    }

    // Save lists to localStorage
    function saveLists() {
        localStorage.setItem("custom-lists", JSON.stringify(lists));
    }

    // Render lists in the sidebar
    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");
            listItem.innerHTML = `
                <span class="list-name" data-index="${index}">${listName}</span>
                <div class="list-actions">
                    <button class="list-edit-btn" data-index="${index}">Edit</button>
                    <button class="list-delete-btn" data-index="${index}">Delete</button>
                </div>
            `;

            // Add click event to list name to filter tasks
            listItem.querySelector('.list-name').addEventListener('click', function() {
                filterTasksByList(listName);
            });

            // Add edit functionality
            listItem.querySelector('.list-edit-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                startEditingList(index, listItem);
            });

            // Add delete functionality
            listItem.querySelector('.list-delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
                    deleteList(index);
                }
            });

            listsContainer.appendChild(listItem);
        });
    }

    // Update the list dropdown in the task creation form
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

    // Start editing a list
    function startEditingList(index, listItem) {
        const listNameEl = listItem.querySelector('.list-name');
        const currentName = lists[index];

        // Create edit input
        const editInput = document.createElement("input");
        editInput.classList.add("list-edit-input");
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

    // Save list edit
    function saveListEdit(index, newName, listItem, listNameEl, editInput) {
        newName = newName.trim();

        if (newName && newName !== lists[index]) {
            const oldName = lists[index];
            lists[index] = newName;
            saveLists();
            updateListDropdown();

            // Update tasks with this list name
            updateTasksWithNewListName(oldName, newName);
        }

        // Restore display
        listNameEl.textContent = lists[index];
        listNameEl.style.display = '';
        editInput.remove();
    }

    // Cancel list edit
    function cancelListEdit(listItem, listNameEl, editInput) {
        listNameEl.style.display = '';
        editInput.remove();
    }

    // Delete a list
    function deleteList(index) {
        const listName = lists[index];
        lists.splice(index, 1);
        saveLists();
        renderLists();
        updateListDropdown();

        // Update tasks that were in this list
        updateTasksWithDeletedList(listName);
    }

    // Update tasks when a list is renamed
    function updateTasksWithNewListName(oldName, newName) {
        const taskItems = document.querySelectorAll(".task-item");
        let tasksUpdated = false;

        taskItems.forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${oldName}`) {
                listDisplay.textContent = `List: ${newName}`;
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks(); // Call your existing saveTasks function
        }
    }

    // Update tasks when a list is deleted
    function updateTasksWithDeletedList(deletedListName) {
        const taskItems = document.querySelectorAll(".task-item");
        let tasksUpdated = false;

        taskItems.forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${deletedListName}`) {
                listDisplay.textContent = "List: N/A";
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks(); // Call your existing saveTasks function
        }
    }

    // Filter tasks by list
    function filterTasksByList(listName) {
        const taskItems = document.querySelectorAll(".task-item");

        taskItems.forEach(taskItem => {
            const taskList = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

            if (listName === taskList) {
                taskItem.style.display = "flex";
            } else {
                taskItem.style.display = "none";
            }
        });

        // Update the page title to show which list is being viewed
        document.querySelector(".today-title").textContent = listName;
    }

    // Add a new list
    function addNewList() {
        const newListName = prompt("Enter a name for the new list:");

        if (newListName && newListName.trim()) {
            lists.push(newListName.trim());
            saveLists();
            renderLists();
            updateListDropdown();
        }
    }

    // Add click event to add list button
    addListBtn.addEventListener("click", addNewList);

    // Add event to show all tasks when "Today" is clicked
    document.querySelector(".menu a:nth-child(3)").addEventListener("click", function() {
        const taskItems = document.querySelectorAll(".task-item");
        taskItems.forEach(taskItem => {
            taskItem.style.display = "flex";
        });
        document.querySelector(".today-title").textContent = "Today";
    });

    // Initialize
    loadLists();

    // Add function to update list select in task editing
    // Modify your existing setupInlineEditing function for list field
    const originalSetupInlineEditing = window.setupInlineEditing || setupInlineEditing;
    window.setupInlineEditing = function(element, task) {
        // Call the original function first
        originalSetupInlineEditing(element, task);

        // Add special handling for list field dropdown
        const field = element.dataset.field;
        if (field === 'list') {
            const editInput = element.querySelector('.edit-input');

            // Clear and update options when editing starts
            element.querySelector('.display-text').addEventListener('dblclick', function() {
                // Clear current options
                while (editInput.options.length > 0) {
                    editInput.remove(0);
                }

                // Add N/A option
                const naOption = document.createElement("option");
                naOption.value = "N/A";
                naOption.textContent = "N/A";
                editInput.appendChild(naOption);

                // Add list options
                lists.forEach(listName => {
                    const option = document.createElement("option");
                    option.value = listName;
                    option.textContent = listName;
                    editInput.appendChild(option);
                });

                // Set current value
                const currentList = element.querySelector('.display-text').textContent.replace("List: ", "");
                for (let i = 0; i < editInput.options.length; i++) {
                    if (editInput.options[i].value === currentList) {
                        editInput.selectedIndex = i;
                        break;
                    }
                }
            });
        }
    };
});