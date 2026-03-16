let currentListName = "";
let subjects = [];
let examDates = [];
let editIndex = -1;

const STORAGE_PREFIX_SUBJECTS = "subjectsData-";
const STORAGE_PREFIX_EXAMS = "examDates-";

const messageBox = document.getElementById("messageBox");

const loadForm = document.getElementById("loadForm");
const listNameInput = document.getElementById("listName");
const savedListsContainer = document.getElementById("savedLists");
const refreshListsBtn = document.getElementById("refreshListsBtn");

const jsonActions = document.getElementById("jsonActions");
const jsonFileInput = document.getElementById("jsonFileInput");
const loadJsonBtn = document.getElementById("loadJsonBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");

const subjectsCard = document.getElementById("subjectsCard");
const examsCard = document.getElementById("examsCard");
const currentListBadge = document.getElementById("currentListBadge");

const subjectForm = document.getElementById("subjectForm");
const subjectNameInput = document.getElementById("subjectName");
const creditsInput = document.getElementById("credits");
const gradeInput = document.getElementById("grade");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");

const subjectsTable = document.getElementById("subjectsTable");
const subjectsTbody = subjectsTable.querySelector("tbody");

const resultsDiv = document.getElementById("results");
const averageEl = document.getElementById("average");
const gpaGermanEl = document.getElementById("gpaGerman");
const subjectCountEl = document.getElementById("subjectCount");
const clearAllBtn = document.getElementById("clearAll");

const examForm = document.getElementById("examForm");
const examTable = document.getElementById("examTable");
const examTbody = examTable.querySelector("tbody");
const examSubjectInput = document.getElementById("examSubject");
const examDateInput = document.getElementById("examDate");
const examTimeInput = document.getElementById("examTime");
const examNotesInput = document.getElementById("examNotes");

function showMessage(text, type = "success") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.classList.remove("hidden");

  setTimeout(() => {
    messageBox.classList.add("hidden");
  }, 3000);
}

function getSubjectsKey(name) {
  return `${STORAGE_PREFIX_SUBJECTS}${name}`;
}

function getExamKey(name) {
  return `${STORAGE_PREFIX_EXAMS}${name}`;
}

function saveSubjects() {
  if (currentListName) {
    localStorage.setItem(getSubjectsKey(currentListName), JSON.stringify(subjects));
  }
}

function loadSubjects(name) {
  const data = localStorage.getItem(getSubjectsKey(name));
  subjects = data ? JSON.parse(data) : [];
}

function saveExamDates() {
  if (currentListName) {
    localStorage.setItem(getExamKey(currentListName), JSON.stringify(examDates));
  }
}

function loadExamDates(name) {
  const data = localStorage.getItem(getExamKey(name));
  examDates = data ? JSON.parse(data) : [];
}

function getAllListNames() {
  const names = new Set();

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX_SUBJECTS)) {
      names.add(key.replace(STORAGE_PREFIX_SUBJECTS, ""));
    }
    if (key.startsWith(STORAGE_PREFIX_EXAMS)) {
      names.add(key.replace(STORAGE_PREFIX_EXAMS, ""));
    }
  });

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function renderSavedLists() {
  const listNames = getAllListNames();

  if (listNames.length === 0) {
    savedListsContainer.className = "saved-lists empty-state";
    savedListsContainer.textContent = "Nuk ka lista të ruajtura ende.";
    return;
  }

  savedListsContainer.className = "saved-lists";
  savedListsContainer.innerHTML = "";

  listNames.forEach((name) => {
    const item = document.createElement("div");
    item.className = "saved-list-item";

    item.innerHTML = `
      <span>${name}</span>
      <button type="button" class="btn-primary open-list-btn" data-name="${name}">Hap</button>
      <button type="button" class="btn-danger delete-list-btn" data-name="${name}">Fshij</button>
    `;

    savedListsContainer.appendChild(item);
  });
}

function calculateAverage() {
  let totalCredits = 0;
  let weightedSum = 0;

  subjects.forEach((subject) => {
    totalCredits += subject.credits;
    weightedSum += subject.credits * subject.grade;
  });

  return totalCredits ? weightedSum / totalCredits : 0;
}

function convertToGermanGPA(average) {
  if (average === 0) return "0.00";

  let gpa = 1 + (3 * (10 - average)) / 5;
  if (gpa < 1) gpa = 1;
  if (gpa > 5) gpa = 5;

  return gpa.toFixed(2);
}

