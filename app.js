// Global Application State
let currentAssessment = {
  room: "",
  studentName: "",
  selectedStory: null,
  readingTimeSeconds: 0,
  answers: [],
  scores: [],
  wcpm: 0,
  accuracy: 100,
  compScore: 0
};

let mediaRecorder = null;
let mainAudioChunks = [];
let readingTimerInterval = null;
let currentQuestionIdx = 0;
let recognition = null;

document.addEventListener("DOMContentLoaded", () => {
  renderStoryGrid();
  setupScreen1Validation();
  setupScreen2MicCheck();
  setupScreen3Reading();
  setupScreen4Comprehension();
  setupScreen5Audit();
});

// Screen Switcher
function showScreen(screenId) {
  document.querySelectorAll(".screen-container").forEach(s => s.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
}

// SCREEN 1: Setup
function renderStoryGrid() {
  const grid = document.getElementById("story-grid");
  grid.innerHTML = "";

  STORIES.forEach((story) => {
    const card = document.createElement("div");
    card.className = "story-card";
    card.innerHTML = `
      <div class="card-badge">Year ${story.yearLevel} ${story.colorLevel ? `(${story.colorLevel})` : ''}</div>
      <h3>${story.title}</h3>
      <p>${story.type} • ${story.totalWords} words</p>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".story-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      currentAssessment.selectedStory = story;
      validateScreen1();
    });
    grid.appendChild(card);
  });
}

function setupScreen1Validation() {
  const room = document.getElementById("room-select");
  const name = document.getElementById("student-name");
  const btn = document.getElementById("btn-screen1-next");

  const check = () => {
    currentAssessment.room = room.value;
    currentAssessment.studentName = name.value.trim();
    btn.disabled = !(currentAssessment.room && currentAssessment.studentName && currentAssessment.selectedStory);
  };

  room.addEventListener("change", check);
  name.addEventListener("input", check);
  btn.addEventListener("click", () => {
    showScreen("screen-2");
    initMicCheck();
  });
}

function validateScreen1() {
  const room = document.getElementById("room-select").value;
  const name = document.getElementById("student-name").value.trim();
  document.getElementById("btn-screen1-next").disabled = !(room && name && currentAssessment.selectedStory);
}

// SCREEN 2: Mic Check
let micStream = null;
let testBlob = null;

async function initMicCheck() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    document.getElementById("mic-status-text").innerText = "⚠️ Mic permission denied.";
  }
}

function setupScreen2MicCheck() {
  const recBtn = document.getElementById("btn-record-test");
  const playBtn = document.getElementById("btn-play-test");
  const startBtn = document.getElementById("btn-screen2-start");

  recBtn.addEventListener("click", () => {
    if (!micStream) return;
    let chunks = [];
    const mr = new MediaRecorder(micStream);
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      testBlob = new Blob(chunks, { type: "audio/webm" });
      playBtn.disabled = false;
      document.getElementById("mic-status-text").innerText = "Sample recorded! Click Play.";
    };
    mr.start();
    recBtn.disabled = true;
    setTimeout(() => { mr.stop(); recBtn.disabled = false; }, 3000);
  });

  playBtn.addEventListener("click", () => {
    if (!testBlob) return;
    const audio = new Audio(URL.createObjectURL(testBlob));
    audio.play();
    audio.onended = () => {
      startBtn.disabled = false;
      document.getElementById("mic-status-text").innerText = "✅ Mic verified!";
    };
  });

  startBtn.addEventListener("click", () => showScreen("screen-3"));
}

// SCREEN 3: Reading Passage
function setupScreen3Reading() {
  const startBtn = document.getElementById("btn-reading-start");
  const finishBtn = document.getElementById("btn-reading-finish");
  const container = document.getElementById("passage-text-container");

  startBtn.addEventListener("click", () => {
    container.innerText = currentAssessment.selectedStory.text;
    startBtn.disabled = true;
    finishBtn.disabled = false;

    mainAudioChunks = [];
    mediaRecorder = new MediaRecorder(micStream);
    mediaRecorder.ondataavailable = e => mainAudioChunks.push(e.data);
    mediaRecorder.start();

    currentAssessment.readingTimeSeconds = 0;
    readingTimerInterval = setInterval(() => {
      currentAssessment.readingTimeSeconds++;
      document.getElementById("reading-timer").innerText = `Time: ${currentAssessment.readingTimeSeconds}s`;
    }, 1000);
  });

  finishBtn.addEventListener("click", () => {
    clearInterval(readingTimerInterval);
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    showScreen("screen-4");
    loadQuestion(0);
  });
}

// SCREEN 4: Comprehension
function setupScreen4Comprehension() {
  const readBtn = document.getElementById("btn-read-aloud");
  const speakBtn = document.getElementById("btn-speak-answer");
  const nextBtn = document.getElementById("btn-next-question");
  const txtArea = document.getElementById("answer-transcript");

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      txtArea.value += (txtArea.value ? " " : "") + transcript;
    };
  }

  readBtn.addEventListener("click", () => {
    const qText = currentAssessment.selectedStory.questions[currentQuestionIdx].questionText;
    const utterance = new SpeechSynthesisUtterance(qText);
    window.speechSynthesis.speak(utterance);
  });

  speakBtn.addEventListener("click", () => {
    if (recognition) recognition.start();
  });

  nextBtn.addEventListener("click", () => {
    if (recognition) recognition.stop();
    currentAssessment.answers[currentQuestionIdx] = txtArea.value;
    
    currentQuestionIdx++;
    if (currentQuestionIdx < currentAssessment.selectedStory.questions.length) {
      loadQuestion(currentQuestionIdx);
    } else {
      showScreen("screen-5");
      populateAuditScreen();
    }
  });
}

function loadQuestion(idx) {
  const q = currentAssessment.selectedStory.questions[idx];
  document.getElementById("question-tracker").innerText = `Question ${idx + 1} of ${currentAssessment.selectedStory.questions.length}`;
  document.getElementById("question-display-text").innerText = q.questionText;
  document.getElementById("answer-transcript").value = currentAssessment.answers[idx] || "";
}

// SCREEN 5: Audit & Scoring
function setupScreen5Audit() {
  document.getElementById("words-1min").addEventListener("input", recalculateMetrics);
  document.getElementById("miscues-count").addEventListener("input", recalculateMetrics);
}

function populateAuditScreen() {
  const qList = document.getElementById("audit-questions-list");
  qList.innerHTML = "";

  currentAssessment.selectedStory.questions.forEach((q, idx) => {
    const ans = currentAssessment.answers[idx] || "(No response)";
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <p><strong>Q${idx + 1}: ${q.questionText}</strong></p>
      <p><em>Response:</em> "${ans}"</p>
      <div class="toggle-group" data-idx="${idx}">
        <button class="active" onclick="setScore(${idx}, 1.0, this)">✔ Correct (1.0)</button>
        <button onclick="setScore(${idx}, 0.5, this)">⚠️ Partial (0.5)</button>
        <button onclick="setScore(${idx}, 0.0, this)">✘ Incorrect (0.0)</button>
      </div>
    `;
    qList.appendChild(div);
    currentAssessment.scores[idx] = 1.0; // Default full credit
  });

  recalculateMetrics();
}

function setScore(qIdx, val, btn) {
  currentAssessment.scores[qIdx] = val;
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  recalculateMetrics();
}

function recalculateMetrics() {
  const words = parseInt(document.getElementById("words-1min").value) || 0;
  const miscues = parseInt(document.getElementById("miscues-count").value) || 0;
  
  const wcpm = Math.max(0, words - miscues);
  const accuracy = words > 0 ? Math.round(((words - miscues) / words) * 100) : 100;
  
  const totalPossible = currentAssessment.selectedStory.questions.length;
  const earned = currentAssessment.scores.reduce((a, b) => a + b, 0);
  const comp = Math.round((earned / totalPossible) * 100);

  document.getElementById("calculated-wcpm").innerText = wcpm;
  document.getElementById("calculated-accuracy").innerText = accuracy + "%";
  document.getElementById("calculated-comp").innerText = comp + "%";

  // Diagnostic logic
  const targetWCPM = WCPM_NORMS[currentAssessment.selectedStory.yearLevel]?.mid || 80;
  let profile = "Secure";
  let verdict = "PASS";

  if (accuracy < 95) {
    profile = "Decoding Deficit";
    verdict = "CONSOLIDATE";
  } else if (comp < 80) {
    profile = "Comprehension Deficit";
    verdict = "CONSOLIDATE";
  } else if (wcpm < targetWCPM) {
    profile = "Disfluent / Effortful";
    verdict = "CONSOLIDATE";
  }

  document.getElementById("badge-profile").innerText = profile;
  document.getElementById("badge-verdict").innerText = verdict;
}
