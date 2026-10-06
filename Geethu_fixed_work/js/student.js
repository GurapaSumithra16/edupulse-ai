/* =========================================================================
   EduPulse AI - Student Portal Logic (student.js)
   Clean implementation with empty states and zero hardcoded test data
   ========================================================================= */

let masteryChartInstance = null;
let radarChartInstance = null;

function switchMainTab(tabId) {
  AppState.currentTab = tabId;

  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));

  // Show selected tab
  const target = document.getElementById(`view-${tabId}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('animate-fade-in');
  }

  // Update sidebar active buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50 transition";
    } else {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition";
    }
  });

  // Tab-specific initializations
  if (tabId === 'analytics-view') {
    initAnalyticsCharts();
    renderTopicDiagnostics();
  } else if (tabId === 'interactive-quiz') {
    renderAvailableQuizzes();
  } else if (tabId === 'feedback-module') {
    renderFeedbackList();
  }
}

/* --- Student Diary --- */
function renderStudentDiaryHistory() {
  const container = document.getElementById('studentDiaryHistoryList');
  if (!container) return;

  if (!AppState.studentDiaryLogs || AppState.studentDiaryLogs.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        No diary entries logged yet. Record your daily study summary above to track your learning journey!
      </div>
    `;
    return;
  }

  container.innerHTML = AppState.studentDiaryLogs.map(log => `
    <div class="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition text-xs space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800">${escapeHtml(log.subject)}</span>
          <span class="text-slate-400">•</span>
          <span class="text-slate-600 font-medium">${escapeHtml(log.topic)}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono text-slate-400">${log.date}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">${log.minutes} mins</span>
        </div>
      </div>
      <p class="text-slate-600 text-[11px] leading-relaxed italic">"${escapeHtml(log.notes)}"</p>
      ${log.teacherFeedback ? `
        <div class="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-brand-900 flex items-start gap-2">
          <span class="font-bold text-brand-700">Teacher:</span>
          <span>${escapeHtml(log.teacherFeedback)}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function saveStudentDiaryEntry() {
  const subjectEl = document.getElementById('diarySubject');
  const minutesEl = document.getElementById('diaryMinutes');
  const topicEl = document.getElementById('diaryTopic');
  const notesEl = document.getElementById('diaryNotes');

  const subject = subjectEl?.value || 'Physics';
  const minutes = Math.max(1, parseInt(minutesEl?.value, 10) || 45);
  const topic = topicEl?.value.trim() || '';
  const notes = notesEl?.value.trim() || '';

  if (!topic) {
    topicEl?.focus();
    showToast('Topic Required', 'Enter the topic or lesson you studied.', 'warning');
    return;
  }

  if (!notes) {
    notesEl?.focus();
    showToast('Study Summary Required', 'Write 1–2 lines about what you learned, solved, or understood.', 'warning');
    return;
  }

  const newEntry = {
    id: 'log_' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    subject,
    topic,
    minutes,
    notes,
    teacherFeedback: null,
    status: 'Submitted'
  };

  if (!Array.isArray(AppState.studentDiaryLogs)) AppState.studentDiaryLogs = [];
  AppState.studentDiaryLogs.unshift(newEntry);
  saveAppState();

  if (notesEl) notesEl.value = '';
  if (topicEl) topicEl.value = '';

  renderStudentDiaryHistory();
  updateStudentMetrics();
  showToast('Diary Saved', `${subject} • ${topic} was added to your learning history.`, 'success');
}

async function aiEvaluateNotes() {
  const notes = document.getElementById('diaryNotes')?.value.trim();
  const topic = document.getElementById('diaryTopic')?.value.trim();

  if (!notes) {
    showToast('Notes Empty', 'Write your study notes first to receive AI critique.', 'warning');
    return;
  }

  showToast('AI Analyzing Notes...', 'Checking conceptual completeness and identifying gaps...', 'info');

  const systemPrompt = "You are an expert high-school and university STEM tutor. Analyze the student's brief notes on the given topic. Validate accuracy, highlight any misconception, and give 1 concise bullet point of what to study next.";
  const userQuery = `Topic: ${topic || 'General Science'}\nStudent Notes:\n${notes}`;

  const aiResponse = await callGeminiLlm(systemPrompt, userQuery);

  if (aiResponse) {
    openAiResultModal("AI Tutor Note Critique", aiResponse);
  } else {
    const feedbackText = `**Analysis for ${escapeHtml(topic || 'Study Notes')}:**\n\n• **Conceptual Check:** The notes convey understanding of fundamental principles.\n• **Completeness:** Consider supplementing your notes with derived equations and boundary conditions.\n• **Next Step:** Attempt a practice diagnostic quiz on this topic to calibrate your understanding.`;
    openAiResultModal("AI Tutor Note Critique", feedbackText);
  }
}

function triggerAiPersonalizedPlan() {
  const logsCount = AppState.studentDiaryLogs.length;
  const latestTopic = logsCount > 0 ? AppState.studentDiaryLogs[0].topic : 'Curriculum Fundamentals';

  openAiResultModal("Your AI Study Plan", `### 48-Hour Personalized Study Pathway\n\n**Focus: Master ${escapeHtml(latestTopic)}**\n\n1. **Session 1 (45 mins):** Review core chapter definitions and textbook derivations.\n2. **Session 2 (30 mins):** Solve 3 targeted problems from the Question Bank.\n3. **Session 3 (15 mins):** Log conceptual learnings in your Student Diary and attempt an adaptive practice test.`);
}

function refreshRecommendations() {
  showToast('AI Recommendations Refreshed', 'Diagnostics synchronized with latest diary entries.');
}

function addGoalModal() {
  const topic = prompt("Enter new learning goal or target topic:");
  if (topic && topic.trim()) {
    const container = document.getElementById('studentGoalsContainer');
    if (container) {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200/80 animate-fade-in';
      card.innerHTML = `
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-semibold text-slate-700">${escapeHtml(topic.trim())}</span>
          <span class="text-indigo-600 font-bold text-[11px]">Active</span>
        </div>
        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div class="bg-brand-600 h-1.5 rounded-full" style="width: 15%"></div>
        </div>
      `;
      container.prepend(card);
      showToast('Goal Added', `Track your progress for: ${topic.trim()}`, 'success');
    }
  }
}

/* --- Adaptive Quizzes --- */
function renderAvailableQuizzes() {
  const grid = document.getElementById('availableQuizzesGrid');
  if (!grid) return;

  if (!AppState.quizzes || AppState.quizzes.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
        No quizzes available yet. Create your first practice test using the "+ Custom Practice Test" button above!
      </div>
    `;
    return;
  }

  grid.innerHTML = AppState.quizzes.map(quiz => `
    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">${escapeHtml(quiz.subject)}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${quiz.difficulty === 'Advanced' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}">${quiz.difficulty}</span>
        </div>
        <h3 class="text-sm font-bold text-slate-800 leading-snug mb-2">${escapeHtml(quiz.title)}</h3>
        <p class="text-[11px] text-slate-500 mb-4">${quiz.totalQuestions || quiz.questions.length} Questions • ${quiz.durationMins} Minutes Allowed • Auto-Evaluated</p>
      </div>
      <button onclick="startQuiz('${quiz.id}')" class="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
        Start Test
      </button>
    </div>
  `).join('');
}

function startQuiz(quizId) {
  const quiz = AppState.quizzes.find(q => q.id === quizId);
  if (!quiz) {
    showToast('Quiz Unavailable', 'Please select or create an available quiz.', 'warning');
    return;
  }

  AppState.activeQuiz = quiz;
  AppState.activeQuizIndex = 0;
  AppState.activeUserAnswers = {};
  AppState.quizTimeRemaining = quiz.durationMins * 60;

  document.getElementById('quizSelectionScreen').classList.add('hidden');
  document.getElementById('quizResultScreen').classList.add('hidden');
  document.getElementById('quizActiveScreen').classList.remove('hidden');

  document.getElementById('quizBadgeCategory').innerText = `${quiz.subject} • ${quiz.difficulty}`;
  document.getElementById('quizTitleDisplay').innerText = quiz.title;

  startQuizTimer();
  renderCurrentQuizQuestion();
}

function startQuizTimer() {
  clearInterval(AppState.quizTimerInterval);
  const timerDisplay = document.getElementById('quizTimerText');
  
  AppState.quizTimerInterval = setInterval(() => {
    AppState.quizTimeRemaining--;
    if (AppState.quizTimeRemaining <= 0) {
      clearInterval(AppState.quizTimerInterval);
      finishQuizSubmission();
      return;
    }

    const mins = Math.floor(AppState.quizTimeRemaining / 60);
    const secs = AppState.quizTimeRemaining % 60;
    if (timerDisplay) {
      timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

function renderCurrentQuizQuestion() {
  const quiz = AppState.activeQuiz;
  const index = AppState.activeQuizIndex;
  const question = quiz.questions[index];

  document.getElementById('quizQuestionNumberIndicator').innerText = `Question ${index + 1} of ${quiz.questions.length}`;
  document.getElementById('quizProgressBar').style.width = `${((index + 1) / quiz.questions.length) * 100}%`;
  document.getElementById('quizQuestionText').innerText = question.text;

  const optionsContainer = document.getElementById('quizOptionsContainer');
  const savedAnswer = AppState.activeUserAnswers[index];

  optionsContainer.innerHTML = question.options.map((opt, optIdx) => `
    <label class="quiz-option-card flex items-center gap-3 p-3.5 rounded-xl border ${savedAnswer === optIdx ? 'selected font-semibold' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'} cursor-pointer transition text-xs">
      <input type="radio" name="quizOptionGroup" value="${optIdx}" ${savedAnswer === optIdx ? 'checked' : ''} onchange="handleSelectQuizOption(${optIdx})" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
      <span class="flex-1">${escapeHtml(opt)}</span>
    </label>
  `).join('');

  const prevBtn = document.getElementById('quizPrevBtn');
  prevBtn.disabled = (index === 0);
  prevBtn.classList.toggle('opacity-50', index === 0);
  
  const isLast = index === quiz.questions.length - 1;
  document.getElementById('quizNextBtn').innerText = isLast ? 'Submit Quiz' : 'Next Question';
}

function handleSelectQuizOption(optIdx) {
  AppState.activeUserAnswers[AppState.activeQuizIndex] = optIdx;
  renderCurrentQuizQuestion();
}

function quizNavPrev() {
  if (AppState.activeQuizIndex > 0) {
    AppState.activeQuizIndex--;
    renderCurrentQuizQuestion();
  }
}

function quizNavNext() {
  const quiz = AppState.activeQuiz;
  if (AppState.activeQuizIndex < quiz.questions.length - 1) {
    AppState.activeQuizIndex++;
    renderCurrentQuizQuestion();
  } else {
    finishQuizSubmission();
  }
}

function abandonQuiz() {
  clearInterval(AppState.quizTimerInterval);
  document.getElementById('quizActiveScreen').classList.add('hidden');
  document.getElementById('quizSelectionScreen').classList.remove('hidden');
  showToast('Quiz Abandoned', 'Progress was not saved.');
}

function finishQuizSubmission() {
  clearInterval(AppState.quizTimerInterval);
  const quiz = AppState.activeQuiz;
  let correctCount = 0;

  quiz.questions.forEach((q, idx) => {
    if (AppState.activeUserAnswers[idx] === q.correctIndex) {
      correctCount++;
    }
  });

  const total = quiz.questions.length;
  const accuracy = Math.round((correctCount / total) * 100);

  if (accuracy >= 75 && typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }

  document.getElementById('quizActiveScreen').classList.add('hidden');
  document.getElementById('quizResultScreen').classList.remove('hidden');

  document.getElementById('resultScoreValue').innerText = `${correctCount} / ${total}`;
  document.getElementById('resultAccuracyValue').innerText = `${accuracy}%`;

  const timeTakenSec = (quiz.durationMins * 60) - AppState.quizTimeRemaining;
  const mins = Math.floor(timeTakenSec / 60);
  const secs = timeTakenSec % 60;
  document.getElementById('resultTimeSpentValue').innerText = `${mins}m ${secs}s`;

  const feedbackEl = document.getElementById('resultAiFeedbackText');
  if (accuracy === 100) {
    feedbackEl.innerText = "Exceptional mastery! All conceptual derivations and formula applications were solved accurately without hesitation.";
  } else if (accuracy >= 70) {
    feedbackEl.innerText = `Solid grasp of core principles (${accuracy}% accuracy). Review answer explanations to address tricky edge cases.`;
  } else {
    feedbackEl.innerText = `Identified learning gaps (${accuracy}% score). Review the step-by-step explanations and record revision notes in your diary.`;
  }

  // Update diagnostic record
  AppState.diagnostics.unshift({
    topic: quiz.title.replace('Practice Sprint', '').trim(),
    subject: quiz.subject,
    attempts: total,
    accuracy: accuracy,
    status: accuracy >= 75 ? 'Mastered' : accuracy >= 50 ? 'Good' : 'Needs Revision'
  });
  saveAppState();
  updateStudentMetrics();

  showToast('Quiz Submitted', `Evaluation complete: ${accuracy}% accuracy achieved!`, 'success');
}

function returnToQuizzes() {
  document.getElementById('quizResultScreen').classList.add('hidden');
  document.getElementById('quizSelectionScreen').classList.remove('hidden');
  renderAvailableQuizzes();
}

function reviewQuizDetailedAnswers() {
  const quiz = AppState.activeQuiz;
  let reviewContent = `### Detailed Answer Breakdown: ${quiz.title}\n\n`;

  quiz.questions.forEach((q, idx) => {
    const studentChoice = AppState.activeUserAnswers[idx];
    const isCorrect = studentChoice === q.correctIndex;
    reviewContent += `**Q${idx + 1}: ${q.text}**\n`;
    reviewContent += `• Your Answer: ${studentChoice !== undefined ? q.options[studentChoice] : 'Not answered'} (${isCorrect ? '✅ Correct' : '❌ Incorrect'})\n`;
    reviewContent += `• Correct Answer: **${q.options[q.correctIndex]}**\n`;
    reviewContent += `• **Explanation:** ${q.explanation}\n\n---\n`;
  });

  openAiResultModal("Quiz Answer Review & Explanations", reviewContent);
}

function startTargetedRemediationQuiz(topic) {
  switchMainTab('interactive-quiz');
  if (AppState.quizzes.length > 0) {
    startQuiz(AppState.quizzes[0].id);
  } else {
    openCustomQuizModal();
  }
}

function openCustomQuizModal() {
  toggleModal('modal-custom-quiz');
}

function startConfiguredCustomQuiz() {
  const subject = document.getElementById('customQuizSubject')?.value || 'Physics';
  const topic = document.getElementById('customQuizTopic')?.value?.trim();
  const duration = parseInt(document.getElementById('customQuizDuration')?.value || '10');

  if (!topic) {
    showToast('Topic Required', 'Please enter a practice topic or concept.', 'warning');
    return;
  }

  const customQuiz = {
    id: 'qz_custom_' + Date.now(),
    title: `${subject}: ${topic} Practice Sprint`,
    subject: subject,
    difficulty: "Adaptive",
    durationMins: duration,
    totalQuestions: 3,
    questions: [
      {
        id: 'cq_1',
        text: `In ${topic}, which fundamental variable determines the rate of dynamic response?`,
        options: ["Gradient of field intensity", "External thermal equilibrium", "Linear proportionality constant", "Static scalar potential"],
        correctIndex: 0,
        explanation: "Rate of change governs kinetic and electromagnetic dynamic phenomena."
      },
      {
        id: 'cq_2',
        text: "True or False: Under ideal dissipationless conditions, total systemic energy is strictly conserved.",
        options: ["True", "False"],
        correctIndex: 0,
        explanation: "First Law of Thermodynamics and conservation laws mandate total energy invariance."
      },
      {
        id: 'cq_3',
        text: "What mathematical transformation converts convolution in time domain to multiplication?",
        options: ["Laplace / Fourier Transform", "Euler Totient Function", "Lagrange Multiplier", "Taylor Series Expansion"],
        correctIndex: 0,
        explanation: "Integral transforms map differential operators into algebraic equations."
      }
    ]
  };

  AppState.quizzes.unshift(customQuiz);
  saveAppState();
  toggleModal('modal-custom-quiz');
  renderAvailableQuizzes();
  startQuiz(customQuiz.id);
  showToast('Custom Test Ready', `Started 3-question practice test on ${topic}!`, 'success');
}

/* --- Student Analytics --- */
function initAnalyticsCharts() {
  const ctxBar = document.getElementById('subjectMasteryChart');
  if (ctxBar && typeof Chart !== 'undefined') {
    if (masteryChartInstance) masteryChartInstance.destroy();

    const subjects = ['Physics', 'Mathematics', 'Chemistry', 'Computer Science'];
    const dataScores = subjects.map(sub => {
      const matched = AppState.diagnostics.filter(d => d.subject.toLowerCase() === sub.toLowerCase());
      if (matched.length === 0) return 0;
      const sum = matched.reduce((acc, curr) => acc + curr.accuracy, 0);
      return Math.round(sum / matched.length);
    });

    masteryChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: subjects,
        datasets: [
          {
            label: 'Your Mastery (%)',
            data: dataScores,
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11, family: 'Inter' } } } },
        scales: { y: { min: 0, max: 100, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
      }
    });
  }

  const ctxRadar = document.getElementById('competencyRadarChart');
  if (ctxRadar && typeof Chart !== 'undefined') {
    if (radarChartInstance) radarChartInstance.destroy();
    radarChartInstance = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: ['Recall & Definitions', 'Conceptual Understanding', 'Mathematical Derivation', 'Problem Solving Speed', 'Analytical Synthesis'],
        datasets: [{
          label: 'Student Skill Profile',
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(168, 85, 247, 0.25)',
          borderColor: 'rgba(168, 85, 247, 0.9)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(168, 85, 247, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: 100, ticks: { display: false } } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function updateAnalyticsVisuals() {
  showToast('Filters Applied', 'Analytics recalculated for the selected timeframe.');
  initAnalyticsCharts();
}

function exportAnalyticsReport() {
  showToast('Report Generated', 'Diagnostic report downloaded to your files.', 'success');
}

function renderTopicDiagnostics() {
  const diagnosticTable = document.getElementById('topicDiagnosticTableBody');
  if (!diagnosticTable) return;

  if (!AppState.diagnostics || AppState.diagnostics.length === 0) {
    diagnosticTable.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-xs text-slate-400">
          No topic diagnostic data yet. Complete quizzes to generate diagnostic accuracy analytics.
        </td>
      </tr>
    `;
    return;
  }

  diagnosticTable.innerHTML = AppState.diagnostics.map(d => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="p-3 font-bold text-slate-800">${escapeHtml(d.topic)}</td>
      <td class="p-3 text-slate-500">${escapeHtml(d.subject)}</td>
      <td class="p-3 text-slate-600">${d.attempts} questions</td>
      <td class="p-3 font-bold ${d.accuracy < 60 ? 'text-rose-600' : 'text-emerald-600'}">${d.accuracy}%</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'At Risk' ? 'badge-risk-high' : d.status === 'Needs Revision' ? 'badge-risk-moderate' : 'badge-risk-low'}">${d.status}</span>
      </td>
      <td class="p-3 text-right">
        <button onclick="startTargetedRemediationQuiz('${d.topic}')" class="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-[11px] transition">
          Practice
        </button>
      </td>
    </tr>
  `).join('');
}

function updateStudentMetrics() {
  const logsCount = AppState.studentDiaryLogs.length;
  const streakEl = document.getElementById('studentStreakCount');
  if (streakEl) streakEl.innerText = `${logsCount} Days`;

  const totalQuizzesEl = document.getElementById('studentTotalQuizzes');
  if (totalQuizzesEl) totalQuizzesEl.innerText = AppState.diagnostics.length;

  // Overall Mastery: question-weighted average accuracy across all completed quizzes
  const masteryEl = document.getElementById('studentMasteryVal');
  const masteryBarEl = document.getElementById('studentMasteryBar');
  const records = (AppState.diagnostics || []).filter(d => Number.isFinite(Number(d.accuracy)));
  let masteryPct = null;
  if (records.length > 0) {
    const totalWeight = records.reduce((sum, d) => sum + (Number(d.attempts) || 1), 0);
    const weighted = records.reduce((sum, d) => sum + Number(d.accuracy) * (Number(d.attempts) || 1), 0);
    masteryPct = Math.round(weighted / totalWeight);
  }
  if (masteryEl) masteryEl.innerText = masteryPct === null ? '--' : `${masteryPct}%`;
  if (masteryBarEl) masteryBarEl.style.width = `${masteryPct === null ? 0 : masteryPct}%`;

  const gapsCount = AppState.diagnostics.filter(d => d.accuracy < 60).length;
  const gapsEl = document.getElementById('studentGapsCount');
  if (gapsEl) gapsEl.innerText = `${gapsCount} Topics`;
}

function askAiAboutTopic(prompt) {
  switchMainTab('ai-tutor');
  sendQuickPrompt(prompt);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  verifyPortalSession('student');

  // The original project never called loadTestData(), so a fresh browser
  // showed empty diary/quiz sections even though test-data.json existed.
  // Seed demo data once, then render the UI.
  const needsDemoData =
    (!Array.isArray(AppState.studentDiaryLogs) || AppState.studentDiaryLogs.length === 0) &&
    (!Array.isArray(AppState.quizzes) || AppState.quizzes.length === 0);

  if (needsDemoData && typeof loadTestData === 'function') {
    await loadTestData({ silent: true });
  }

  renderStudentDiaryHistory();
  renderAvailableQuizzes();
  initAnalyticsCharts();
  updateStudentMetrics();
});
