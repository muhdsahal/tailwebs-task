
async function makeAPICall(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

function showNotification(message, type = "info") {
  
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;

  switch (type) {
    case "success":
      notification.style.background = "#27ae60";
      break;
    case "error":
      notification.style.background = "#e74c3c";
      break;
    case "warning":
      notification.style.background = "#f39c12";
      break;
    default:
      notification.style.background = "#3498db";
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

function validateForm(form) {
  const inputs = form.querySelectorAll("input[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.style.borderColor = "#e74c3c";
      isValid = false;
    } else {
      input.style.borderColor = "#e1e5e9";
    }
  });

  return isValid;
}

function validateStudentData(name, subject, marks) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Student name must be at least 2 characters long");
  }

  if (!subject || subject.trim().length < 2) {
    errors.push("Subject name must be at least 2 characters long");
  }

  if (marks === "" || marks < 0 || marks > 100) {
    errors.push("Marks must be between 0 and 100");
  }

  return errors;
}

function formatName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatSubject(subject) {
  return subject
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function showLoadingSpinner(element) {
  const originalText = element.textContent;
  element.textContent = "Loading...";
  element.disabled = true;

  return function hideSpinner() {
    element.textContent = originalText;
    element.disabled = false;
  };
}

function showConfirmDialog(message, callback) {
  const result = confirm(message);
  if (result) {
    callback();
  }
}


const SessionManager = {
  setTeacher: function (teacherData) {
    sessionStorage.setItem("teacher", JSON.stringify(teacherData));
  },

  getTeacher: function () {
    const data = sessionStorage.getItem("teacher");
    return data ? JSON.parse(data) : null;
  },

  clearSession: function () {
    sessionStorage.removeItem("teacher");
  },

  isLoggedIn: function () {
    return this.getTeacher() !== null;
  },
};


const Dashboard = {
  currentTeacher: null,
  students: [],

  init: function () {

    this.currentTeacher = SessionManager.getTeacher();
    if (!this.currentTeacher) {
      window.location.href = "/login";
      return;
    }

    
    const teacherNameEl = document.getElementById("teacher-name");
    if (teacherNameEl) {
      teacherNameEl.textContent = `Welcome, ${this.currentTeacher.name}`;
    }

    
    this.loadStudents();

    
    this.setupEventListeners();
  },

  setupEventListeners: function () {
    const addForm = document.getElementById("add-student-form");
    if (addForm) {
      addForm.addEventListener("submit", (e) => this.handleAddStudent(e));
    }

    const editForm = document.getElementById("edit-student-form");
    if (editForm) {
      editForm.addEventListener("submit", (e) => this.handleEditStudent(e));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });
  },

  loadStudents: async function () {
    try {
      const data = await makeAPICall("/api/students", {
        teacher_id: this.currentTeacher.id,
      });

      if (data.success) {
        this.students = data.students;
        this.displayStudents();
      } else {
        showNotification("Error loading students: " + data.message, "error");
      }
    } catch (error) {
      showNotification("Failed to load students", "error");
    }
  },

  displayStudents: function () {
    const tbody = document.getElementById("students-tbody");
    const noStudentsDiv = document.getElementById("no-students");

    if (!tbody) return;

    if (this.students.length === 0) {
      tbody.innerHTML = "";
      if (noStudentsDiv) noStudentsDiv.style.display = "block";
      return;
    }

    if (noStudentsDiv) noStudentsDiv.style.display = "none";

    tbody.innerHTML = this.students
      .map(
        (student) => `
            <tr>
                <td>${student.name}</td>
                <td>${student.subject}</td>
                <td>${student.marks}</td>
                <td>
                    <button onclick="Dashboard.editStudent(${student.id}, '${student.name}', '${student.subject}', ${student.marks})" 
                            class="edit-btn">Edit</button>
                    <button onclick="Dashboard.deleteStudent(${student.id})" 
                            class="delete-btn">Delete</button>
                </td>
            </tr>
        `
      )
      .join("");
  },

  handleAddStudent: async function (e) {
    e.preventDefault();

    const form = e.target;
    if (!validateForm(form)) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    const formData = new FormData(form);
    const name = formatName(formData.get("name"));
    const subject = formatSubject(formData.get("subject"));
    const marks = parseInt(formData.get("marks"));

    const errors = validateStudentData(name, subject, marks);
    if (errors.length > 0) {
      showNotification(errors.join(", "), "error");
      return;
    }

    const existing = this.students.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() &&
        s.subject.toLowerCase() === subject.toLowerCase()
    );

    if (existing) {
      showNotification("Student already exists", "error");
      return;
    }

    const hideSpinner = showLoadingSpinner(
      form.querySelector('button[type="submit"]')
    );

    try {
      const data = await makeAPICall("/api/add_student", {
        name: name,
        subject: subject,
        marks: marks,
        teacher_id: this.currentTeacher.id,
      });

      if (data.success) {
        showNotification(data.message, "success");
        this.closeAddStudentModal();
        this.loadStudents();
      } else {
        showNotification("Error adding student: " + data.message, "error");
      }
    } catch (error) {
      showNotification("Failed to add student", "error");
    } finally {
      hideSpinner();
    }
  },

  handleEditStudent: async function (e) {
    e.preventDefault();

    const form = e.target;
    if (!validateForm(form)) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    const formData = new FormData(form);
    const studentId = parseInt(
      document.getElementById("edit-student-id").value
    );
    const name = formatName(formData.get("name"));
    const subject = formatSubject(formData.get("subject"));
    const marks = parseInt(formData.get("marks"));

    const errors = validateStudentData(name, subject, marks);
    if (errors.length > 0) {
      showNotification(errors.join(", "), "error");
      return;
    }

    const hideSpinner = showLoadingSpinner(
      form.querySelector('button[type="submit"]')
    );

    try {
      const data = await makeAPICall("/api/update_student", {
        student_id: studentId,
        name: name,
        subject: subject,
        marks: marks,
      });

      if (data.success) {
        showNotification(data.message, "success");
        this.closeEditStudentModal();
        this.loadStudents();
      } else {
        showNotification("Error updating student: " + data.message, "error");
      }
    } catch (error) {
      showNotification("Failed to update student", "error");
    } finally {
      hideSpinner();
    }
  },

  editStudent: function (id, name, subject, marks) {
    document.getElementById("edit-student-id").value = id;
    document.getElementById("edit-student-name").value = name;
    document.getElementById("edit-student-subject").value = subject;
    document.getElementById("edit-student-marks").value = marks;
    document.getElementById("edit-student-modal").style.display = "block";
  },

  deleteStudent: async function (studentId) {
    showConfirmDialog(
      "Are you sure you want to delete this student?",
      async () => {
        try {
          const data = await makeAPICall("/api/delete_student", {
            student_id: studentId,
          });

          if (data.success) {
            showNotification(data.message, "success");
            this.loadStudents();
          } else {
            showNotification(
              "Error deleting student: " + data.message,
              "error"
            );
          }
        } catch (error) {
          showNotification("Failed to delete student", "error");
        }
      }
    );
  },

  openAddStudentModal: function () {
    const modal = document.getElementById("add-student-modal");
    const form = document.getElementById("add-student-form");
    if (modal && form) {
      form.reset();
      modal.style.display = "block";
    }
  },

  closeAddStudentModal: function () {
    const modal = document.getElementById("add-student-modal");
    if (modal) {
      modal.style.display = "none";
    }
  },

  closeEditStudentModal: function () {
    const modal = document.getElementById("edit-student-modal");
    if (modal) {
      modal.style.display = "none";
    }
  },

  closeAllModals: function () {
    this.closeAddStudentModal();
    this.closeEditStudentModal();
  },

  logout: function () {
    SessionManager.clearSession();
    window.location.href = "/login";
  },
};

