// Duplicate marquee text for seamless scrolling
window.addEventListener('DOMContentLoaded', function() {
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        const originalText = marqueeContent.innerHTML;
        marqueeContent.innerHTML = originalText + originalText + originalText;
    }

    // Load and update dashboard statistics
    updateDashboardStats();
});

// Update dashboard statistics
function updateDashboardStats() {
    // Define faculty members and their usernames
    const facultyList = ['faculty']; // Add more faculty usernames here if needed

    let totalFaculty = facultyList.length;
    let completedCount = 0;
    let pendingCount = 0;

    // Check each faculty member's profile
    facultyList.forEach(username => {
        const profile = localStorage.getItem('facultyProfile');

        if (profile) {
            try {
                const data = JSON.parse(profile);
                // Check if personal details are filled in
                if (data.personal && data.personal.name && data.personal.name !== '-') {
                    completedCount++;
                } else {
                    pendingCount++;
                }
            } catch (e) {
                pendingCount++;
            }
        } else {
            pendingCount++;
        }
    });

    // Update the card numbers
    const totalEl = document.getElementById('totalFacultyCount');
    const completedEl = document.getElementById('completedCount');
    const pendingEl = document.getElementById('pendingCount');

    if (totalEl) totalEl.textContent = totalFaculty;
    if (completedEl) completedEl.textContent = completedCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
}

// Menu item click handlers
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        // Remove active class from all items
        document.querySelectorAll('.menu-item').forEach(mi => {
            mi.classList.remove('active');
        });
        // Add active class to clicked item
        this.classList.add('active');

        const section = this.getAttribute('data-section');
        console.log('Menu clicked:', section);

        // Show the appropriate section
        showSection(section);
    });
});

// Show section based on menu selection
function showSection(sectionName) {
    // Preserve current scroll position to avoid any jump
    const currentY = window.scrollY;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Restore scroll position immediately (no smooth behavior)
    window.scrollTo(0, currentY);

    // Update dashboard stats when dashboard is shown
    if (sectionName === 'dashboard') {
        updateDashboardStats();
        startAutoScroll(1, 20);
    } else {
        stopAutoScroll();
    }
}

// Update content area based on menu selection
function updateContent(menuItem) {
    const contentArea = document.querySelector('.content-area');
    const placeholder = contentArea.querySelector('.content-placeholder');
    
    if (placeholder) {
        placeholder.innerHTML = `
            <i class="bi bi-gear-fill"></i>
            <p>Loading ${menuItem}...</p>
        `;
        
        // Simulate loading
        setTimeout(() => {
            placeholder.innerHTML = `
                <i class="bi bi-info-circle"></i>
                <p>${menuItem} section - Content to be implemented</p>
            `;
        }, 500);
    }
}

// Search functionality
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

searchBtn?.addEventListener('click', function() {
    performSearch();
});

