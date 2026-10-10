/**
 * iDeaL® Assessment App - Engine Logic
 */

const GOOGLE_APPS_SCRIPT_URL = "";

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
  readingTranscript: ""
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
      saveBtn.innerText = "⏳ Syncing to Google Drive...";

      if (!GOOGLE_APPS_SCRIPT_URL) {
        alert(`Google Apps Script URL not configured yet. Payload for ${currentAssessment.studentName} is ready to save to ${currentAssessment.room}.`);
        saveBtn.disabled = false;
        saveBtn.innerText = "☁️ Save Record & Sync to Google Drive";
        return;
      }

      try {
        const payload = {
          studentName: currentAssessment.studentName,
          room: currentAssessment.room,
          storyTitle: currentAssessment.selectedStory.title,
          wcpm: currentAssessment.wcpm,
          accuracy: currentAssessment.accuracy,
          compScore: currentAssessment.compScore,
          profile: document.getElementById("badge-profile").innerText,
          verdict: document.getElementById("badge-verdict").innerText,
          answers: currentAssessment.answers
        };

        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        alert(`Success! Assessment record for ${currentAssessment.studentName} has been synced directly to ${currentAssessment.room} Google Drive folder.`);
      } catch (err) {
        alert("Upload failed. Please check internet connection or Apps Script URL.");
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

function populateAuditScreen() {
  const story = currentAssessment.selectedStory;
  if (!story) return;

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

      const stopWords = ["with", "from", "that", "this", "they", "them", "have", "would", "because", "their", "there", "about"];

      if (cleanedAns.length > 0) {
        // 1. RETELL QUESTIONS
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
        // 2. ALL OTHER QUESTIONS (Literal, Vocabulary, Inferential, Evaluative/Reaction)
        else {
          // Check Full Credit Match (Requires exact phrase OR at least 2 distinct key words)
          const isFullMatch = acceptable.some(target => {
            if (cleanedAns.includes(target)) return true; // Exact phrase match
            const coreWords = target.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
            if (coreWords.length <= 1) return coreWords.some(w => cleanedAns.includes(w));
            const matchCount = coreWords.filter(w => cleanedAns.includes(w)).length;
            return matchCount >= 2; // Requires at least 2 core words for multi-word targets
          });

          // Check Partial Credit Match
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
            autoMark = 0.0; // Random inputs like "popsicle" or single wrong words fail
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
    readingTranscript: ""
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
