// Jackson Hinks - 5/4/2026

const storageKey = "focusflowTaskList";
let tasks = [];
let editingId = null;
const el = {
    form: document.querySelector("#task-form"),
    title: document.querySelector("#task-title"),
    category: document.querySelector("#task-category"),
    priority: document.querySelector("#task-priority"),
    due: document.querySelector("#task-due"),
    note: document.querySelector("#task-note"),
    formMessage: document.querySelector("#form-message"),
    formHeading: document.querySelector("#form-heading"),
    saveButton: document.querySelector("#save-button"),
    cancelButton: document.querySelector("#cancel-button"),
    search: document.querySelector("#search-box"),
    status: document.querySelector("#status-filter"),
    filterCategory: document.querySelector("#category-filter"),
    sort: document.querySelector("#sort-select"),
    clearButton: document.querySelector("#clear-button"),
    boardMessage: document.querySelector("#board-message"),
    list: document.querySelector("#task-list"),
    total: document.querySelector("#total-count"),
    active: document.querySelector("#active-count"),
    completed: document.querySelector("#completed-count"),
    dueSoon: document.querySelector("#due-soon-count"),
    progressLabel: document.querySelector("#progress-label"),
    progressFill: document.querySelector("#progress-fill")
};
const starterTasks = [
    makeTask("Review final project requirements", "School", "High", 2, "Check the instructions and make sure the required features are included.", false),
    makeTask("Test the project on GitHub Pages", "School", "Medium", 5, "Make sure the live page loads correctly.", false),
    makeTask("Link the app from the main website", "Creative", "Medium", 7, "Add a clear link so the final project is easy to find.", true)
];
function makeId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}
function getFutureDate(daysAhead) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split("T")[0];
}
function makeTask(title, category, priority, daysAhead, note, completed) {
    return {
        id: makeId(),
        title: title,
        category: category,
        priority: priority,
        dueDate: getFutureDate(daysAhead),
        note: note,
        completed: completed,
        createdAt: Date.now()
    };
}
function loadTasks() {
    const savedTasks = localStorage.getItem(storageKey);
    tasks = savedTasks ? JSON.parse(savedTasks) : starterTasks;
    saveTasks();
    // console.log("Tasks loaded:", tasks);
}
function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}
function readForm() {
    return {
        title: el.title.value.trim(),
        category: el.category.value,
        priority: el.priority.value,
        dueDate: el.due.value,
        note: el.note.value.trim()
    };
}
function validateTask(taskData) {
    const duplicate = tasks.some(function(task) {
        return task.id !== editingId && task.title.toLowerCase() === taskData.title.toLowerCase() && task.category === taskData.category;
    });
    if (taskData.title === "") return "Please enter a task title.";
    if (taskData.title.length < 3) return "The task title needs at least 3 characters.";
    if (taskData.dueDate === "") return "Please choose a due date.";
    if (duplicate) return "That task already exists in this category.";
    return "";
}
function handleSubmit(event) {
    event.preventDefault();
    const taskData = readForm();
    const error = validateTask(taskData);
    if (error !== "") {
        el.formMessage.textContent = error;
        return;
    }
    if (editingId === null) {
        taskData.id = makeId();
        taskData.completed = false;
        taskData.createdAt = Date.now();
        tasks.unshift(taskData);
        showMessage("Task added successfully.");
    } else {
        tasks.forEach(function(task) {
            if (task.id === editingId) Object.assign(task, taskData);
        });
        showMessage("Task updated successfully.");
    }
    saveTasks();
    resetForm();
    renderPage();
}
function editTask(taskId) {
    const task = tasks.find(function(item) { return item.id === taskId; });
    if (!task) return;
    editingId = task.id;
    el.title.value = task.title;
    el.category.value = task.category;
    el.priority.value = task.priority;
    el.due.value = task.dueDate;
    el.note.value = task.note;
    el.formHeading.textContent = "Edit Task";
    el.saveButton.textContent = "Save Changes";
    el.cancelButton.classList.remove("hidden");
    el.formMessage.textContent = "";
    el.title.focus();
}
function resetForm() {
    editingId = null;
    el.form.reset();
    el.priority.value = "Medium";
    el.formHeading.textContent = "Add a New Task";
    el.saveButton.textContent = "Add Task";
    el.cancelButton.classList.add("hidden");
    el.formMessage.textContent = "";
}
function deleteTask(taskId) {
    tasks = tasks.filter(function(task) { return task.id !== taskId; });
    if (editingId === taskId) resetForm();
    finishChange("Task deleted.");
}
function toggleTask(taskId) {
    tasks.forEach(function(task) {
        if (task.id === taskId) task.completed = !task.completed;
    });
    finishChange("Task status updated.");
}
function clearCompletedTasks() {
    const originalLength = tasks.length;
    tasks = tasks.filter(function(task) { return !task.completed; });
    if (tasks.length === originalLength) showMessage("There are no completed tasks to clear.");
    else finishChange("Completed tasks cleared.");
}
function finishChange(message) {
    saveTasks();
    renderPage();
    showMessage(message);
}
function getVisibleTasks() {
    let visibleTasks = tasks.slice();
    const searchText = el.search.value.toLowerCase().trim();
    if (searchText !== "") {
        visibleTasks = visibleTasks.filter(function(task) {
            return task.title.toLowerCase().includes(searchText) || task.note.toLowerCase().includes(searchText);
        });
    }
    if (el.status.value === "Active") visibleTasks = visibleTasks.filter(function(task) { return !task.completed; });
    if (el.status.value === "Completed") visibleTasks = visibleTasks.filter(function(task) { return task.completed; });
    if (el.status.value === "Due Soon") visibleTasks = visibleTasks.filter(function(task) { return isDueSoon(task) && !task.completed; });
    if (el.filterCategory.value !== "All") {
        visibleTasks = visibleTasks.filter(function(task) { return task.category === el.filterCategory.value; });
    }
    sortTasks(visibleTasks);
    return visibleTasks;
}
function sortTasks(taskArray) {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    if (el.sort.value === "due") taskArray.sort(function(a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
    else if (el.sort.value === "priority") taskArray.sort(function(a, b) { return priorityOrder[a.priority] - priorityOrder[b.priority]; });
    else taskArray.sort(function(a, b) { return b.createdAt - a.createdAt; });
}
function isDueSoon(task) {
    const today = new Date();
    const dueDate = new Date(task.dueDate + "T00:00:00");
    today.setHours(0, 0, 0, 0);
    const daysAway = (dueDate - today) / (1000 * 60 * 60 * 24);
    return daysAway >= 0 && daysAway <= 3;
}
function isOverdue(task) {
    const today = new Date();
    const dueDate = new Date(task.dueDate + "T00:00:00");
    today.setHours(0, 0, 0, 0);
    return !task.completed && dueDate < today;
}
function renderPage() {
    const completed = tasks.filter(function(task) { return task.completed; }).length;
    const percent = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
    el.total.textContent = tasks.length;
    el.active.textContent = tasks.length - completed;
    el.completed.textContent = completed;
    el.dueSoon.textContent = tasks.filter(function(task) { return isDueSoon(task) && !task.completed; }).length;
    el.progressLabel.textContent = percent + "% complete";
    el.progressFill.style.width = percent + "%";
    renderTasks();
}
function renderTasks() {
    const visibleTasks = getVisibleTasks();
    el.list.innerHTML = "";
    if (visibleTasks.length === 0) {
        el.list.innerHTML = '<div class="empty-box"><h3>No tasks found</h3><p>Add a task or adjust the current controls.</p></div>';
        return;
    }
    visibleTasks.forEach(function(task) {
        const card = document.createElement("article");
        const note = task.note === "" ? "No notes were added for this task." : task.note;
        const completedText = task.completed ? "Reopen" : "Complete";
        const dueSoonTag = isDueSoon(task) && !task.completed ? '<span class="tag due-soon">Due Soon</span>' : "";
        const overdueTag = isOverdue(task) ? '<span class="tag overdue">Overdue</span>' : "";
        card.className = task.completed ? "task-card completed" : "task-card";
        card.innerHTML = `<div><h3>${cleanText(task.title)}</h3><div class="task-tags"><span class="tag">${cleanText(task.category)}</span><span class="tag ${task.priority.toLowerCase()}">${task.priority} Priority</span><span class="tag">Due ${formatDate(task.dueDate)}</span>${dueSoonTag}${overdueTag}</div><p class="task-note">${cleanText(note)}</p></div><div class="task-buttons"><button type="button" data-action="complete" data-id="${task.id}">${completedText}</button><button type="button" class="secondary-button" data-action="edit" data-id="${task.id}">Edit</button><button type="button" class="delete-button" data-action="delete" data-id="${task.id}">Delete</button></div>`;
        el.list.appendChild(card);
    });
}
function formatDate(dateText) {
    const date = new Date(dateText + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function cleanText(text) {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function showMessage(message) {
    el.boardMessage.textContent = message;
}
function handleTaskClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "complete") toggleTask(button.dataset.id);
    if (button.dataset.action === "edit") editTask(button.dataset.id);
    if (button.dataset.action === "delete") deleteTask(button.dataset.id);
}
el.form.addEventListener("submit", handleSubmit);
el.cancelButton.addEventListener("click", resetForm);
el.clearButton.addEventListener("click", clearCompletedTasks);
el.list.addEventListener("click", handleTaskClick);
el.search.addEventListener("input", renderTasks);
el.status.addEventListener("change", renderTasks);
el.filterCategory.addEventListener("change", renderTasks);
el.sort.addEventListener("change", renderTasks);
loadTasks();
renderPage();
