// ============================================================
// ui.js — Interaksi visual (tidak mengubah logika data)
// ============================================================

(function () {
    'use strict';

    // ----------------------------------------------------------
    // 1. SAPAAN PERSONAL — berubah sesuai jam
    // ----------------------------------------------------------
    const heroGreeting = document.getElementById('heroGreeting');
    if (heroGreeting) {
        const hour = new Date().getHours();
        let greeting = 'Selamat datang';
        if (hour >= 4 && hour < 11)  greeting = 'Selamat pagi';
        else if (hour >= 11 && hour < 15) greeting = 'Selamat siang';
        else if (hour >= 15 && hour < 18) greeting = 'Selamat sore';
        else if (hour >= 18 || hour < 4)  greeting = 'Selamat malam';
        heroGreeting.textContent = greeting;
    }

    // ----------------------------------------------------------
    // 2. COUNT-UP untuk stat number
    // ----------------------------------------------------------
    function animateCountUp(el, target, duration = 1000) {
        if (!el || isNaN(target)) return;
        const start = performance.now();

        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(target * eased);
            el.textContent = value;
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = target;
        }
        requestAnimationFrame(frame);
    }

    const statIds = ['statPertemuan', 'statJam', 'statSudah', 'statBelum'];
    const seen = new Set();

    const statsObserver = new MutationObserver(() => {
        statIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el || seen.has(id)) return;
            const raw = el.textContent.trim();
            const num = parseFloat(raw.replace(/[^0-9.-]/g, ''));
            if (!isNaN(num) && raw !== '-') {
                seen.add(id);
                animateCountUp(el, num, 1100);
            }
        });

        // Setelah stat terisi, aktifkan garis vertikal
        const grid = document.getElementById('statsGrid');
        if (grid && !grid.classList.contains('loaded')) {
            const jam = document.getElementById('statJam');
            if (jam && jam.textContent.trim() !== '-') {
                grid.classList.add('loaded');

                // Update hero status
                const heroStatus = document.getElementById('heroStatus');
                const belum = document.getElementById('statBelum');
                if (heroStatus && belum) {
                    const n = belum.textContent.trim();
                    heroStatus.innerHTML = n === '0' || n === '-'
                        ? 'Semua sesi Anda telah terverifikasi. Kerja bagus.'
                        : `Anda memiliki <strong>${n}</strong> sesi yang menunggu verifikasi.`;
                }
            }
        }
    });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsObserver.observe(statsGrid, { subtree: true, childList: true, characterData: true });
    }

    // ----------------------------------------------------------
    // 3. STAGGER REVEAL untuk row tabel
    // ----------------------------------------------------------
    function applyStagger(tbody) {
        if (!tbody || tbody.dataset.staggered) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            if (i > 20) return;
            row.style.opacity = '0';
            row.style.transform = 'translateY(4px)';
            row.style.transition = `opacity 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 22}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 22}ms`;
            requestAnimationFrame(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        });
        tbody.dataset.staggered = '1';
    }

    ['tableSemua', 'tableReguler', 'tableClub', 'tableBody'].forEach(id => {
        const tbody = document.getElementById(id);
        if (!tbody) return;
        const obs = new MutationObserver(() => {
            if (tbody.querySelectorAll('tr').length > 1 ||
                (tbody.querySelector('tr') && !tbody.querySelector('tr').classList.contains('loading'))) {
                applyStagger(tbody);
                obs.disconnect();
            }
        });
        obs.observe(tbody, { childList: true });
    });

})();
