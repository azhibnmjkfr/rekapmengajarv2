// ============================================================
// ui.js — Interaksi visual (tidak mengubah logika data)
// - Sapaan personal (jam)
// - Count-up stat
// - Scroll reveal (IntersectionObserver)
// - Bottom nav sync + indikator
// - Top bar transparan → solid saat scroll
// - Mobile back ke beranda
// ============================================================

(function () {
    'use strict';

    /* ========================================================
       1. THEME COLOR — meta theme-color
       ======================================================== */
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#FBF8F1');

    /* ========================================================
       2. SAPAAN PERSONAL
       ======================================================== */
    const heroGreeting = document.getElementById('heroGreeting');
    if (heroGreeting) {
        const hour = new Date().getHours();
        let greeting = 'Selamat datang,';
        if (hour >= 4 && hour < 11)       greeting = 'Selamat pagi,';
        else if (hour >= 11 && hour < 15) greeting = 'Selamat siang,';
        else if (hour >= 15 && hour < 18) greeting = 'Selamat sore,';
        else if (hour >= 18 || hour < 4)  greeting = 'Selamat malam,';
        heroGreeting.textContent = greeting;
    }

    /* ========================================================
       3. MOBILE STATE — view = home | tab
       ======================================================== */
    const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

    function setView(view) {
        if (!isMobile()) return;
        document.body.dataset.view = view;

        const backBtn = document.getElementById('mobileBack');
        if (backBtn) backBtn.classList.toggle('visible', view === 'tab');
    }

    // Default: home (mobile only)
    if (isMobile()) setView('home');

    /* ========================================================
       4. COUNT-UP — stat number
       ======================================================== */
    function animateCountUp(el, target, duration = 1100) {
        if (!el || isNaN(target)) return;
        const start = performance.now();
        const initial = 0;

        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(initial + (target - initial) * eased);
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

        // Update hero status setelah stat terisi
        const belum = document.getElementById('statBelum');
        const heroStatus = document.getElementById('heroStatus');
        if (belum && heroStatus && belum.textContent.trim() !== '-') {
            const n = belum.textContent.trim();
            if (n === '0') {
                heroStatus.innerHTML = 'Semua sesi Anda telah terverifikasi.';
            } else {
                heroStatus.innerHTML = `<strong>${n}</strong> sesi menunggu verifikasi.`;
            }
        }
    });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsObserver.observe(statsGrid, { subtree: true, childList: true, characterData: true });
    }

    /* ========================================================
       5. SCROLL REVEAL — IntersectionObserver
       ======================================================== */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        if (isMobile()) revealObserver.observe(el);
    });

    // Statistik grid juga reveal
    if (statsGrid && isMobile()) {
        statsGrid.classList.add('reveal');
        revealObserver.observe(statsGrid);
    }

    /* ========================================================
       6. STAGGER REVEAL — baris tabel
       ======================================================== */
    function applyStagger(tbody) {
        if (!tbody || tbody.dataset.staggered) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            if (i > 20) return;
            row.style.opacity = '0';
            row.style.transform = 'translateY(8px)';
            row.style.transition = `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 30}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 30}ms`;
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

    /* ========================================================
       7. TOP BAR — transparan di hero, solid saat scroll
       ======================================================== */
    const header = document.getElementById('headerHome');
    const scrollHint = document.getElementById('scrollHint');
    let lastScrollY = 0;

    function handleScroll() {
        const y = window.scrollY || window.pageYOffset;

        if (header) {
            if (y > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        if (scrollHint) {
            if (y > 80) {
                scrollHint.classList.add('hidden');
            } else {
                scrollHint.classList.remove('hidden');
            }
        }

        lastScrollY = y;
    }

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                handleScroll();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    handleScroll(); // initial

    /* ========================================================
       8. BOTTOM NAV — sync dengan switchTab + indikator
       ======================================================== */
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavBtns = mobileNav ? mobileNav.querySelectorAll('.mobile-nav-btn') : [];
    const mobileNavIndicator = document.getElementById('mobileNavIndicator');
    const mobileNavIcon = document.getElementById('mobileNavIcon');

    const TAB_ICONS = {
        semua:   'grid',
        reguler: 'clock',
        club:    'users',
        rekap:   'bar-chart-2'
    };

    function positionIndicator(tabName) {
        if (!mobileNav || !mobileNavIndicator) return;
        const btns = Array.from(mobileNavBtns);
        const idx = btns.findIndex(b => b.dataset.tab === tabName);
        if (idx === -1) return;

        const btn = btns[idx];
        const rect = btn.getBoundingClientRect();
        const navRect = mobileNav.getBoundingClientRect();
        const centerX = rect.left - navRect.left + rect.width / 2;
        const indicatorWidth = mobileNavIndicator.offsetWidth || 56;

        mobileNavIndicator.style.transform = `translateX(${centerX - indicatorWidth / 2}px)`;
        mobileNavIndicator.style.left = '0';

        // Update icon di indikator
        if (mobileNavIcon && TAB_ICONS[tabName]) {
            mobileNavIcon.setAttribute('data-lucide', TAB_ICONS[tabName]);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    function updateNavActive(tabName) {
        mobileNavBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        positionIndicator(tabName);
    }

    // Klik bottom nav → trigger switchTab (fungsi dari script.js)
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            // Jika tab aktif dan view = tab, kembali ke beranda
            if (document.body.dataset.view === 'tab' && 
                document.querySelector(`.nav-tabs button[data-tab="${tab}"]`).classList.contains('active')) {
                goHome();
                return;
            }

            // Trigger switchTab dari script.js
            const desktopBtn = document.querySelector(`.nav-tabs button[data-tab="${tab}"]`);
            if (desktopBtn) desktopBtn.click();

            setView('tab');
            updateNavActive(tab);

            // Scroll ke atas smooth
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Sync ketika user klik tab di desktop (jarang, tapi untuk safety)
    const navTabs = document.getElementById('navTabs');
    if (navTabs) {
        navTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-tab]');
            if (btn) {
                if (isMobile()) {
                    setView('tab');
                    updateNavActive(btn.dataset.tab);
                }
            }
        });
    }

    // Tombol back mobile
    const mobileBack = document.getElementById('mobileBack');
    function goHome() {
        setView('home');
        updateNavActive('semua');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (mobileBack) {
        mobileBack.addEventListener('click', goHome);
    }

    // Initial indicator position
    if (isMobile()) {
        setTimeout(() => updateNavActive('semua'), 100);
        window.addEventListener('resize', () => positionIndicator(
            document.querySelector('.mobile-nav-btn.active')?.dataset.tab || 'semua'
        ));
    }

    /* ========================================================
       9. RESIZE HANDLER — jika user rotate / resize
       ======================================================== */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (isMobile()) {
                if (!document.body.dataset.view) setView('home');
                positionIndicator(
                    document.querySelector('.mobile-nav-btn.active')?.dataset.tab || 'semua'
                );
            } else {
                document.body.removeAttribute('data-view');
            }
        }, 200);
    });

})();
