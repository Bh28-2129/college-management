// ── Faculty / Employee Login ─────────────────────────────────────────────────
document.getElementById('employeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('emp-username').value.trim();
    const password = document.getElementById('emp-password').value.trim();

    if (!username || !password) { alert('Please fill in all fields'); return; }

    const loginBtn = this.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'LOGGING IN...';
    loginBtn.disabled = true;

    const errEl = document.getElementById('facultyError');
    errEl.style.display = 'none';

    try {
        const res = await ApiAuth.facultyLogin(username, password);
        Auth.setToken(res.token);
        Auth.setUser({ role: res.role, facultyId: res.facultyId, name: res.name, department: res.department });
        window.location.href = 'faculty.html';
    } catch (err) {
        errEl.textContent = (err.message === 'Invalid Faculty ID or password')
            ? 'Invalid Faculty ID or password. Your password is your registered mobile number.'
            : (err.message || 'Login failed. Please try again.');
        errEl.style.display = 'block';
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
});

// ── Student Login ────────────────────────────────────────────────────────────
document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('stu-username').value.trim();
    const password = document.getElementById('stu-password').value.trim();

    if (!username || !password) { alert('Please fill in all fields'); return; }

    const loginBtn = this.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'LOGGING IN...';
    loginBtn.disabled = true;

    const errEl = document.getElementById('studentError');
    errEl.style.display = 'none';

    try {
        const res = await ApiAuth.studentLogin(username, password);
        Auth.setToken(res.token);
        Auth.setUser({ role: res.role, rollNumber: res.rollNumber, name: res.name });
        window.location.href = 'student.html';
    } catch (err) {
        errEl.textContent = (err.message === 'Invalid roll number or password')
            ? 'Roll number not found or wrong password. Use the roll number assigned by admin. Password = your mobile number.'
            : (err.message || 'Login failed. Please try again.');
        errEl.style.display = 'block';
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
});

// ── Admin Login ──────────────────────────────────────────────────────────────
document.getElementById('adminForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('adm-username').value.trim();
    const password = document.getElementById('adm-password').value.trim();
    const errEl    = document.getElementById('adminError');

    errEl.style.display = 'none';

    if (!username || !password) {
        errEl.textContent = 'Please fill in all fields.';
        errEl.style.display = 'block';
        return;
    }

    const loginBtn  = this.querySelector('.login-btn');
    const origText  = loginBtn.textContent;
    loginBtn.textContent = 'LOGGING IN...';
    loginBtn.disabled    = true;

    try {
        const res = await ApiAuth.adminLogin(username, password);
        Auth.setToken(res.token);
        Auth.setUser({ role: res.role, username: res.username });
        window.location.href = 'admin.html';
    } catch (err) {
        errEl.textContent    = err.message || 'Invalid admin credentials.';
        errEl.style.display  = 'block';
        loginBtn.textContent = origText;
        loginBtn.disabled    = false;
    }
});

// Add input focus animation
const inputs = document.querySelectorAll('.form-control');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
        this.parentElement.style.transition = 'transform 0.3s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Duplicate marquee text for seamless scrolling
window.addEventListener('DOMContentLoaded', function() {
    const marqueeContent = document.querySelector('.marquee-content');
    const originalText = marqueeContent.innerHTML;
    marqueeContent.innerHTML = originalText + originalText + originalText;
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';