function getExamStatus(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(dateString);
  examDate.setHours(0, 0, 0, 0);

  if (examDate.getTime() === today.getTime()) {
    return { label: "Sot", className: "status-today" };
  }

  if (examDate > today) {
    return { label: "Në vijim", className: "status-upcoming" };
  }

  return { label: "Ka kaluar", className: "status-past" };
}

function sortExamsByNearestDate() {
  examDates.sort((a, b) => {
    const first = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
    const second = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
    return first - second;
  });
}

function renderSubjects() {
  subjectsTbody.innerHTML = "";

  subjects.forEach((subject, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${subject.name}</td>
      <td>${subject.credits}</td>
      <td>${subject.grade}</td>
      <td>
        <div class="actions">
          <button type="button" class="editBtn btn-warning" data-index="${index}">Modifiko</button>
          <button type="button" class="deleteBtn btn-danger" data-index="${index}">Fshij</button>
        </div>
      </td>
    `;
    subjectsTbody.appendChild(row);
  });

  const average = calculateAverage();
  averageEl.textContent = average.toFixed(2);
  gpaGermanEl.textContent = convertToGermanGPA(average);
  subjectCountEl.textContent = String(subjects.length);

  const hasSubjects = subjects.length > 0;
  subjectsTable.classList.toggle("hidden", !hasSubjects);
  resultsDiv.classList.toggle("hidden", !hasSubjects);
}

function renderExams() {
  examTbody.innerHTML = "";
  sortExamsByNearestDate();

  examDates.forEach((exam, index) => {
    const status = getExamStatus(exam.date);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exam.subject}</td>
      <td>${exam.date}</td>
      <td>${exam.time || "-"}</td>
      <td>${exam.notes || "-"}</td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td>
        <div class="actions">
          <button type="button" class="deleteExam btn-danger" data-index="${index}">Fshij</button>
        </div>
      </td>
    `;
    examTbody.appendChild(row);
  });

  examTable.classList.toggle("hidden", examDates.length === 0);
}

function openList(name) {
  currentListName = name;
  loadSubjects(name);
  loadExamDates(name);

  currentListBadge.textContent = `Lista: ${name}`;
  subjectsCard.classList.remove("hidden");
  examsCard.classList.remove("hidden");
  jsonActions.classList.remove("hidden");

  listNameInput.value = name;

  renderSubjects();
  renderExams();
}

function clearEditMode() {
  editIndex = -1;
  subjectForm.reset();
  submitBtn.textContent = "Shto lëndë";
  cancelEditBtn.classList.add("hidden");
}

function exportCurrentListAsJson() {
  if (!currentListName) {
    showMessage("Së pari hap ose krijo një listë.", "error");
    return;
  }

  const data = {
    listName: currentListName,
    subjects,
    exams: examDates
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentListName.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  showMessage("JSON u shkarkua me sukses.");
}

loadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = listNameInput.value.trim();
  if (!name) {
    showMessage("Shkruaj emrin e listës.", "error");
    return;
  }

  openList(name);
  renderSavedLists();
  showMessage(`Lista "${name}" u ngarkua.`);
});

refreshListsBtn.addEventListener("click", () => {
  renderSavedLists();
  showMessage("Listat u rifreskuan.");
});

savedListsContainer.addEventListener("click", (event) => {
  const openButton = event.target.closest(".open-list-btn");
  const deleteButton = event.target.closest(".delete-list-btn");

  if (openButton) {
    const name = openButton.dataset.name;
    openList(name);
    showMessage(`Lista "${name}" u hap.`);
  }

  if (deleteButton) {
    const name = deleteButton.dataset.name;
    const confirmed = confirm(`A dëshiron të fshish listën "${name}"?`);

    if (!confirmed) return;

    localStorage.removeItem(getSubjectsKey(name));
    localStorage.removeItem(getExamKey(name));

    if (currentListName === name) {
      currentListName = "";
      subjects = [];
      examDates = [];
      subjectsCard.classList.add("hidden");
      examsCard.classList.add("hidden");
      jsonActions.classList.add("hidden");
      clearEditMode();
    }

    renderSavedLists();
    renderSubjects();
    renderExams();
    showMessage(`Lista "${name}" u fshi.`);
  }
});

subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = subjectNameInput.value.trim();
  const credits = parseInt(creditsInput.value, 10);
  const grade = parseFloat(gradeInput.value);

  if (!name || Number.isNaN(credits) || Number.isNaN(grade)) {
    showMessage("Plotëso të gjitha fushat saktë.", "error");
    return;
  }

  if (grade < 0 || grade > 10) {
    showMessage("Nota duhet të jetë midis 0 dhe 10.", "error");
    return;
  }

  const duplicateIndex = subjects.findIndex(
    (subject, index) =>
      subject.name.toLowerCase() === name.toLowerCase() && index !== editIndex
  );

  if (duplicateIndex !== -1) {
    showMessage("Kjo lëndë ekziston tashmë në këtë listë.", "error");
    return;
  }

  if (editIndex >= 0) {
    subjects[editIndex] = { name, credits, grade };
    showMessage("Lënda u përditësua.");
  } else {
    subjects.push({ name, credits, grade });
    showMessage("Lënda u shtua.");
  }

  saveSubjects();
  renderSubjects();
  renderSavedLists();
  clearEditMode();
});

cancelEditBtn.addEventListener("click", () => {
  clearEditMode();
});

subjectsTbody.addEventListener("click", (event) => {
  const editButton = event.target.closest(".editBtn");
  const deleteButton = event.target.closest(".deleteBtn");

  if (editButton) {
    const index = parseInt(editButton.dataset.index, 10);
    const subject = subjects[index];

    subjectNameInput.value = subject.name;
    creditsInput.value = subject.credits;
    gradeInput.value = subject.grade;
    submitBtn.textContent = "Ruaj ndryshimet";
    cancelEditBtn.classList.remove("hidden");
    editIndex = index;
    subjectNameInput.focus();
  }

  if (deleteButton) {
    const index = parseInt(deleteButton.dataset.index, 10);
    const confirmed = confirm(`Fshi lëndën "${subjects[index].name}"?`);

    if (!confirmed) return;

    subjects.splice(index, 1);
    saveSubjects();
    renderSubjects();
    showMessage("Lënda u fshi.");
  }
});

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("A dëshiron të fshish të gjitha lëndët e kësaj liste?");
  if (!confirmed) return;

  subjects = [];
  saveSubjects();
  renderSubjects();
  showMessage("Të gjitha lëndët u fshinë.");
});

examForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subject = examSubjectInput.value.trim();
  const date = examDateInput.value;
  const time = examTimeInput.value.trim();
  const notes = examNotesInput.value.trim();

  if (!subject || !date) {
    showMessage("Plotëso emrin dhe datën e provimit.", "error");
    return;
  }

  examDates.push({ subject, date, time, notes });
  saveExamDates();
  renderExams();
  examForm.reset();
  showMessage("Provimi u shtua.");
});

examTbody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".deleteExam");

  if (deleteButton) {
    const index = parseInt(deleteButton.dataset.index, 10);
    const confirmed = confirm(`Fshi provimin "${examDates[index].subject}"?`);

    if (!confirmed) return;

    examDates.splice(index, 1);
    saveExamDates();
    renderExams();
    showMessage("Provimi u fshi.");
  }
});

loadJsonBtn.addEventListener("click", () => {
  if (!currentListName) {
    showMessage("Së pari hap ose krijo një listë.", "error");
    return;
  }

  if (!jsonFileInput.files.length) {
    showMessage("Zgjidh një skedar JSON.", "error");
    return;
  }

  const file = jsonFileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (!Array.isArray(data.subjects)) {
        showMessage('JSON nuk përmban një listë valide të "subjects".', "error");
        return;
      }

      if (!Array.isArray(data.exams)) {
        showMessage('JSON nuk përmban një listë valide të "exams".', "error");
        return;
      }

      subjects = data.subjects;
      examDates = data.exams;

      saveSubjects();
      saveExamDates();
      renderSubjects();
      renderExams();
      renderSavedLists();

      showMessage("JSON u ngarkua me sukses.");
    } catch (error) {
      showMessage(`Gabim gjatë leximit të JSON: ${error.message}`, "error");
    }
  };

  reader.readAsText(file);
});

exportJsonBtn.addEventListener("click", exportCurrentListAsJson);

renderSavedLists();