// ============================================================
// ui.js — Interaksi visual (tidak mengubah logika data)
// - Count-up number stat card
// - Theme toggle (dark/light) dengan localStorage
// - Smooth stagger reveal tabel
// ============================================================

(function () {
    'use strict';

    // ----------------------------------------------------------
    // 1. THEME — restore dari localStorage
    // ----------------------------------------------------------
    const THEME_KEY = 'siaq_theme';
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
    }

    // ----------------------------------------------------------
    // 2. COUNT-UP untuk stat number
    // ----------------------------------------------------------
    function animateCountUp(el, target, duration = 900) {
        if (!el || isNaN(target)) return;
        const start = performance.now();
        const initial = 0;

        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(initial + (target - initial) * eased);
            el.textContent = value;
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = target;
        }
        requestAnimationFrame(frame);
    }

    // Amati perubahan stat card, jalankan count-up saat pertama terisi
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
                animateCountUp(el, num, 900);
            }
        });
    });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsObserver.observe(statsGrid, { subtree: true, childList: true, characterData: true });
    }

    // ----------------------------------------------------------
    // 3. STAGGER REVEAL untuk row tabel (hanya saat pertama)
    // ----------------------------------------------------------
    function applyStagger(tbody) {
        if (!tbody || tbody.dataset.staggered) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            if (i > 20) return; // batasi biar tidak berat
            row.style.opacity = '0';
            row.style.transform = 'translateY(6px)';
            row.style.transition = `opacity 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 25}ms, transform 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 25}ms`;
            requestAnimationFrame(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        });
        tbody.dataset.staggered = '1';
    }

    // Amati tbody tabel — jalankan stagger saat konten pertama muncul
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

    // ----------------------------------------------------------
    // 4. THEME TOGGLE (kalau mau nanti tinggal tambah tombol)
    //    Contoh pakai: klik 3x pada footer → toggle
    // ----------------------------------------------------------
    const footer = document.querySelector('.footer-credit');
    let clickCount = 0;
    let clickTimer = null;
    if (footer) {
        footer.style.cursor = 'pointer';
        footer.title = 'Klik 3x untuk ganti tema';
        footer.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 600);
            if (clickCount >= 3) {
                const cur = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = cur === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem(THEME_KEY, next);
                clickCount = 0;
            }
        });
    }

})();