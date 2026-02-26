// ═══════════════════════════════════════════════════════════
//  api.js  —  Shared ECAP Frontend ↔ Backend API Helper
//  Include this script BEFORE any page's inline <script>
// ═══════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:3000/api';

// ── Token management ──────────────────────────────────────
const Auth = {
    setToken : (token) => localStorage.setItem('ecap_token', token),
    getToken : ()      => localStorage.getItem('ecap_token'),
    setUser  : (u)     => localStorage.setItem('ecap_user',  JSON.stringify(u)),
    getUser  : ()      => { try { return JSON.parse(localStorage.getItem('ecap_user')); } catch { return null; } },
    clear    : ()      => { localStorage.removeItem('ecap_token'); localStorage.removeItem('ecap_user'); }
};

// ── Core fetch wrapper ────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API_BASE + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = data.error || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
}

// ── Auth helpers ──────────────────────────────────────────
const ApiAuth = {
    adminLogin  : (username, password)      => apiFetch('/auth/admin/login',   { method:'POST', body: JSON.stringify({ username, password }) }),
    facultyLogin: (facultyId, password)     => apiFetch('/auth/faculty/login', { method:'POST', body: JSON.stringify({ facultyId, password }) }),
    studentLogin: (rollNumber, password)    => apiFetch('/auth/student/login', { method:'POST', body: JSON.stringify({ rollNumber, password }) }),
    seedAdmin   : ()                         => apiFetch('/auth/seed-admin',    { method:'POST' }),
    changePassword: (currentPassword, newPassword) => apiFetch('/auth/change-password', { method:'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
};

// ── Student helpers ───────────────────────────────────────
const ApiStudents = {
    list       : (params = {})     => apiFetch('/students?' + new URLSearchParams(params)),
    count      : ()                => apiFetch('/students/count'),
    nextRoll   : (dept)            => apiFetch(`/students/next-roll/${dept}`),
    byClass    : (dept, section)   => apiFetch('/students/by-class?' + new URLSearchParams({ dept, section })),
    get        : (roll)            => apiFetch(`/students/${roll}`),
    add        : (data)            => apiFetch('/students',               { method:'POST',   body: JSON.stringify(data) }),
    updateProfile: (roll, data)    => apiFetch(`/students/${roll}/profile`,{ method:'PUT',    body: JSON.stringify(data) }),
    remove     : (roll)            => apiFetch(`/students/${roll}`,       { method:'DELETE' })
};

// ── Faculty helpers ───────────────────────────────────────
const ApiFaculty = {
    list       : (params = {})     => apiFetch('/faculty?' + new URLSearchParams(params)),
    count      : ()                => apiFetch('/faculty/count'),
    nextId     : ()                => apiFetch('/faculty/next-id'),    byDept     : (dept)            => apiFetch('/faculty/by-dept?dept=' + encodeURIComponent(dept)),    get        : (fid)             => apiFetch(`/faculty/${fid}`),
    add        : (data)            => apiFetch('/faculty',                { method:'POST',   body: JSON.stringify(data) }),
    updateProfile: (fid, data)     => apiFetch(`/faculty/${fid}/profile`, { method:'PUT',    body: JSON.stringify(data) }),
    remove     : (fid)             => apiFetch(`/faculty/${fid}`,         { method:'DELETE' })
};

// ── Fee helpers ───────────────────────────────────────────
const ApiFee = {
    list      : ()     => apiFetch('/fee-payments'),
    submit    : (data) => apiFetch('/fee-payments', { method:'POST', body: JSON.stringify(data) })
};

// ── Marks helpers ─────────────────────────────────────────
const ApiMarks = {
    list  : (params = {}) => apiFetch('/marks?' + new URLSearchParams(params)),
    upload: (data)        => apiFetch('/marks', { method:'POST', body: JSON.stringify(data) })
};

// ── Attendance helpers ────────────────────────────────────
const ApiAttendance = {
    list   : (params = {}) => apiFetch('/attendance?' + new URLSearchParams(params)),
    summary: (roll)        => apiFetch(`/attendance/summary/${roll}`),
    submit : (data)        => apiFetch('/attendance', { method:'POST', body: JSON.stringify(data) })
};
