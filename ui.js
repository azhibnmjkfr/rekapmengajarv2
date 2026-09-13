(function () {
    'use strict';

    const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

    /* 1. SAPAAN */
    const heroGreeting = document.getElementById('heroGreeting');
    if (heroGreeting) {
        const hour = new Date().getHours();
        let greeting = 'Selamat datang,';
        if (hour >= 4 && hour < 11)       greeting = 'Selamat pagi,';
        else if (hour >= 11 && hour < 15) greeting = 'Selamat siang,';
        else if (hour >= 15 && hour < 18) greeting = 'Selamat sore,';
        else                              greeting = 'Selamat malam,';
        heroGreeting.textContent = greeting;
    }

    /* 2. STATE */
    function setView(view) {
        if (!isMobile()) return;
        document.body.dataset.view = view;
    }
    if (isMobile()) setView('home');

    /* 3. COUNT-UP */
    function animateCountUp(el, target, duration = 1100) {
        if (!el || isNaN(target)) return;
        const start = performance.now();
        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);
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

        const belum = document.getElementById('statBelum');
        const heroStatus = document.getElementById('heroStatus');
        if (belum && heroStatus && belum.textContent.trim() !== '-') {
            const n = belum.textContent.trim();
            if (n === '0') {
                heroStatus.innerHTML = 'Semua sesi sudah terverifikasi.';
            } else {
                heroStatus.innerHTML = `<strong>${n}</strong> sesi menunggu verifikasi.`;
            }
        }
    });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsObserver.observe(statsGrid, { subtree: true, childList: true, characterData: true });
    }

    /* 4. STAGGER + INJECT data-hari ke tabel */
    function injectDataHari(tbody) {
        if (!tbody) return;
        tbody.querySelectorAll('tr.row-clickable').forEach(row => {
            // Ambil hari dari kolom ke-2 (index 1)
            const hariCell = row.children[1];
            if (hariCell && !row.dataset.hari) {
                const hari = hariCell.textContent.trim();
                if (hari && hari !== '-') {
                    row.dataset.hari = hari;
                }
            }
        });
    }

    function applyStagger(tbody) {
        if (!tbody || tbody.dataset.staggered) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            if (i > 20) return;
            row.style.opacity = '0';
            row.style.transform = 'translateY(6px)';
            row.style.transition = `opacity 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 25}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 25}ms`;
            requestAnimationFrame(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        });
        tbody.dataset.staggered = '1';
    }

    ['tableSemua', 'tableReguler', 'tableClub'].forEach(id => {
        const tbody = document.getElementById(id);
        if (!tbody) return;
        const obs = new MutationObserver(() => {
            if (tbody.querySelectorAll('tr.row-clickable').length > 0) {
                injectDataHari(tbody);
                applyStagger(tbody);
                obs.disconnect();
            }
        });
        obs.observe(tbody, { childList: true });
    });

    /* 5. BOTTOM NAV */
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavBtns = mobileNav ? mobileNav.querySelectorAll('.mobile-nav-btn') : [];

    function activateNav(navKey) {
        mobileNavBtns.forEach(b => b.classList.toggle('active', b.dataset.nav === navKey));
    }

    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const nav = btn.dataset.nav;

            if (nav === 'home') {
                setView('home');
                activateNav('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const desktopBtn = document.querySelector(`.nav-tabs button[data-tab="${nav}"]`);
            if (desktopBtn) desktopBtn.click();

            setView('tab');
            activateNav(nav);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Re-inject data-hari setelah tabel di-render
            setTimeout(() => {
                ['tableSemua', 'tableReguler', 'tableClub'].forEach(id => {
                    const tbody = document.getElementById(id);
                    if (tbody) injectDataHari(tbody);
                });
            }, 100);
        });
    });

    /* 6. RESIZE */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isMobile()) {
                document.body.removeAttribute('data-view');
            }
        }, 200);
    });

})();
