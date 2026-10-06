/* =========================================================================
   EduPulse AI - Authentication Controller (auth.js)
   Simple Username & Password Authentication with Role-Based Dashboard Routing
   ========================================================================= */

// Role account profiles for Student, Teacher, and Admin
const ROLE_ACCOUNTS = {
  student: {
    id: 'usr_student_01',
    name: 'Aarav Patel',
    role: 'Student',
    targetRole: 'student',
    class: 'Grade 12 - STEM',
    avatar: 'AP',
    email: 'student@school.edu',
    status: 'Active',
    lastActive: 'Just now'
  },
  teacher: {
    id: 'usr_teacher_01',
    name: 'Prof. Rajesh Sharma',
    role: 'Teacher',
    targetRole: 'teacher',
    class: 'Senior Physics Faculty',
    avatar: 'RS',
    email: 'teacher@school.edu',
    status: 'Active',
    lastActive: 'Just now'
  },
  admin: {
    id: 'usr_admin_01',
    name: 'Dr. Sunita Sen',
    role: 'Admin',
    targetRole: 'admin',
    class: 'Executive Administrator',
    avatar: 'SS',
    email: 'admin@school.edu',
    status: 'Active',
    lastActive: 'Just now'
  }
};

/**
 * Handle form login submission:
 * Checks whether username is 'student', 'teacher', or 'admin', and navigates to that particular dashboard.
 */
function handleLogin(event) {
  if (event) event.preventDefault();

  const userInput = document.getElementById('username') || document.getElementById('loginEmail');
  const passInput = document.getElementById('password') || document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn') || document.getElementById('unifiedSubmitBtn');

  // Clear any existing error
  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.innerHTML = '';
  }

  const rawUser = userInput ? userInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (!rawUser || !password) {
    showLoginError('Please enter both your username and password.');
    if (!rawUser && userInput) userInput.focus();
    else if (passInput) passInput.focus();
    return;
  }

  const u = rawUser.toLowerCase();

  // Check whether the username is student, teacher, or admin
  let role = null;
  if (u === 'student' || u.startsWith('student') || u.includes('student@')) {
    role = 'student';
  } else if (u === 'teacher' || u.startsWith('teacher') || u.includes('teacher@')) {
    role = 'teacher';
  } else if (u === 'admin' || u.startsWith('admin') || u.includes('admin@')) {
    role = 'admin';
  }

  // If username is not student, teacher, or admin
  if (!role) {
    showLoginError("Invalid username. Please enter 'student', 'teacher', or 'admin' to access your dashboard.");
    if (userInput) userInput.focus();
    return;
  }

  // Get role profile
  const profile = ROLE_ACCOUNTS[role];

  // Set session state
  if (typeof AppState !== 'undefined') {
    AppState.currentRole = role;
    AppState.currentUser = profile;
    if (typeof saveAppState === 'function') {
      saveAppState();
    }
  }

  // Button loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Logging in to ${role.toUpperCase()} Portal...
    `;
  }

  if (typeof showToast === 'function') {
    showToast('Login Successful', `Welcome, ${profile.name}! Navigating to ${role.toUpperCase()} dashboard...`, 'success');
  }

  // Route directly to that particular dashboard
  setTimeout(() => {
    window.location.href = `${role}.html`;
  }, 350);
}

/**
 * Display inline error message on login card
 */
function showLoginError(msg) {
  const errorEl = document.getElementById('loginError');
  if (errorEl) {
    errorEl.innerHTML = `
      <svg class="w-4 h-4 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>${msg}</span>
    `;
    errorEl.classList.remove('hidden');
  }
  if (typeof showToast === 'function') {
    showToast('Access Notice', msg, 'warning');
  }
}

/**
 * Quick-fill helper when clicking a role badge
 */
function fillRole(role) {
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const errorEl = document.getElementById('loginError');

  if (errorEl) errorEl.classList.add('hidden');
  if (userInput) userInput.value = role;
  if (passInput) passInput.value = `${role}123`;
  if (userInput) userInput.focus();

  if (typeof showToast === 'function') {
    showToast('Role Selected', `Entered '${role}' credentials. Click 'Sign In' to proceed.`, 'info');
  }
}

/**
 * Toggle password field visibility
 */
function togglePasswordVisibility() {
  const passInput = document.getElementById('password') || document.getElementById('loginPassword');
  const eyeIcon = document.getElementById('passEyeIcon');
  if (!passInput) return;

  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>`;
    }
  } else {
    passInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <svg class="w-4 h-4 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>`;
    }
  }
}

/**
 * Backward compatibility aliases
 */
function handleUnifiedLogin(e) { handleLogin(e); }
function handleRoleLogin(e, role) {
  if (role) {
    fillRole(role);
  }
  handleLogin(e);
}

/**
 * Verify session on dashboard load; ensure authenticated user profile is rendered
 */
function verifyPortalSession(requiredRole) {
  if (typeof AppState === 'undefined') return;

  // If not logged in or role mismatch, default to clean role user
  if (!AppState.currentUser || AppState.currentRole !== requiredRole) {
    const defaultProfile = ROLE_ACCOUNTS[requiredRole] || {
      id: 'usr_' + requiredRole,
      name: requiredRole === 'student' ? 'Aarav Patel' : requiredRole === 'teacher' ? 'Prof. Rajesh Sharma' : 'Dr. Sunita Sen',
      role: requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1),
      class: requiredRole === 'student' ? 'Grade 12 - STEM' : requiredRole === 'teacher' ? 'Senior Physics Faculty' : 'Executive Administrator',
      avatar: requiredRole === 'student' ? 'AP' : requiredRole === 'teacher' ? 'RS' : 'SS',
      email: `${requiredRole}@school.edu`,
      status: 'Active',
      lastActive: 'Just now'
    };
    AppState.currentRole = requiredRole;
    AppState.currentUser = defaultProfile;
    if (typeof saveAppState === 'function') {
      saveAppState();
    }
  }

  // Update profile avatar & name in topbar
  const avatarEl = document.getElementById('currentUserAvatar');
  const nameEl = document.getElementById('currentUserName');
  const badgeEl = document.getElementById('currentUserRoleBadge');

  if (avatarEl && AppState.currentUser) {
    avatarEl.innerText = AppState.currentUser.avatar || 'EP';
  }
  if (nameEl && AppState.currentUser) {
    nameEl.innerText = AppState.currentUser.name || 'User';
  }
  if (badgeEl && AppState.currentUser) {
    badgeEl.innerText = AppState.currentUser.class || AppState.currentRole.toUpperCase();
  }
}

// Check URL search parameters (e.g., index.html?role=teacher)
document.addEventListener('DOMContentLoaded', () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');
    if (paramRole && ['student', 'teacher', 'admin'].includes(paramRole)) {
      fillRole(paramRole);
    }
  } catch (e) {
    // URLSearchParams error catch
  }
});