const Login = {
  init: function () {
    
    if (SessionManager.isLoggedIn()) {
      window.location.href = "/dashboard";
      return;
    }

    const form = document.getElementById("login-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleLogin(e));
    }
  },

  handleLogin: async function (e) {
    e.preventDefault();

    const form = e.target;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("error-message");

    
    if (!username || !password) {
      this.showError("Please enter both username and password");
      return;
    }

    const hideSpinner = showLoadingSpinner(
      form.querySelector('button[type="submit"]')
    );

    try {
      const data = await makeAPICall("/api/login", {
        username: username,
        password: password,
      });

      if (data.success) {
        SessionManager.setTeacher(data.teacher);
        showNotification("Login successful!", "success");

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        this.showError(data.message);
      }
    } catch (error) {
      this.showError("Login failed. Please try again.");
    } finally {
      hideSpinner();
    }
  },

  showError: function (message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 5000);
    }
  },
};


function openAddStudentModal() {
  Dashboard.openAddStudentModal();
}

function closeAddStudentModal() {
  Dashboard.closeAddStudentModal();
}

function closeEditStudentModal() {
  Dashboard.closeEditStudentModal();
}

function logout() {
  Dashboard.logout();
}

function loadStudents() {
  Dashboard.loadStudents();
}

document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname === "/dashboard") {
    Dashboard.init();
  } else if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/"
  ) {
    Login.init();
  }

  window.onclick = function (event) {
    const addModal = document.getElementById("add-student-modal");
    const editModal = document.getElementById("edit-student-modal");

    if (event.target === addModal) {
      closeAddStudentModal();
    }
    if (event.target === editModal) {
      closeEditStudentModal();
    }
  };
});
