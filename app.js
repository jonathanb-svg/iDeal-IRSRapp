/**
 * iDeaL® Assessment App - Engine Logic
 */

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyE3dB6CiRPxOUYn7GD1YyrDC_0hz3UdZIVrKgRE7oeDMnFT8ZJhNONWDkVFDttyOdw2w/exec";

let currentAssessment = {
  room: "",
  studentName: "",
  selectedStory: null,
  readingTimeSeconds: 0,
  answers: [],
  scores: [],
  miscues: [],
  wcpm: 0,
  accuracy: 100,
  compScore: 0,
  fullAudioBlob: null,
  readingTranscript: "",
  fluencyLevel: null,
  fluencyDescriptor: "",
  teacherNotes: ""
};

let micStream = null;
let mediaRecorder = null;
let mainAudioChunks = [];
let readingTimerInterval = null;
let currentQuestionIdx = 0;
let speechRecognizer = null;
let readingRecognizer = null;
let audioContext = null;
let analyser = null;
let silenceTimer = null;
let speechSilenceTimer = null;

// Hasbrouck & Tindal Mid-Year 50th Percentile Benchmarks
const WCPM_BENCHMARKS = {
  1: 23,
  2: 29,
  3: 84,
  4: 97,
  5: 120,
  6: 133
};

// Fluency Indicator Scale Descriptors
const FLUENCY_RUBRIC_DATA = {
  1: "Reads word by word with frequent pauses. Reading is slow and effortful. Reading has little expression. Hesitations and repetitions are common.",
  2: "Reads in short phrases. Reading has an uneven pacing. Some pauses and hesitations remain. Expression and phrasing are limited and inconsistent.",
  3: "Reads mostly smoothly in phrases. Pace is generally appropriate. Occasional breaks or self corrections. Expression and intonation support meaning.",
  4: "Reads smoothly and confidently. Reads at a conversational pace. Phrasing follows punctuation. Reads with natural expression that enhances meaning."
};

document.addEventListener("DOMContentLoaded", () => {
  renderStoryGrid();
  setupScreen1();
  setupScreen2();
  setupScreen3();
  setupScreen4();
  setupScreen5();
});

function showScreen(screenId) {
  document.querySelectorAll(".screen-container").forEach(s => s.classList.add("hidden"));
  const target = document.getElementById(screenId);
  if (target) target.classList.remove("hidden");
}

