
const addBtn = document.querySelector(".add-btn");
const taskList = document.querySelector(".task-list");

const totalCount = document.querySelector("#total-count");
const completedCount = document.querySelector("#completed-count");
const pendingCount = document.querySelector("#pending-count");

const emptyMessage = document.querySelector(".empty-message");
const navLinks = document.querySelectorAll(".nav-link");


function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function isValidDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);

    const parsedDate = new Date(year, month - 1, day);

    return parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day;
}


function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("taskflow-tasks");

        if (savedTasks !== null) {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                return parsedTasks.filter(task =>
                    task &&
                    typeof task.id === "string" &&
                    typeof task.title === "string" &&
                    ["high", "medium", "low"].includes(task.priority) &&
                    typeof task.completed === "boolean" &&
                    isValidDate(task.date)
                );
            }
        }
    } catch (error) {
        console.error("Could not load tasks:", error);
    }

    return Array.from(taskList.querySelectorAll(".task-item")).map(item => {
        const name = item.querySelector(".task-name");
        const priority = item.querySelector(".priority");

        const selectedPriority = priority?.classList.contains("high")
            ? "high"
            : priority?.classList.contains("medium")
                ? "medium"
                : "low";

        return {
            id: createId(),
            title: name?.textContent.trim() || "New Task",
            priority: selectedPriority,
            date: getToday(),
            completed: item.dataset.completed === "true"
        };
    });
}


let tasks = loadTasks();
let currentFilter = "all";


function saveTasks() {
    try {
        localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
    } catch (error) {
        alert("Could not save tasks in this browser.");
        console.error("Could not save tasks:", error);
    }
}


function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "today") {
        filteredTasks = tasks.filter(task => task.date === getToday());
    }

    if (currentFilter === "completed") {
        filteredTasks = tasks.filter(task => task.completed);
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        taskItem.dataset.id = task.id;

        const taskInfo = document.createElement("div");
        taskInfo.className = "task-info";

        const taskName = document.createElement("span");
        taskName.className = "task-name";
        taskName.textContent = task.title;

        const taskDate = document.createElement("small");
        taskDate.className = "task-date";
        taskDate.textContent = `Due: ${task.date}`;

        taskInfo.appendChild(taskName);
        taskInfo.appendChild(taskDate);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const priority = document.createElement("span");
        priority.className = `priority ${task.priority}`;
        priority.textContent =
            task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        const completeBtn = document.createElement("button");
        completeBtn.className = "complete-btn";
        completeBtn.textContent = task.completed ? "Undo" : "Complete";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        actions.appendChild(priority);
        actions.appendChild(completeBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        taskItem.appendChild(taskInfo);
        taskItem.appendChild(actions);

        taskList.appendChild(taskItem);
    });

    emptyMessage.hidden = filteredTasks.length !== 0;

    updateStats();
}


function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
}


addBtn.addEventListener("click", function () {
    const title = prompt("Enter your task name:");

    if (title === null || title.trim() === "") {
        return;
    }

    const priority = prompt("Enter priority: high, medium, low");

    if (priority === null) {
        return;
    }

    const selectedPriority = priority.trim().toLowerCase();
    const validPriorities = ["high", "medium", "low"];

    if (!validPriorities.includes(selectedPriority)) {
        alert("Invalid priority! Enter high, medium, or low.");
        return;
    }

    const dateInput = prompt(
        "Enter due date (YYYY-MM-DD):",
        getToday()
    );

    if (dateInput === null) {
        return;
    }

    const selectedDate = dateInput.trim();

    if (!isValidDate(selectedDate)) {
        alert("Invalid date! Use YYYY-MM-DD format.");
        return;
    }

    const newTask = {
        id: createId(),
        title: title.trim(),
        priority: selectedPriority,
        date: selectedDate,
        completed: false
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();
});


taskList.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const taskItem = button.closest(".task-item");

    if (!taskItem) {
        return;
    }

    const taskId = taskItem.dataset.id;
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    if (button.classList.contains("complete-btn")) {
        task.completed = !task.completed;

        saveTasks();
        renderTasks();
    }

    else if (button.classList.contains("delete-btn")) {
        const confirmed = confirm("Are you sure you want to delete this task?");

        if (!confirmed) {
            return;
        }

        tasks = tasks.filter(item => item.id !== taskId);

        saveTasks();
        renderTasks();
    }

    else if (button.classList.contains("edit-btn")) {
        const newTitle = prompt("Edit task name:", task.title);

        if (newTitle === null || newTitle.trim() === "") {
            return;
        }

        const newPriority = prompt(
            "Enter priority: high, medium, low",
            task.priority
        );

        if (newPriority === null) {
            return;
        }

        const selectedPriority = newPriority.trim().toLowerCase();

        if (!["high", "medium", "low"].includes(selectedPriority)) {
            alert("Invalid priority!");
            return;
        }

        const newDate = prompt(
            "Enter due date (YYYY-MM-DD):",
            task.date
        );

        if (newDate === null) {
            return;
        }

        const selectedDate = newDate.trim();

        if (!isValidDate(selectedDate)) {
            alert("Invalid date! Use YYYY-MM-DD format.");
            return;
        }

        task.title = newTitle.trim();
        task.priority = selectedPriority;
        task.date = selectedDate;

        saveTasks();
        renderTasks();
    }
});


navLinks.forEach(link => {
    link.addEventListener("click", function () {
        currentFilter = link.dataset.filter;

        navLinks.forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

        renderTasks();
    });
});


renderTasks();
