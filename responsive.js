/* ═══════════════════════════════════════════════════════════
   ECAP — Shared Responsive Behaviour
   Strategy: viewport meta forces 1100px desktop width so the
   page is always zoomed-out on mobile. Zoom buttons (+/−)
   let users zoom back in to interact with content.
═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    // ── Wait for DOM ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // ── 1. Inject floating zoom controls ────────────────
        const zoomWrap = document.createElement('div');
        zoomWrap.className = 'zoom-controls';
        zoomWrap.innerHTML =
            '<button class="zoom-btn zoom-in-btn"  title="Zoom In (Ctrl +)"  aria-label="Zoom In">+</button>'  +
            '<button class="zoom-reset-btn"         title="Reset Zoom (Ctrl 0)" aria-label="Reset Zoom">100%</button>' +
            '<button class="zoom-btn zoom-out-btn" title="Zoom Out (Ctrl −)" aria-label="Zoom Out">&minus;</button>';
        document.body.appendChild(zoomWrap);

        const ZOOM_STEP = 10;
        const ZOOM_MIN  = 50;
        const ZOOM_MAX  = 200;
        const resetBtn  = zoomWrap.querySelector('.zoom-reset-btn');

        // Start at 100% — the viewport width=1100 meta does the initial scale-down
        let zoomLevel = 100;

        function applyZoom() {
            document.body.style.zoom = zoomLevel + '%';
            resetBtn.textContent = zoomLevel + '%';
            // Counter-scale the controls so they stay same physical size
            zoomWrap.style.zoom = (10000 / zoomLevel) + '%';
        }

        zoomWrap.querySelector('.zoom-in-btn').addEventListener('click', function () {
            if (zoomLevel < ZOOM_MAX) { zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); applyZoom(); }
        });
        zoomWrap.querySelector('.zoom-out-btn').addEventListener('click', function () {
            if (zoomLevel > ZOOM_MIN) { zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); applyZoom(); }
        });
        resetBtn.addEventListener('click', function () {
            zoomLevel = 100; applyZoom();
        });

        // Keyboard shortcuts: Ctrl + / Ctrl − / Ctrl 0
        document.addEventListener('keydown', function (e) {
            if (!e.ctrlKey) return;
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                if (zoomLevel < ZOOM_MAX) { zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); applyZoom(); }
            } else if (e.key === '-') {
                e.preventDefault();
                if (zoomLevel > ZOOM_MIN) { zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); applyZoom(); }
            } else if (e.key === '0') {
                e.preventDefault();
                zoomLevel = 100; applyZoom();
            }
        });

        // ── 2. Hamburger sidebar toggle ──────────────────────
        const hamburger = document.getElementById('hamburgerBtn');
        const sidebar   = document.querySelector('.sidebar-menu');

        if (!hamburger || !sidebar) return;

        // Create overlay element once
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
        }
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }

        hamburger.addEventListener('click', function () {
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        });

        // Close when clicking overlay
        overlay.addEventListener('click', closeSidebar);

        // Close sidebar when a menu item is clicked (on mobile)
        sidebar.querySelectorAll('.menu-item').forEach(function (item) {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 768) closeSidebar();
            });
        });

        // Close on resize to desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) closeSidebar();
        });
    });
})();
