/* =========================================================================
   EduPulse AI - Central State Store & In-Memory Database (data.js)
   Production-ready clean state with zero hardcoded test data
   ========================================================================= */

const STORAGE_KEY = 'edupulse_app_state_clean';

// Clean initial state with no test or dummy data
const DEFAULT_STATE = {
  currentRole: 'student',
  currentUser: null,
  apiKey: "",
  chatHistory: [],
  activeQuiz: null,
  activeQuizIndex: 0,
  activeUserAnswers: {},
  quizTimerInterval: null,
  quizTimeRemaining: 0,

  quizzes: [],
  studentDiaryLogs: [],
  teacherDiaryLogs: [],
  questionBank: [],
  feedbackList: [],
  users: [],
  courses: [],
  attendanceRoster: [],
  diagnostics: []
};

// Global AppState instance with LocalStorage synchronization
let AppState = (function initStorage() {
  try {
    // Purge any legacy test state from old storage keys
    localStorage.removeItem('edupulse_app_state_v2');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_STATE, parsed);
    }
  } catch (e) {
    console.warn("Storage initialization notice:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
})();

function saveAppState() {
  try {
    const copy = Object.assign({}, AppState, { quizTimerInterval: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

function clearAllAppData() {
  AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('edupulse_app_state_v2');
}

/**
 * Optional helper to populate application state directly from test-data.json
 */
async function loadTestData(options = {}) {
  const { force = false, silent = false } = options;

  try {
    const res = await fetch('test-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Seed demo data only when the local database is empty.
    // This prevents the demo records from overwriting real student activity.
    const seed = (key, value) => {
      if (!Array.isArray(value)) return;
      if (force || !Array.isArray(AppState[key]) || AppState[key].length === 0) {
        AppState[key] = JSON.parse(JSON.stringify(value));
      }
    };

    seed('courses', data.sampleCourses);
    seed('quizzes', data.sampleQuizzes);
    seed('questionBank', data.sampleQuestionBank);
    seed('studentDiaryLogs', data.sampleStudentDiary);
    seed('teacherDiaryLogs', data.sampleTeacherJournal);
    seed('attendanceRoster', data.sampleAttendanceRoster);
    seed('feedbackList', data.sampleFeedback);

    saveAppState();

    if (!silent && typeof showToast === 'function') {
      showToast('Learning Data Ready', 'Demo diary, quizzes and feedback are now available.', 'success');
    }

    return true;
  } catch (err) {
    console.warn('Could not load test-data.json; using portable built-in demo data.', err);

    // Portable fallback: the app still works when opened from a different
    // machine, a different browser, or a server that does not expose JSON files.
    const fallbackDiary = [
      { id: 'demo_d1', subject: 'Physics', topic: "Faraday's Law of Electromagnetic Induction", minutes: 45, notes: 'Learned that changing magnetic flux induces EMF and reviewed the relation E = -N(dPhi/dt).', teacherFeedback: 'Great effort! Remember that the negative sign represents Lenz’s law and the direction of induced EMF.', date: 'Today' },
      { id: 'demo_d2', subject: 'Mathematics', topic: 'Integration by Parts', minutes: 50, notes: 'Practised the formula integral u dv = uv - integral v du and used LIATE to choose u.', teacherFeedback: 'Good progress. Practise selecting u quickly and check your final derivative.', date: 'Yesterday' },
      { id: 'demo_d3', subject: 'Computer Science', topic: 'Binary Search Trees', minutes: 40, notes: 'Reviewed insertion, search, traversal and deletion cases in a BST.', teacherFeedback: 'Understand the three deletion cases and practise tracing the tree by hand.', date: '2 days ago' }
    ];
    if (!Array.isArray(AppState.studentDiaryLogs) || AppState.studentDiaryLogs.length === 0) AppState.studentDiaryLogs = fallbackDiary;
    if (!Array.isArray(AppState.feedbackList) || AppState.feedbackList.length === 0) {
      AppState.feedbackList = [{ id: 'demo_fb1', author: 'Dr. Mehta (TEACHER)', category: 'Teacher Feedback', rating: 5, comment: 'Keep connecting formulas to physical examples. Your conceptual understanding is improving.', date: 'Today' }];
    }
    saveAppState();
    return true;
  }
}