searchInput?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm === '') {
        alert('Please enter a search term');
        return;
    }
    
    console.log('Searching for:', searchTerm);
    
    // Show loading state
    searchBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Searching...';
    searchBtn.disabled = true;
    
    // Simulate search process
    setTimeout(() => {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="search-results">
                <h4 class="mb-3"><i class="bi bi-search"></i> Search Results for "${searchTerm}"</h4>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill"></i> Search functionality to be implemented with backend integration.
                </div>
                <p class="text-muted">Results will appear here once the search feature is connected to the database.</p>
            </div>
        `;
        
        // Reset button
        searchBtn.innerHTML = '<i class="bi bi-search"></i> Submit';
        searchBtn.disabled = false;
    }, 1000);
}

// Password link handlers
document.querySelectorAll('.password-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const action = this.textContent.trim();

        // Allow logout to proceed to the target page
        if (action.includes('Logout')) {
            // Use href if present, otherwise fall back to index
            const target = this.getAttribute('href') || 'index.html';
            window.location.href = target;
            return;
        }

        // Prevent navigation for other password actions
        e.preventDefault();
        if (action.includes('Forget')) {
            alert('Forget Password: Please contact the system administrator to reset your password.');
        } else if (action.includes('Change')) {
            alert('Change Password: Feature to be implemented - will open password change dialog.');
        }
    });
});

// Card hover animations
// Removed - hover effect disabled
/*
document.querySelectorAll('.stats-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});
*/

// Animate cards on page load
window.addEventListener('load', function() {
    const cards = document.querySelectorAll('.stats-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
});

// Print current stats
function printStats() {
    window.print();
}

// Export stats data (placeholder)
function exportStats() {
    const stats = {
        total: 150,
        completed: 120,
        pending: 25,
        notEntered: 5,
        timestamp: new Date().toISOString()
    };
    
    console.log('Exporting stats:', stats);
    alert('Export functionality to be implemented. Data will be exported as CSV/Excel.');
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
    }
});

console.log('Principal Dashboard loaded successfully');

// -------- Faculty Search Functionality ---------
const searchFacultyBtn = document.getElementById('searchFacultyBtn');
const facultySearchInput = document.getElementById('facultySearch');
const facultyProfileDisplay = document.getElementById('facultyProfileDisplay');
const noResultsMessage = document.getElementById('noResultsMessage');
const closeFacultyProfile = document.getElementById('closeFacultyProfile');

// Search faculty by username
function searchFacultyProfile() {
    const username = facultySearchInput?.value.trim().toLowerCase();
    
    if (!username) {
        alert('Please enter a username to search');
        return;
    }
    
    // Try multiple localStorage keys to find the faculty profile
    // First try with the username as-is, then try 'facultyProfile' as fallback
    let facultyProfile = localStorage.getItem(username + 'Profile') || 
                        localStorage.getItem('facultyProfile_' + username) ||
                        (username === 'faculty' ? localStorage.getItem('facultyProfile') : null);
    
    if (facultyProfile) {
        try {
            const profileData = JSON.parse(facultyProfile);
            displayFacultyProfile(profileData, username);
            facultyProfileDisplay.style.display = 'block';
            noResultsMessage.style.display = 'none';
        } catch (e) {
            console.error('Error parsing faculty profile:', e);
            noResultsMessage.style.display = 'block';
            facultyProfileDisplay.style.display = 'none';
        }
    } else {
        // Profile not found - show the searched username in the message
        const searchedUsernameEl = document.getElementById('searchedUsername');
        if (searchedUsernameEl) {
            searchedUsernameEl.textContent = username;
        }
        noResultsMessage.style.display = 'block';
        facultyProfileDisplay.style.display = 'none';
    }
}

// Display faculty profile
function displayFacultyProfile(data, username) {
    // Display username if provided
    const usernameDisplay = document.getElementById('facultyUsername');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = `(${username})`;
    }
    
    // Personal Details
    document.getElementById('facultyProfileName').textContent = data.personal?.name || '-';
    document.getElementById('facultyProfileGender').textContent = data.personal?.gender || '-';
    document.getElementById('facultyProfileDOB').textContent = data.personal?.dob || '-';
    
    // Qualifications
    const qualTable = document.getElementById('facultyQualificationsTable').querySelector('tbody');
    qualTable.innerHTML = '';
    
    if (Array.isArray(data.qualifications) && data.qualifications.length) {
        data.qualifications.forEach((item, index) => {
            const row = document.createElement('tr');
            const fileCell = item.fileData ? `
                <button class="btn btn-sm btn-primary me-1" onclick="viewFile('${item.fileData}', '${item.fileName}')">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-success" onclick="downloadFile('${item.fileData}', '${item.fileName}')">
                    <i class="bi bi-download"></i> Download
                </button>
            ` : '-';
            
            row.innerHTML = `
                <td>${item.qualification || '-'}</td>
                <td>${item.fromYear || '-'}</td>
                <td>${item.toYear || '-'}</td>
                <td>${item.certType || '-'}</td>
                <td>${fileCell}</td>
            `;
            qualTable.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">No qualifications added</td>';
        qualTable.appendChild(row);
    }
    
    // Experience
    const expTable = document.getElementById('facultyExperienceTable').querySelector('tbody');
    expTable.innerHTML = '';
    
    if (Array.isArray(data.experience) && data.experience.length) {
        data.experience.forEach((item, index) => {
            const row = document.createElement('tr');
            const fileCell = item.fileData ? `
                <button class="btn btn-sm btn-primary me-1" onclick="viewFile('${item.fileData}', '${item.fileName}')">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-success" onclick="downloadFile('${item.fileData}', '${item.fileName}')">
                    <i class="bi bi-download"></i> Download
                </button>
            ` : '-';
            
            row.innerHTML = `
                <td>${item.college || '-'}</td>
                <td>${item.designation || '-'}</td>
                <td>${item.fromYear || '-'}</td>
                <td>${item.toYear || '-'}</td>
                <td>${fileCell}</td>
            `;
            expTable.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">No experience added</td>';
        expTable.appendChild(row);
    }
}

// Event listeners for faculty search
searchFacultyBtn?.addEventListener('click', searchFacultyProfile);

facultySearchInput?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchFacultyProfile();
    }
});

closeFacultyProfile?.addEventListener('click', function() {
    facultyProfileDisplay.style.display = 'none';
    noResultsMessage.style.display = 'none';
    facultySearchInput.value = '';
});

// View file function
function viewFile(fileData, fileName) {
    if (!fileData) return;
    
    // Open file in new tab
    const newWindow = window.open();
    if (newWindow) {
        // For images and PDFs, embed directly
        if (fileData.includes('image') || fileData.includes('pdf')) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${fileName}</title>
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                        img { max-width: 100%; height: auto; }
                        embed { width: 100vw; height: 100vh; }
                    </style>
                </head>
                <body>
                    ${fileData.includes('pdf') ? 
                        `<embed src="${fileData}" type="application/pdf" />` : 
                        `<img src="${fileData}" alt="${fileName}" />`
                    }
                </body>
                </html>
            `);
        } else {
            // For other file types, trigger download
            newWindow.location.href = fileData;
        }
    }
}

// Download file function
function downloadFile(fileData, fileName) {
    if (!fileData) return;
    
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make functions globally accessible
window.viewFile = viewFile;
window.downloadFile = downloadFile;

// -------- Auto Scroll (dashboard section only) ---------
let autoScrollTimer = null;

function startAutoScroll(speed = 1, intervalMs = 20) {
    stopAutoScroll();
    autoScrollTimer = setInterval(() => {
        window.scrollBy(0, speed);
        // Stop when we reach the bottom
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
            stopAutoScroll();
        }
    }, intervalMs);
}

function stopAutoScroll() {
    if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
    }
}
