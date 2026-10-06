/* =========================================================================
   EduPulse AI - Admin Portal Logic (admin.js)
   Handles institutional dashboards, user access control, curriculum management,
   and system policy configurations
   ========================================================================= */

let adminTrendChartInstance = null;
let adminAiChartInstance = null;

function switchMainTab(tabId) {
  AppState.currentTab = tabId;

  document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));

  const target = document.getElementById(`view-${tabId}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('animate-fade-in');
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50 transition";
    } else {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition";
    }
  });

  if (tabId === 'admin-dashboard') {
    updateAdminKPIs();
    initAdminCharts();
  } else if (tabId === 'admin-users') {
    renderAdminUsersTable();
  } else if (tabId === 'admin-courses') {
    renderAdminCoursesGrid();
  } else if (tabId === 'feedback-module') {
    renderFeedbackList();
    renderFeedbackSynthesisCard();
  }
}

/* --- Admin Dynamic KPIs --- */
function updateAdminKPIs() {
  const students = AppState.users ? AppState.users.filter(u => u.role === 'Student').length : 0;
  const teachers = AppState.users ? AppState.users.filter(u => u.role === 'Teacher').length : 0;
  const quizzes = AppState.quizzes ? AppState.quizzes.length : 0;
  const llmCount = (AppState.questionBank?.length || 0) + (AppState.quizzes?.length || 0) + (AppState.studentDiaryLogs?.length || 0);

  const elStudents = document.getElementById('adminStudentCount');
  const elTeachers = document.getElementById('adminTeacherCount');
  const elQuizzes = document.getElementById('adminQuizCount');
  const elLlm = document.getElementById('adminLlmCount');

  if (elStudents) elStudents.textContent = students.toLocaleString();
  if (elTeachers) elTeachers.textContent = teachers.toLocaleString();
  if (elQuizzes) elQuizzes.textContent = quizzes.toLocaleString();
  if (elLlm) elLlm.textContent = llmCount.toLocaleString();
}

/* --- Admin Charts --- */
function initAdminCharts() {
  const ctxTrend = document.getElementById('adminPlatformTrendChart');
  if (ctxTrend && typeof Chart !== 'undefined') {
    if (adminTrendChartInstance) adminTrendChartInstance.destroy();

    const quizCount = AppState.quizzes ? AppState.quizzes.length : 0;
    const trendData = [0, 0, 0, 0, quizCount];

    adminTrendChartInstance = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [{
          label: 'Quizzes Attempted',
          data: trendData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          y: { 
            beginAtZero: true, 
            ticks: { font: { size: 10 }, precision: 0 } 
          }, 
          x: { ticks: { font: { size: 10 } } } 
        }
      }
    });
  }

  const ctxAi = document.getElementById('adminAiUsageChart');
  if (ctxAi && typeof Chart !== 'undefined') {
    if (adminAiChartInstance) adminAiChartInstance.destroy();

    const quizCount = AppState.quizzes ? AppState.quizzes.length : 0;
    const diaryCount = AppState.studentDiaryLogs ? AppState.studentDiaryLogs.length : 0;
    const feedbackCount = AppState.feedbackList ? AppState.feedbackList.length : 0;
    const questionCount = AppState.questionBank ? AppState.questionBank.length : 0;
    
    const hasData = (quizCount + diaryCount + feedbackCount + questionCount) > 0;
    const aiData = hasData ? [quizCount, diaryCount, feedbackCount, questionCount] : [0, 0, 0, 0];

    adminAiChartInstance = new Chart(ctxAi, {
      type: 'doughnut',
      data: {
        labels: ['Quiz Invocations', 'Diary Reflections', 'Feedback Submissions', 'Teacher Question Bank'],
        datasets: [{
          data: hasData ? aiData : [1],
          backgroundColor: hasData ? ['#6366f1', '#a855f7', '#10b981', '#f59e0b'] : ['#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (!hasData) return ' No platform activity recorded yet';
                return ` ${context.label}: ${context.raw}`;
              }
            }
          }
        }
      }
    });
  }
}

/* --- User Access Control --- */
function renderAdminUsersTable() {
  const usersTable = document.getElementById('adminUsersTableBody');
  if (!usersTable) return;

  if (!AppState.users || AppState.users.length === 0) {
    usersTable.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400">
          No registered users yet. Click "+ Add New User" above to create users.
        </td>
      </tr>
    `;
    return;
  }

  usersTable.innerHTML = AppState.users.map(u => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="p-3 font-mono text-[11px] text-slate-400">${u.id}</td>
      <td class="p-3 font-bold text-slate-800">${escapeHtml(u.name)}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'Admin' ? 'role-badge-admin' : u.role === 'Teacher' ? 'role-badge-teacher' : 'role-badge-student'}">${u.role}</span>
      </td>
      <td class="p-3 text-slate-500">${escapeHtml(u.email)}</td>
      <td class="p-3">
        <span class="text-emerald-600 font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${u.status}</span>
      </td>
      <td class="p-3 text-slate-400 text-[11px]">${u.lastActive}</td>
      <td class="p-3 text-right">
        <button onclick="deleteUser('${u.id}')" class="text-rose-600 hover:text-rose-800 text-[11px] font-semibold">Remove</button>
      </td>
    </tr>
  `).join('');
}

function handleSaveNewUser() {
  const name = document.getElementById('newUserName')?.value?.trim();
  const email = document.getElementById('newUserEmail')?.value?.trim();
  const role = document.getElementById('newUserRole')?.value || 'Student';

  if (!name || !email) {
    showToast('Incomplete User Form', 'Please provide a name and email address.', 'warning');
    return;
  }

  const prefix = role === 'Admin' ? 'usr_adm_' : role === 'Teacher' ? 'usr_tch_' : 'usr_std_';
  AppState.users.unshift({
    id: prefix + Math.floor(100 + Math.random() * 900),
    name,
    email,
    role,
    status: 'Active',
    lastActive: 'Just now'
  });

  saveAppState();
  toggleModal('modal-add-user');
  renderAdminUsersTable();
  updateAdminKPIs();
  initAdminCharts();
  showToast('User Created', `Added ${name} with ${role} permissions.`, 'success');
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to deactivate and remove this user?')) {
    AppState.users = AppState.users.filter(u => u.id !== userId);
    saveAppState();
    renderAdminUsersTable();
    updateAdminKPIs();
    initAdminCharts();
    showToast('User Removed', 'User access permissions revoked.');
  }
}

/* --- Course & Curriculum Catalog --- */
function renderAdminCoursesGrid() {
  const coursesGrid = document.getElementById('adminCoursesGrid');
  if (!coursesGrid) return;

  if (!AppState.courses || AppState.courses.length === 0) {
    coursesGrid.innerHTML = `
      <div class="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <p class="font-bold text-sm text-slate-600">No courses in catalog yet</p>
        <p class="text-xs text-slate-400 mt-1">Click "+ Create New Course" to add courses and curricula.</p>
      </div>
    `;
    return;
  }

  coursesGrid.innerHTML = AppState.courses.map((c, idx) => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">${escapeHtml(c.code)}</span>
          <button onclick="deleteCourse(${idx})" class="text-slate-400 hover:text-rose-600 text-xs">✕</button>
        </div>
        <h4 class="text-sm font-bold text-slate-900 mt-2">${escapeHtml(c.title)}</h4>
        <p class="text-xs text-slate-500 mt-1">${c.students || 0} Students Enrolled • ${c.modules || 0} Modules</p>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-400">Class Progress</span>
        <span class="font-bold text-brand-700">${c.completion || '0%'}</span>
      </div>
    </div>
  `).join('');
}