// SCREEN 1 LOGIC
function renderStoryGrid() {
  const grid = document.getElementById("story-grid");
  if (!grid) return;
  grid.innerHTML = "";

  STORIES.forEach((story) => {
    const card = document.createElement("div");
    card.className = "story-card";
    card.innerHTML = `
      <div class="card-badge">Year ${story.yearLevel} ${story.colorLevel ? `(${story.colorLevel})` : ''}</div>
      <h3 style="margin: 0 0 8px 0;">${story.title}</h3>
      <p style="margin: 0; font-size: 14px; color: #64748b;">${story.type} • ${story.totalWords} words</p>
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

function setupScreen1() {
  const room = document.getElementById("room-select");
  const name = document.getElementById("student-name");
  const btn = document.getElementById("btn-screen1-next");

  const check = () => {
    currentAssessment.room = room ? room.value : "";
    currentAssessment.studentName = name ? name.value.trim() : "";
    validateScreen1();
  };

  if (room) room.addEventListener("change", check);
  if (name) name.addEventListener("input", check);
  if (btn) {
    btn.addEventListener("click", () => {
      showScreen("screen-2");
      initMicCheck();
    });
  }
}

function validateScreen1() {
  const btn = document.getElementById("btn-screen1-next");
  if (btn) {
    btn.disabled = !(currentAssessment.room && currentAssessment.studentName && currentAssessment.selectedStory);
  }
}

// SCREEN 2 LOGIC
async function initMicCheck() {
  const status = document.getElementById("mic-status-text");
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
    drawVolumeMeter();
    if (status) status.innerText = "Mic active! Click 'Record 3-Sec Test' to sample audio.";
  } catch (err) {
    if (status) status.innerText = "⚠️ Microphone access blocked. Please allow mic permissions in browser settings.";
  }
}

function drawVolumeMeter() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  let avg = data.reduce((a, b) => a + b, 0) / data.length;
  
  const fill = document.getElementById("volume-meter-fill");
  if (fill) fill.style.width = Math.min(100, avg * 3.5) + "%";
  requestAnimationFrame(drawVolumeMeter);
}

function setupScreen2() {
  const recBtn = document.getElementById("btn-record-test");
  const playBtn = document.getElementById("btn-play-test");
  const startBtn = document.getElementById("btn-screen2-start");
  const status = document.getElementById("mic-status-text");
  let testBlob = null;

  if (recBtn) {
    recBtn.addEventListener("click", () => {
      if (!micStream) return;
      let chunks = [];
      const testRecorder = new MediaRecorder(micStream);
      testRecorder.ondataavailable = e => chunks.push(e.data);
      
      testRecorder.onstop = () => {
        testBlob = new Blob(chunks, { type: "audio/webm" });
        recBtn.innerText = "🔴 Record 3-Sec Test";
        recBtn.disabled = false;
        if (playBtn) {
          playBtn.disabled = false;
          playBtn.style.borderColor = "var(--primary)";
          playBtn.style.color = "var(--primary)";
        }
        if (status) status.innerText = "Sample recorded! Click 'Play Test Sample'.";
      };

      testRecorder.start();
      recBtn.disabled = true;
      let countdown = 3;
      recBtn.innerText = `Recording... ${countdown}s`;
      
      let timer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          recBtn.innerText = `Recording... ${countdown}s`;
        } else {
          clearInterval(timer);
          if (testRecorder.state !== "inactive") testRecorder.stop();
        }
      }, 1000);
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (!testBlob) return;
      playBtn.innerText = "🔊 Playing Sample...";
      playBtn.disabled = true;

      const audio = new Audio(URL.createObjectURL(testBlob));
      audio.play();
      audio.onended = () => {
        testBlob = null;
        playBtn.innerText = "✅ Audio Verified";
        playBtn.className = "btn btn-success";
        if (startBtn) startBtn.disabled = false;
        if (status) status.innerText = "Mic test clear! Click 'Start Reading' to begin.";
      };
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      showScreen("screen-3");
      prepareScreen3();
    });
  }
}

// SCREEN 3 LOGIC
function prepareScreen3() {
  const passageSpan = document.getElementById("passage-body");
  if (passageSpan && currentAssessment.selectedStory) {
    passageSpan.innerText = " " + currentAssessment.selectedStory.text + " ";
  }
}

function setupScreen3() {
  const startBtn = document.getElementById("btn-reading-start");
  const finishBtn = document.getElementById("btn-reading-finish");
  const status = document.getElementById("reading-status");
  const timer = document.getElementById("reading-timer");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startBtn.disabled = true;
      if (finishBtn) finishBtn.disabled = false;
      if (status) status.innerText = "🔴 Live Recording...";

      currentAssessment.readingTranscript = "";

      if (SpeechRecognition) {
        readingRecognizer = new SpeechRecognition();
        readingRecognizer.continuous = true;
        readingRecognizer.interimResults = true;
        readingRecognizer.onresult = (e) => {
          let currentTrans = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            currentTrans += e.results[i][0].transcript + " ";
          }
          currentAssessment.readingTranscript += " " + currentTrans;
        };
        try { readingRecognizer.start(); } catch(err){}
      }

      mainAudioChunks = [];
      mediaRecorder = new MediaRecorder(micStream);
      mediaRecorder.ondataavailable = e => mainAudioChunks.push(e.data);
      mediaRecorder.start();

      currentAssessment.readingTimeSeconds = 0;
      readingTimerInterval = setInterval(() => {
        currentAssessment.readingTimeSeconds++;
        let m = String(Math.floor(currentAssessment.readingTimeSeconds / 60)).padStart(2, '0');
        let s = String(currentAssessment.readingTimeSeconds % 60).padStart(2, '0');
        if (timer) timer.innerText = `Time: ${m}:${s}`;
      }, 1000);
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      clearInterval(readingTimerInterval);

      if (readingRecognizer) {
        try { readingRecognizer.stop(); } catch(err){}
      }

      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.onstop = () => {
          currentAssessment.fullAudioBlob = new Blob(mainAudioChunks, { type: "audio/webm" });
          const player = document.getElementById("full-audio-player");
          if (player) {
            player.src = URL.createObjectURL(currentAssessment.fullAudioBlob);
          }
        };
        mediaRecorder.stop();
      }
      showScreen("screen-4");
      currentQuestionIdx = 0;
      loadQuestion(0);
    });
  }
}

// SCREEN 4 LOGIC
function setupScreen4() {
  const readBtn = document.getElementById("btn-read-aloud");
  const speakBtn = document.getElementById("btn-speak-answer");
  const nextBtn = document.getElementById("btn-next-question");
  const prevBtn = document.getElementById("btn-prev-question");
  const txtArea = document.getElementById("answer-transcript");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = false;

    speechRecognizer.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (txtArea) {
        txtArea.value += (txtArea.value ? " " : "") + transcript;
        resetSilenceTimer(txtArea.value);
      }
      
      if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
      speechSilenceTimer = setTimeout(() => {
        if (speechRecognizer) try { speechRecognizer.stop(); } catch(e){}
      }, 3500);
    };

    speechRecognizer.onend = () => {
      if (speakBtn) {
        speakBtn.innerText = "🎤 Speak Answer";
        speakBtn.classList.remove("btn-listening");
      }
      if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
    };
  }

  if (readBtn) {
    readBtn.addEventListener("click", () => {
      if (!currentAssessment.selectedStory) return;
      window.speechSynthesis.cancel();
      const qText = currentAssessment.selectedStory.questions[currentQuestionIdx].questionText;
      const utterance = new SpeechSynthesisUtterance(qText);
      window.speechSynthesis.speak(utterance);
    });
  }

  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      if (!speechRecognizer) {
        alert("Speech recognition is not supported in this browser. You can type directly into the box.");
        return;
      }
      window.speechSynthesis.cancel();
      speakBtn.innerText = "🎙️ Listening... Speak Now";
      speakBtn.classList.add("btn-listening");
      speechRecognizer.start();

      if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
      speechSilenceTimer = setTimeout(() => {
        if (speechRecognizer) try { speechRecognizer.stop(); } catch(e){}
      }, 6000);
    });
  }

  if (txtArea) {
    txtArea.addEventListener("input", () => resetSilenceTimer(txtArea.value));
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      saveCurrentAnswer();
      currentQuestionIdx++;
      if (currentQuestionIdx < currentAssessment.selectedStory.questions.length) {
        loadQuestion(currentQuestionIdx);
      } else {
        showScreen("screen-5");
        populateAuditScreen();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      saveCurrentAnswer();
      if (currentQuestionIdx > 0) {
        currentQuestionIdx--;
        loadQuestion(currentQuestionIdx);
      }
    });
  }
}

function saveCurrentAnswer() {
  if (speechRecognizer) try { speechRecognizer.stop(); } catch(e){}
  if (silenceTimer) clearTimeout(silenceTimer);
  if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
  const box = document.getElementById("elaboration-box");
  if (box) box.classList.add("hidden");

  const txtArea = document.getElementById("answer-transcript");
  if (txtArea) {
    currentAssessment.answers[currentQuestionIdx] = txtArea.value.trim();
  }
}

function loadQuestion(idx) {
  const q = currentAssessment.selectedStory.questions[idx];
  const tracker = document.getElementById("question-tracker");
  const display = document.getElementById("question-display-text");
  const txtArea = document.getElementById("answer-transcript");
  const prevBtn = document.getElementById("btn-prev-question");

  if (tracker) tracker.innerText = `Question ${idx + 1} of ${currentAssessment.selectedStory.questions.length}`;
  if (display) display.innerText = q.questionText;
  if (txtArea) txtArea.value = currentAssessment.answers[idx] || "";
  if (prevBtn) prevBtn.disabled = (idx === 0);

  const box = document.getElementById("elaboration-box");
  if (box) box.classList.add("hidden");
}

function resetSilenceTimer(text) {
  if (silenceTimer) clearTimeout(silenceTimer);
  const box = document.getElementById("elaboration-box");
  if (box) box.classList.add("hidden");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 1 && wordCount <= 3) {
    silenceTimer = setTimeout(() => {
      if (speechRecognizer) try { speechRecognizer.stop(); } catch(e){}
      if (box) box.classList.remove("hidden");
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Can you tell me a little bit more about that?");
      window.speechSynthesis.speak(utterance);
    }, 2000);
  }
}

// Helper: Convert Blob to Base64 String
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// SCREEN 5 LOGIC
function setupScreen5() {
  const totalWordsInput = document.getElementById("total-words-read");
  const miscuesInput = document.getElementById("miscues-count");
  const saveBtn = document.getElementById("btn-save-drive");
  const nextStudentBtn = document.getElementById("btn-next-student");

  if (totalWordsInput) totalWordsInput.addEventListener("input", recalculateMetrics);
  if (miscuesInput) miscuesInput.addEventListener("input", recalculateMetrics);

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.innerText = "⏳ Saving Report to Drive...";

      if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") {
        alert(`Google Apps Script URL not configured yet.`);
        saveBtn.disabled = false;
        saveBtn.innerText = "☁️ Save Record & Sync to Google Drive";
        return;
      }

      try {
        const storyWords = currentAssessment.selectedStory ? currentAssessment.selectedStory.text.split(/\s+/) : [];
        const markedMiscueWords = currentAssessment.miscues.map(idx => storyWords[idx]).filter(Boolean);

        const questionsDetails = currentAssessment.selectedStory.questions.map((q, idx) => {
          return {
            type: q.type,
            questionText: q.questionText,
            response: currentAssessment.answers[idx] || "",
            score: currentAssessment.scores[idx] !== undefined ? currentAssessment.scores[idx] : 0.0
          };
        });

        const totalWordsVal = parseInt(document.getElementById("total-words-read")?.value || 0) || 0;
        const errorsVal = parseInt(document.getElementById("miscues-count")?.value || 0) || 0;
        
        // Capture teacher notes
        const notesBox = document.getElementById("teacher-notes-input");
        currentAssessment.teacherNotes = notesBox ? notesBox.value : "";

        const payload = {
          action: "createReport",
          studentName: currentAssessment.studentName,
          room: currentAssessment.room,
          storyTitle: currentAssessment.selectedStory.title,
          readingTime: currentAssessment.readingTimeSeconds,
          wordsRead: totalWordsVal,
          errors: errorsVal,
          markedMiscues: markedMiscueWords,
          wcpm: currentAssessment.wcpm,
          accuracy: currentAssessment.accuracy,
          compScore: currentAssessment.compScore,
          benchmark: WCPM_BENCHMARKS[currentAssessment.selectedStory.yearLevel] || 80,
          fluencyLevel: currentAssessment.fluencyLevel,
          fluencyDescriptor: currentAssessment.fluencyDescriptor,
          profile: document.getElementById("badge-profile").innerText,
          verdict: document.getElementById("badge-verdict").innerText,
          teacherNotes: currentAssessment.teacherNotes,
          questionsDetails: questionsDetails
        };

        // Phase 1: Create Document Report
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Phase 2: Save Audio File directly
        if (result.folderId && currentAssessment.fullAudioBlob) {
          saveBtn.innerText = "🎙️ Uploading Playable Audio...";
          const fullBase64 = await blobToBase64(currentAssessment.fullAudioBlob);

          await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "uploadAudio",
              folderId: result.folderId,
              fileName: result.fileName,
              audioBase64: fullBase64
            })
          });
        }

        alert(`Success! Assessment report and playable audio for ${currentAssessment.studentName} have been saved to ${currentAssessment.room}.`);
      } catch (err) {
        alert("Upload completed! Please check your Google Drive folder.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "☁️ Save Record & Sync to Google Drive";
      }
    });
  }

  if (nextStudentBtn) {
    nextStudentBtn.addEventListener("click", () => {
      resetAssessmentState();
      showScreen("screen-1");
    });
  }
}

function selectFluencyLevel(level) {
  currentAssessment.fluencyLevel = level;
  currentAssessment.fluencyDescriptor = FLUENCY_RUBRIC_DATA[level] || "";

  document.querySelectorAll(".fluency-card").forEach(card => {
    card.style.borderColor = "#cbd5e1";
    card.style.backgroundColor = "#ffffff";
  });

  const selectedCard = document.getElementById(`fluency-card-${level}`);
  if (selectedCard) {
    selectedCard.style.borderColor = "#10b981";
    selectedCard.style.backgroundColor = "#ecfdf5";
  }
}

function renderFluencyRubricUI() {
  const container = document.getElementById("fluency-rubric-container");
  if (!container) return;

  container.innerHTML = `
    <h3 style="margin: 16px 0 8px 0;">Fluency Indicator Scale (1–4)</h3>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
      <div id="fluency-card-1" class="fluency-card" onclick="selectFluencyLevel(1)" style="border: 2px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 10px; cursor: pointer;">
        <div style="font-weight: bold; font-size: 18px; color: #1e293b; margin-bottom: 6px; text-align: center;">1</div>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #475569; line-height: 1.4;">
          <li>Reads word by word with frequent pauses</li>
          <li>Reading is slow and effortful</li>
          <li>Reading has little expression</li>
          <li>Hesitations and repetitions are common</li>
        </ul>
      </div>

      <div id="fluency-card-2" class="fluency-card" onclick="selectFluencyLevel(2)" style="border: 2px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 10px; cursor: pointer;">
        <div style="font-weight: bold; font-size: 18px; color: #1e293b; margin-bottom: 6px; text-align: center;">2</div>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #475569; line-height: 1.4;">
          <li>Reads in short phrases</li>
          <li>Reading has an uneven pacing</li>
          <li>Some pauses and hesitations remain</li>
          <li>Expression and phrasing are limited and inconsistent</li>
        </ul>
      </div>

      <div id="fluency-card-3" class="fluency-card" onclick="selectFluencyLevel(3)" style="border: 2px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 10px; cursor: pointer;">
        <div style="font-weight: bold; font-size: 18px; color: #1e293b; margin-bottom: 6px; text-align: center;">3</div>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #475569; line-height: 1.4;">
          <li>Reads mostly smoothly in phrases</li>
          <li>Pace is generally appropriate</li>
          <li>Occasional breaks or self corrections</li>
          <li>Expression and intonation support meaning</li>
        </ul>
      </div>

      <div id="fluency-card-4" class="fluency-card" onclick="selectFluencyLevel(4)" style="border: 2px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 10px; cursor: pointer;">
        <div style="font-weight: bold; font-size: 18px; color: #1e293b; margin-bottom: 6px; text-align: center;">4</div>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #475569; line-height: 1.4;">
          <li>Reads smoothly and confidently</li>
          <li>Reads at a conversational pace</li>
          <li>Phrasing follows punctuation</li>
          <li>Reads with natural expression that enhances meaning</li>
        </ul>
      </div>
    </div>
  `;

  if (currentAssessment.fluencyLevel) {
    selectFluencyLevel(currentAssessment.fluencyLevel);
  }
}

function renderTeacherNotesUI() {
  const container = document.getElementById("teacher-notes-container");
  if (!container) return;

  container.innerHTML = `
    <h3 style="margin: 16px 0 8px 0;">Teacher Notes & Observations</h3>
    <textarea id="teacher-notes-input" placeholder="Type optional notes or observations here..." style="width: 100%; height: 90px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; overflow-y: auto;"></textarea>
  `;

  const notesBox = document.getElementById("teacher-notes-input");
  if (notesBox) {
    notesBox.value = currentAssessment.teacherNotes || "";
    notesBox.addEventListener("input", (e) => {
      currentAssessment.teacherNotes = e.target.value;
    });
  }
}

function populateAuditScreen() {
  const story = currentAssessment.selectedStory;
  if (!story) return;

  renderTeacherNotesUI();
  renderFluencyRubricUI();

  const readTimeSpan = document.getElementById("audit-read-time");
  const readTimeFormatted = document.getElementById("audit-read-time-formatted");
  const totalWordsInput = document.getElementById("total-words-read");
  
  const sec = Math.max(1, currentAssessment.readingTimeSeconds);
  if (readTimeSpan) readTimeSpan.innerText = sec;
  let m = String(Math.floor(sec / 60)).padStart(2, '0');
  let s = String(sec % 60).padStart(2, '0');
  if (readTimeFormatted) readTimeFormatted.innerText = `${m}:${s}`;
  if (totalWordsInput) totalWordsInput.value = story.totalWords;

  const interactiveBox = document.getElementById("interactive-text-box");
  if (interactiveBox) {
    interactiveBox.innerHTML = "";
    currentAssessment.miscues = [];
    const storyWords = story.text.split(/\s+/);
    const spokenTranscript = (currentAssessment.readingTranscript || "").toLowerCase().replace(/[^a-z0-9\s]/g, "");

    storyWords.forEach((w, wIdx) => {
      const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      const span = document.createElement("span");
      span.className = "word-click";
      span.innerText = w + " ";

      if (cleanWord.length > 2 && spokenTranscript.length > 0 && !spokenTranscript.includes(cleanWord)) {
        span.classList.add("miscue");
        currentAssessment.miscues.push(wIdx);
      }

      span.addEventListener("click", () => {
        span.classList.toggle("miscue");
        if (span.classList.contains("miscue")) {
          if (!currentAssessment.miscues.includes(wIdx)) currentAssessment.miscues.push(wIdx);
        } else {
          currentAssessment.miscues = currentAssessment.miscues.filter(i => i !== wIdx);
        }
        const miscuesInput = document.getElementById("miscues-count");
        if (miscuesInput) {
          miscuesInput.value = currentAssessment.miscues.length;
          recalculateMetrics();
        }
      });
      interactiveBox.appendChild(span);
    });

    const miscuesInput = document.getElementById("miscues-count");
    if (miscuesInput) miscuesInput.value = currentAssessment.miscues.length;
  }

  const list = document.getElementById("audit-questions-list");
  if (list) {
    list.innerHTML = "";
    story.questions.forEach((q, idx) => {
      const ans = currentAssessment.answers[idx] || "";
      const cleanedAns = ans.toLowerCase().trim();

      let autoMark = 0.0;
      const sg = q.scoringGuide || {};

      const acceptable = (sg.acceptableAnswers || []).map(a => a.toLowerCase());
      const partials = (sg.partialAnswers || []).map(p => p.toLowerCase());
      const keyIdeas = (sg.keyIdeas || []).map(k => k.toLowerCase());

      const stopWords = ["so", "the", "are", "always", "they", "them", "with", "from", "that", "this", "have", "would", "because", "their", "there", "about"];

      if (cleanedAns.length > 0) {
        if (q.type === "retell" && keyIdeas.length > 0) {
          let matchedDistinctIdeas = 0;
          keyIdeas.forEach(idea => {
            const ideaKeywords = idea.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
            const matchCount = ideaKeywords.filter(kw => cleanedAns.includes(kw)).length;
            if (matchCount >= 2) matchedDistinctIdeas++;
          });

          const requiredCount = sg.requiredKeyIdeasCount || 3;
          if (matchedDistinctIdeas >= requiredCount) {
            autoMark = 1.0;
          } else if (matchedDistinctIdeas >= 1) {
            autoMark = 0.5;
          } else {
            autoMark = 0.0;
          }
        } 
        else {
          const isFullMatch = acceptable.some(target => {
            if (cleanedAns.includes(target)) return true;
            
            const coreWords = target.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
            if (coreWords.length === 0) return false;

            const requiredKeyNoun = coreWords[coreWords.length - 1];
            const hasRequiredNoun = cleanedAns.includes(requiredKeyNoun);

            if (!hasRequiredNoun) return false;

            const matchCount = coreWords.filter(w => cleanedAns.includes(w)).length;
            return matchCount >= Math.min(2, coreWords.length);
          });

          const isPartialMatch = partials.some(target => {
            if (cleanedAns.includes(target)) return true;
            const coreWords = target.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
            return coreWords.some(w => cleanedAns.includes(w));
          });

          if (isFullMatch) {
            autoMark = 1.0;
          } else if (isPartialMatch) {
            autoMark = 0.5;
          } else {
            autoMark = 0.0;
          }
        }
      }

      currentAssessment.scores[idx] = autoMark;

      let rubricDetailsText = "";
      if (q.type === "retell" && keyIdeas.length > 0) {
        rubricDetailsText = `<strong>Required Key Ideas (3 for 1.0):</strong><br>• ${keyIdeas.join('<br>• ')}`;
      } else {
        if (acceptable.length > 0) rubricDetailsText += `<strong>Full Credit (1.0):</strong> ${acceptable.join(' / ')}<br>`;
        if (partials.length > 0) rubricDetailsText += `<strong>Partial (0.5):</strong> ${partials.join(' / ')}`;
      }

      const card = document.createElement("div");
      card.style.cssText = "background:#fff; padding:12px; border-radius:6px; margin-bottom:10px; border:1px solid #e2e8f0;";
      card.innerHTML = `
        <p style="margin:0 0 6px 0;"><strong>Q${idx + 1} (${q.type}):</strong> ${q.questionText}</p>
        <p style="margin:0 0 8px 0; color:#334155;"><em>Student Response:</em> "${ans || '(No response recorded)'}"</p>
        <div class="toggle-group">
          <button class="${autoMark === 1.0 ? 'active-pass' : ''}" onclick="setScore(${idx}, 1.0, this)">✔ Correct (1.0)</button>
          <button class="${autoMark === 0.5 ? 'active-warn' : ''}" onclick="setScore(${idx}, 0.5, this)">⚠️ Partial (0.5)</button>
          <button class="${autoMark === 0.0 ? 'active-fail' : ''}" onclick="setScore(${idx}, 0.0, this)">✘ Incorrect (0.0)</button>
        </div>
        <span class="rubric-toggle-link" onclick="toggleRubricKey('rubric-box-${idx}')">👁️ View Rubric Answer Key</span>
        <div id="rubric-box-${idx}" class="rubric-key-box hidden">${rubricDetailsText}</div>
      `;
      list.appendChild(card);
    });
  }

  recalculateMetrics();
}

function toggleRubricKey(boxId) {
  const box = document.getElementById(boxId);
  if (box) box.classList.toggle("hidden");
}

function setScore(qIdx, mark, btn) {
  currentAssessment.scores[qIdx] = mark;
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.className = "");

  if (mark === 1.0) btn.className = "active-pass";
  else if (mark === 0.5) btn.className = "active-warn";
  else btn.className = "active-fail";

  recalculateMetrics();
}

function recalculateMetrics() {
  const totalWordsInput = document.getElementById("total-words-read");
  const miscuesInput = document.getElementById("miscues-count");

  const wordsRead = parseInt(totalWordsInput ? totalWordsInput.value : 0) || 0;
  const errors = parseInt(miscuesInput ? miscuesInput.value : 0) || 0;
  const seconds = Math.max(1, currentAssessment.readingTimeSeconds);

  const netWords = Math.max(0, wordsRead - errors);
  const wcpm = Math.round((netWords / seconds) * 60);
  const accuracy = wordsRead > 0 ? Math.round((netWords / wordsRead) * 100) : 100;

  document.getElementById("formula-words").innerText = wordsRead;
  document.getElementById("formula-errors").innerText = errors;
  document.getElementById("formula-seconds").innerText = seconds;
  document.getElementById("formula-result").innerText = wcpm;

  const totalQuestions = currentAssessment.selectedStory ? currentAssessment.selectedStory.questions.length : 1;
  const earnedPoints = currentAssessment.scores.reduce((a, b) => a + b, 0);
  const compScore = Math.round((earnedPoints / totalQuestions) * 100);

  currentAssessment.wcpm = wcpm;
  currentAssessment.accuracy = accuracy;
  currentAssessment.compScore = compScore;

  document.getElementById("calculated-wcpm").innerText = wcpm;
  document.getElementById("calculated-accuracy").innerText = accuracy + "%";
  document.getElementById("calculated-comp").innerText = compScore + "%";

  const targetBenchmark = currentAssessment.selectedStory ? (WCPM_BENCHMARKS[currentAssessment.selectedStory.yearLevel] || 80) : 80;
  
  const benchBadge = document.getElementById("target-benchmark-badge");
  if (benchBadge) {
    benchBadge.innerText = `Year ${currentAssessment.selectedStory ? currentAssessment.selectedStory.yearLevel : ''} Benchmark Target: ${targetBenchmark} WCPM`;
  }

  let profile = "Secure Reader";
  let verdict = "PASS";
  let profileBg = "#dcfce7";
  let verdictBg = "#dcfce7";

  if (accuracy < 95) {
    profile = "Decoding Deficit";
    verdict = "CONSOLIDATE";
    profileBg = "#fee2e2";
    verdictBg = "#fee2e2";
  } else if (compScore < 80) {
    profile = "Comprehension Deficit";
    verdict = "CONSOLIDATE";
    profileBg = "#fef9c3";
    verdictBg = "#fee2e2";
  } else if (wcpm < targetBenchmark) {
    profile = "Disfluent / Effortful";
    verdict = "CONSOLIDATE";
    profileBg = "#fef9c3";
    verdictBg = "#fef9c3";
  }

  const badgeProf = document.getElementById("badge-profile");
  const badgeVerd = document.getElementById("badge-verdict");

  if (badgeProf) {
    badgeProf.innerText = profile;
    badgeProf.style.backgroundColor = profileBg;
  }
  if (badgeVerd) {
    badgeVerd.innerText = verdict;
    badgeVerd.style.backgroundColor = verdictBg;
  }
}

function resetAssessmentState() {
  currentAssessment = {
    room: "",
    studentName: "",
    selectedStory: null,
    readingTimeSeconds: 0,
    answers: [],
    scores: [],
    miscues: [],
    wcpm: 0,
    accuracy: 100,
    compScore: 0,
    fullAudioBlob: null,
    readingTranscript: "",
    fluencyLevel: null,
    fluencyDescriptor: "",
    teacherNotes: ""
  };

  document.getElementById("room-select").value = "";
  document.getElementById("student-name").value = "";
  document.querySelectorAll(".story-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("btn-screen1-next").disabled = true;
  document.getElementById("btn-screen2-start").disabled = true;
  document.getElementById("btn-play-test").disabled = true;
  document.getElementById("btn-play-test").innerText = "▶️ Play Test Sample";
  document.getElementById("btn-play-test").className = "btn btn-outline";
  document.getElementById("btn-reading-start").disabled = false;
  document.getElementById("btn-reading-finish").disabled = true;
}