function handleSaveNewCourse() {
  const title = document.getElementById('courseTitle')?.value?.trim();
  const code = document.getElementById('courseCode')?.value?.trim();
  const students = parseInt(document.getElementById('courseStudents')?.value || '0') || 0;
  const modules = parseInt(document.getElementById('courseModules')?.value || '0') || 0;

  if (!title || !code) {
    showToast('Course Incomplete', 'Provide course name and code.', 'warning');
    return;
  }

  AppState.courses.unshift({
    title,
    code,
    students,
    modules,
    completion: '0%'
  });

  saveAppState();
  toggleModal('modal-add-course');
  renderAdminCoursesGrid();
  showToast('Course Created', `${title} (${code}) added to academic catalog!`, 'success');
}

function deleteCourse(idx) {
  if (confirm('Delete this course curriculum record?')) {
    AppState.courses.splice(idx, 1);
    saveAppState();
    renderAdminCoursesGrid();
    showToast('Course Deleted', 'Course removed from catalog.');
  }
}

/* --- Feedback Synthesis Card --- */
function renderFeedbackSynthesisCard() {
  const card = document.getElementById('aiFeedbackSynthesisCard');
  if (!card) return;

  if (!AppState.feedbackList || AppState.feedbackList.length === 0) {
    card.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-slate-700">
        <span class="w-2 h-2 rounded-full bg-slate-400"></span> Feedback Status
      </div>
      <p class="text-[11px] leading-relaxed text-slate-500">
        No institutional feedback submitted yet. Submissions will be synthesized by Gemini AI here.
      </p>
    `;
    return;
  }

  const count = AppState.feedbackList.length;
  const avg = (AppState.feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / count).toFixed(1);
  card.innerHTML = `
    <div class="flex items-center gap-2 font-bold text-purple-900">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Positive Highlights
    </div>
    <p class="text-[11px] leading-relaxed">
      ${count} submission(s) recorded with an average rating of ${avg} / 5.0.
    </p>
    <div class="flex items-center gap-2 font-bold text-amber-800 pt-2 border-t border-purple-100">
      <span class="w-2 h-2 rounded-full bg-amber-500"></span> Latest Note
    </div>
    <p class="text-[11px] leading-relaxed">
      "${escapeHtml(AppState.feedbackList[0].comment)}"
    </p>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  verifyPortalSession('admin');
  updateAdminKPIs();
  initAdminCharts();
  renderAdminUsersTable();
  renderAdminCoursesGrid();
  renderFeedbackSynthesisCard();
});
