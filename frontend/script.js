/* ========================================
   STAR E-MITRA - Optimized & Consolidated JavaScript
   All features in one DOMContentLoaded with defensive checks
   ======================================== */

// ========== GLOBALLY EXPOSED FUNCTIONS (used in HTML) ==========
async function sendVIPMessage(e) {
    e.preventDefault();
    const vipForm = document.getElementById('vipContactForm');
    if (!vipForm) return;
    const submitBtn = vipForm.querySelector('.submit-btn');
    if (!submitBtn) return;

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const name = document.getElementById('name')?.value || '';
    const mobile = document.getElementById('mobile')?.value || '';
    const service = document.getElementById('service')?.value || '';
    const message = document.getElementById('message')?.value || '';

    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, service, message })
        });
        const data = await res.json();
        if (data.success) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent!',
                    text: 'Aapka message STAR E-Mitra Database me save ho gaya hai.',
                    background: '#0f1326', color: '#fff', confirmButtonColor: '#00f2ff'
                });
            }
            vipForm.reset();
        } else {
            if (typeof Swal !== 'undefined') Swal.fire('Error', 'Server ne data reject kar diya.', 'error');
        }
    } catch (err) {
        console.error(err);
        if (typeof Swal !== 'undefined') Swal.fire('Error', 'Server se connection toot gaya.', 'error');
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

// ========== MAIN INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ---------- Utility helpers ----------
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
    const hasClass = (el, cls) => el && el.classList && el.classList.contains(cls);
    const setAriaHidden = (el, value) => { if (el) el.setAttribute('aria-hidden', String(value)); };
    const setBodyScrollingLocked = (lock) => {
        try {
            document.documentElement.style.overflow = lock ? 'hidden' : '';
            document.body.style.overflow = lock ? 'hidden' : '';
        } catch (e) { /* ignore */ }
    };

    // ---------- Body Scroll Failsafe ----------
    (function bodyScrollFailsafe() {
        setInterval(() => {
            try {
                const isLocked = document.documentElement.style.overflow === 'hidden' || document.body.style.overflow === 'hidden';
                const overlayOpen = !!$('.universal-modal.universal-modal-open, .wa-modal.wa-modal-open, .nav-menu.active');
                if (isLocked && !overlayOpen) {
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                }
            } catch (e) { /* ignore */ }
        }, 1500);
    })();

    // ---------- Navigation (Hamburger & Sticky) ----------
    (function navMenuInit() {
        const hamburger = $('.hamburger');
        const navMenu = $('.nav-menu');
        const navLinks = $$('.nav-link');
        if (!hamburger || !navMenu) return;

        const openNav = () => {
            hamburger.classList.add('active');
            navMenu.classList.add('active');
            setBodyScrollingLocked(true);
        };
        const closeNav = () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            setBodyScrollingLocked(false);
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.contains('active') ? closeNav() : openNav();
        });

        navLinks.forEach(link => link.addEventListener('click', closeNav));

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') &&
                !navMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                closeNav();
            }
        });

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    })();

    (function stickyHeader() {
        const header = $('.header');
        if (!header) return;
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    })();

    // ---------- Scroll Animations (Intersection Observer) ----------
    (function scrollAnimations() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = `fadeInUp 0.7s ease-out forwards`;
                    entry.target.classList.add('in-view');
                    const heroSection = entry.target.closest('section[class*="-hero"], .hero');
                    if (heroSection) heroSection.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        $$('.animate-on-scroll').forEach((el, idx) => {
            const delay = el.dataset.delay || (idx * 0.1);
            el.style.animationDelay = `${delay}s`;
            observer.observe(el);
        });
    })();

    // ---------- Button Ripple (single version) ----------
    (function buttonRipple() {
        if (!$('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `@keyframes ripple-animation { to { transform: scale(4); opacity: 0; } }`;
            document.head.appendChild(style);
        }
        $$('.btn').forEach(btn => {
            btn.style.position = btn.style.position || 'relative';
            btn.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute; left: ${x}px; top: ${y}px;
                    width: 20px; height: 20px; background: rgba(255,255,255,0.5);
                    border-radius: 50%; transform: translate(-50%, -50%);
                    pointer-events: none; animation: ripple-animation 0.6s ease-out;
                `;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 650);
            });
        });
    })();

    // ---------- WhatsApp Group Magnet Modal ----------
    (function waModalInit() {
        const modal = $('#waGroupModal');
        if (!modal) return;
        const backdrop = $('.wa-modal-backdrop', modal);
        const closeBtn = $('#waModalClose');
        const STORAGE_KEY = 'wa_group_popup_closed_at';
        const HIDE_DURATION_MS = 24 * 60 * 60 * 1000;

        const isRecentlyClosed = () => {
            try {
                const ts = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
                return !!ts && (Date.now() - ts < HIDE_DURATION_MS);
            } catch { return false; }
        };

        const showModal = () => {
            modal.classList.add('wa-modal-open');
            modal.setAttribute('aria-hidden', 'false');
            setBodyScrollingLocked(true);
            const focusable = modal.querySelector('a, button');
            if (focusable) focusable.focus();
        };
        const closeModal = () => {
            modal.classList.remove('wa-modal-open');
            modal.setAttribute('aria-hidden', 'true');
            setBodyScrollingLocked(false);
            try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
        };

        const forceShow = modal.dataset.forceShow === 'true';
        if (!forceShow && isRecentlyClosed()) return;

        setTimeout(showModal, 5000);

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    })();

    // ---------- Universal Apply Modal ----------
    (function universalModalInit() {
        const modal = $('#universalModal');
        if (!modal) return;
        const backdrop = modal.querySelector('[data-modal-backdrop]');
        const closeBtns = modal.querySelectorAll('[data-modal-close]');
        const titleEl = modal.querySelector('.u-service-title');
        const priceEl = modal.querySelector('.u-price');
        const docsList = modal.querySelector('.u-docs-list');
        const qtyInput = modal.querySelector('#uQty');
        const qtyInc = modal.querySelector('.u-qty-inc');
        const qtyDec = modal.querySelector('.u-qty-dec');
        const totalEl = modal.querySelector('.u-total');
        const proceedBtn = modal.querySelector('#uProceedBtn');

        let lastFocus = null;
        let _unitPrice = null;
        let _lastPriceString = '';

        const escapeHtml = s => String(s).replace(/[&<>"]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[m] || m);
        const renderDocs = (csv) => {
            if (!docsList) return;
            docsList.innerHTML = '';
            if (!csv) return;
            csv.split(',').map(p => p.trim()).filter(Boolean).forEach(p => {
                const li = document.createElement('li');
                li.className = 'u-doc-item';
                li.innerHTML = `<span class="u-doc-check">✓</span><span class="u-doc-text">${escapeHtml(p)}</span>`;
                docsList.appendChild(li);
            });
        };
        const updateTotal = () => {
            if (!qtyInput || !totalEl) return;
            const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));
            totalEl.textContent = (_unitPrice !== null) ? (Math.round(_unitPrice * qty * 100) / 100).toString() : (_lastPriceString || 'Varies');
        };

        const openModal = (service, docs, price) => {
            lastFocus = document.activeElement;
            if (titleEl) titleEl.textContent = service || 'Service';
            _unitPrice = null;
            _lastPriceString = String(price || '');
            if (price && price !== 'Varies') {
                const numeric = parseFloat(String(price).replace(/[^\d.-]/g, ''));
                if (!isNaN(numeric)) _unitPrice = numeric;
            }
            if (priceEl) priceEl.textContent = (_unitPrice !== null ? _unitPrice : (price || '0'));
            if (qtyInput) qtyInput.value = '1';
            updateTotal();
            renderDocs(docs);
            if (proceedBtn) {
                proceedBtn.dataset.service = service || '';
                proceedBtn.dataset.price = price || '';
                proceedBtn.dataset.docs = docs || '';
            }
            modal.classList.add('universal-modal-open');
            modal.setAttribute('aria-hidden', 'false');
            setBodyScrollingLocked(true);
            if (proceedBtn) proceedBtn.focus();
        };
        const closeModal = () => {
            modal.classList.remove('universal-modal-open');
            modal.setAttribute('aria-hidden', 'true');
            setBodyScrollingLocked(false);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };

        // Delegate click for .apply-btn
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.apply-btn');
            if (!btn) return;
            e.preventDefault();
            const service = btn.dataset.service || btn.getAttribute('data-service') || '';
            const docs = btn.dataset.docs || btn.getAttribute('data-docs') || '';
            const price = btn.dataset.price || btn.getAttribute('data-price') || '';
            openModal(service, docs, price);
        });

        closeBtns.forEach(cb => cb.addEventListener('click', closeModal));
        if (backdrop) backdrop.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        if (qtyInc) qtyInc.addEventListener('click', () => { if (qtyInput) { qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) + 1); updateTotal(); } });
        if (qtyDec) qtyDec.addEventListener('click', () => { if (qtyInput) { qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1); updateTotal(); } });
        if (qtyInput) qtyInput.addEventListener('change', () => { if (parseInt(qtyInput.value, 10) < 1) qtyInput.value = '1'; updateTotal(); });

        if (proceedBtn) {
            proceedBtn.addEventListener('click', function () {
                const service = this.dataset.service || '';
                const price = this.dataset.price || '';
                const docs = this.dataset.docs || '';
                const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1', 10)) : 1;
                const phoneEl = $('.contact-info a[href^="tel:"]');
                let phone = '+917849940660';
                if (phoneEl) phone = phoneEl.getAttribute('href').replace('tel:', '');
                const total = totalEl ? totalEl.textContent : price;
                const msg = `I want to apply for ${service} (Qty: ${qty}) - Unit Price: ${price || 'Varies'}, Total: ₹${total}`;
                window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    })();

    // ---------- Mega List & Details System (Jobs / Admit / Results) ----------
    (function megaListInit() {
        const jobsData = [
            { id: 'raj-cet-grad-2026', title: 'Rajasthan CET (Graduate Level) 2026', startDate: '2026-01-20', lastDate: '2026-02-20', examDate: 'May 2026', fee: { GEN: '600', OBC: '400', SC: '400' }, age: { min: 18, max: 40 }, eligibility: 'Graduation', links: { apply: '#', notification: '#', official: 'https://rsmssb.rajasthan.gov.in' } },
            { id: 'ssc-chsl-2026', title: 'SSC CHSL (10+2) Recruitment 2026', startDate: '2026-01-15', lastDate: '2026-02-15', examDate: 'June 2026', fee: { GEN: '100', OBC: '100', SC: '0' }, age: { min: 18, max: 27 }, eligibility: '12th Pass', links: { apply: 'https://ssc.nic.in', notification: '#', official: 'https://ssc.nic.in' } },
            { id: 'upsc-ias-2026', title: 'UPSC Civil Services (IAS/IPS) 2026', startDate: '2026-02-01', lastDate: '2026-02-24', examDate: '2026-05-31', fee: { GEN: '100', OBC: '100', SC: '0' }, age: { min: 21, max: 32 }, eligibility: 'Any Graduate', links: { apply: '#', notification: '#', official: 'https://upsc.gov.in' } },
            { id: 'raj-hc-clerk-2026', title: 'Rajasthan High Court Clerk 2026', startDate: '2026-01-04', lastDate: '2026-02-05', examDate: 'April 2026', fee: { GEN: '500', OBC: '400', SC: '250' }, age: { min: 18, max: 40 }, eligibility: 'Graduation + Computer', links: { apply: '#', notification: '#', official: 'https://hcraj.nic.in' } },
            { id: 'post-office-gds-2026', title: 'India Post GDS (Jan 2026 Cycle)', startDate: '2026-01-22', lastDate: '2026-02-21', examDate: 'Merit List', fee: { GEN: '100', OBC: '100', SC: '0' }, age: { min: 18, max: 40 }, eligibility: '10th Pass', links: { apply: '#', notification: '#', official: 'https://indiapostgdsonline.gov.in' } },
            { id: 'rbi-assistant-2026', title: 'RBI Assistant Recruitment 2026', startDate: '2026-01-10', lastDate: '2026-01-30', examDate: 'March 2026', fee: { GEN: '450', OBC: '450', SC: '50' }, age: { min: 20, max: 28 }, eligibility: 'Graduate (50%)', links: { apply: '#', notification: '#', official: 'https://rbi.org.in' } },
            { id: 'navy-ssr-012026', title: 'Indian Navy SSR / MR 01/2026', startDate: '2026-01-05', lastDate: '2026-01-25', examDate: 'April 2026', fee: { GEN: '550', OBC: '550', SC: '550' }, age: { min: 17, max: 21 }, eligibility: '12th (Maths/Physics)', links: { apply: '#', notification: '#', official: 'https://joinindiannavy.gov.in' } },
            { id: 'rsmssb-ldc-2026', title: 'RSMSSB LDC / Junior Assistant 2026', startDate: '2025-12-25', lastDate: '2026-01-28', examDate: 'June 2026', fee: { GEN: '450', OBC: '350', SC: '250' }, age: { min: 18, max: 40 }, eligibility: '12th + RSCIT', links: { apply: '#', notification: '#', official: 'https://rsmssb.rajasthan.gov.in' } },
            { id: 'ssc-selection-xiv', title: 'SSC Selection Post Phase XIV', startDate: '2026-02-10', lastDate: '2026-03-12', examDate: 'July 2026', fee: { GEN: '100', OBC: '100', SC: '0' }, age: { min: 18, max: 30 }, eligibility: '10th / 12th / Graduate', links: { apply: '#', notification: '#', official: 'https://ssc.nic.in' } },
            { id: 'ibps-calendar-2026', title: 'IBPS Exam Calendar 2026-27 Out', startDate: 'Notification Only', lastDate: 'Check Dates', examDate: 'Various', fee: { GEN: '850', OBC: '850', SC: '175' }, age: { min: 20, max: 30 }, eligibility: 'Graduate', links: { apply: '#', notification: '#', official: 'https://ibps.in' } },
            { id: 'airforce-agniveer-2026', title: 'Agniveer Vayu Intake 01/2027', startDate: '2026-01-17', lastDate: '2026-02-06', examDate: 'April 2026', fee: { GEN: '250', OBC: '250', SC: '250' }, age: { min: 17.5, max: 21 }, eligibility: '12th (Any Stream)', links: { apply: '#', notification: '#', official: 'https://agnipathvayu.cdac.in' } },
            { id: 'isro-scientist-2026', title: 'ISRO Scientist / Engineer SC', startDate: '2026-01-12', lastDate: '2026-02-10', examDate: 'May 2026', fee: { GEN: '250', OBC: '250', SC: '0' }, age: { min: 18, max: 35 }, eligibility: 'B.E / B.Tech', links: { apply: '#', notification: '#', official: 'https://isro.gov.in' } },
            { id: 'lic-ado-2026', title: 'LIC ADO Recruitment 2026', startDate: '2026-01-20', lastDate: '2026-02-15', examDate: 'April 2026', fee: { GEN: '750', OBC: '750', SC: '100' }, age: { min: 21, max: 30 }, eligibility: 'Graduate', links: { apply: '#', notification: '#', official: 'https://licindia.in' } },
            { id: 'dsssb-mt-2026', title: 'DSSSB MTS & Various Posts', startDate: '2026-01-08', lastDate: '2026-02-07', examDate: 'June 2026', fee: { GEN: '100', OBC: '100', SC: '0' }, age: { min: 18, max: 27 }, eligibility: '10th / 12th', links: { apply: '#', notification: '#', official: 'https://dsssb.delhi.gov.in' } },
            { id: 'railway-alp-2026', title: 'RRB Assistant Loco Pilot 2026', startDate: '2026-01-30', lastDate: '2026-03-05', examDate: 'Sept 2026', fee: { GEN: '500', OBC: '500', SC: '250' }, age: { min: 18, max: 33 }, eligibility: 'ITI / Diploma', links: { apply: '#', notification: '#', official: 'https://indianrailways.gov.in' } }
        ];

        const megaData = {
            admit: [
                { id: 'admit-ssc-gd', title: 'SSC GD Constable Admit Card 2026', released: '2026-01-20', exam: 'Feb-Mar 2026', link: 'https://ssc.nic.in/' },
                { id: 'admit-gate-2026', title: 'GATE 2026 Hall Ticket Out', released: '2026-01-15', exam: 'Feb 2026', link: 'https://gate2026.iitg.ac.in/' },
                { id: 'admit-sbi-clerk', title: 'SBI Clerk Prelims Admit Card', released: '2026-01-22', exam: 'Feb 2026', link: 'https://sbi.co.in/' },
                { id: 'admit-jee-main', title: 'JEE Main Jan Session Admit Card', released: '2026-01-19', exam: '24 Jan - 01 Feb', link: 'https://jeemain.nta.nic.in/' },
                { id: 'admit-raj-police', title: 'Rajasthan Police Physical Admit Card', released: '2026-01-18', exam: 'Jan-Feb 2026', link: 'https://police.rajasthan.gov.in/' },
                { id: 'admit-upsc-cds', title: 'UPSC CDS (I) Admit Card 2026', released: 'Expected March', exam: 'April 2026', link: 'https://upsc.gov.in/' },
                { id: 'admit-rrb-alp', title: 'RRB ALP City Intimation Slip', released: '2026-01-23', exam: 'Feb 2026', link: 'https://rrbcdg.gov.in/' },
                { id: 'admit-ctet-2026', title: 'CTET Jan 2026 Final Admit Card', released: '2026-01-10', exam: '19 Jan 2026', link: 'https://ctet.nic.in/' },
                { id: 'admit-cuet-pg', title: 'CUET PG Exam City Intimation', released: '2026-01-21', exam: 'March 2026', link: 'https://cuet.nta.nic.in/' },
                { id: 'admit-mpsc-pre', title: 'MPSC State Services Admit Card', released: '2026-01-15', exam: 'Feb 2026', link: 'https://mpsc.gov.in/' },
                { id: 'admit-ib-sao', title: 'Intelligence Bureau SA/MTS Admit', released: '2026-01-12', exam: 'Feb 2026', link: 'https://mha.gov.in/' },
                { id: 'admit-ignou-term', title: 'IGNOU Dec Term End Hall Ticket', released: '2025-12-28', exam: 'Jan 2026', link: 'https://ignou.ac.in/' },
                { id: 'admit-neet-ss', title: 'NEET SS 2025 Admit Card', released: '2026-01-05', exam: 'Jan 2026', link: 'https://natboard.edu.in/' },
                { id: 'admit-airforce', title: 'AFCAT 01/2026 Admit Card', released: '2026-01-25', exam: 'Feb 2026', link: 'https://afcat.cdac.in/' },
                { id: 'admit-barc', title: 'BARC Scientific Asst. Admit Card', released: '2026-01-14', exam: 'Feb 2026', link: 'https://barconlineexam.com/' }
            ],
            results: [
                { id: 'res-ibps-po', title: 'IBPS PO XV Mains Result 2026', declared: '2026-01-21', link: 'https://ibps.in/' },
                { id: 'res-ssc-cgl', title: 'SSC CGL 2025 Final Result Out', declared: '2026-01-15', link: 'https://ssc.nic.in/' },
                { id: 'res-reet-2025', title: 'REET 2025 Final Selection List', declared: '2026-01-10', link: 'https://rsmssb.rajasthan.gov.in/' },
                { id: 'res-navy-ssr', title: 'Navy SSR/MR 02/2025 Final Result', declared: '2026-01-22', link: 'https://joinindiannavy.gov.in/' },
                { id: 'res-cat-2025', title: 'IIM CAT 2025 Score Card Out', declared: '2026-01-05', link: 'https://iimcat.ac.in/' },
                { id: 'res-uppbpb', title: 'UP Police Constable Final Result', declared: '2026-01-18', link: 'https://uppbpb.gov.in/' },
                { id: 'res-sbi-po', title: 'SBI PO 2025 Mains Result', declared: '2026-01-12', link: 'https://sbi.co.in/' },
                { id: 'res-rpsc-ras', title: 'RPSC RAS 2025 Prelims Cutoff', declared: '2025-12-30', link: 'https://rpsc.rajasthan.gov.in/' },
                { id: 'res-ugc-net', title: 'UGC NET Dec 2025 Score Card', declared: '2026-01-20', link: 'https://ugcnet.nta.nic.in/' },
                { id: 'res-clat-2026', title: 'CLAT 2026 Final Merit List', declared: '2025-12-28', link: 'https://consortiumofnlus.ac.in/' },
                { id: 'res-lic-assistant', title: 'LIC Assistant Prelims Result', declared: '2026-01-15', link: 'https://licindia.in/' },
                { id: 'res-ssc-mts', title: 'SSC MTS 2025 Paper I Result', declared: '2026-01-08', link: 'https://ssc.nic.in/' },
                { id: 'res-aiims-norcet', title: 'AIIMS NORCET 7 Score Card', declared: '2026-01-23', link: 'https://aiimsexams.ac.in/' },
                { id: 'res-csir-net', title: 'CSIR NET Dec Result 2025', declared: '2026-01-19', link: 'https://csirnet.nta.nic.in/' },
                { id: 'res-ib-mains', title: 'IB ACIO Grade II Mains Result', declared: '2026-01-04', link: 'https://mha.gov.in/' }
            ]
        };

        const listModal = $('#megaListModal');
        const detailsModal = $('#megaDetailsModal');
        if (!listModal || !detailsModal) return;

        const listBackdrop = listModal.querySelector('.mega-modal-backdrop');
        const listCard = listModal.querySelector('.mega-modal-card');
        const listTitle = listModal.querySelector('#megaListTitle');
        const listContainer = listModal.querySelector('.mega-list-container');
        const listClose = listModal.querySelector('[data-modal-close]');
        const detailsBackdrop = detailsModal.querySelector('.mega-details-backdrop');
        const detailsCard = detailsModal.querySelector('.mega-details-card');
        const detailsBody = detailsModal.querySelector('.mega-details-body');
        const detailsClose = detailsModal.querySelector('[data-details-close]');

        const clearContainer = (el) => { if (el) el.innerHTML = ''; };

        const buildListItem = (item, category) => {
            const wrap = document.createElement('div');
            wrap.className = 'mega-list-item';
            const icon = document.createElement('div');
            icon.className = 'm-icon';
            icon.innerHTML = category === 'jobs' ? '<i class="fas fa-briefcase"></i>' : (category === 'admit' ? '<i class="fas fa-id-card"></i>' : '<i class="fas fa-trophy"></i>');
            const meta = document.createElement('div');
            meta.className = 'm-meta';
            const title = document.createElement('div');
            title.className = 'm-title';
            const sub = document.createElement('div');
            sub.className = 'm-sub';

            if (category === 'jobs') {
                title.textContent = item.title;
                sub.textContent = `Last Date: ${item.lastDate} · Exam: ${item.examDate}`;
                wrap.appendChild(icon);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.style.cssText = 'border:0; background:transparent; padding:0; width:100%; text-align:left;';
                btn.appendChild(meta);
                meta.appendChild(title);
                meta.appendChild(sub);
                btn.addEventListener('click', (e) => { e.preventDefault(); openJobDetails(item.id); });
                wrap.addEventListener('click', (e) => { if (!e.target.closest('a')) openJobDetails(item.id); });
                wrap.appendChild(btn);
            } else {
                title.textContent = item.title;
                sub.textContent = item.exam ? `Exam: ${item.exam}` : `Declared: ${item.declared || item.released || ''}`;
                wrap.appendChild(icon);
                const anchor = document.createElement('a');
                anchor.href = item.link || '#';
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.appendChild(meta);
                meta.appendChild(title);
                meta.appendChild(sub);
                wrap.appendChild(anchor);
            }
            return wrap;
        };

        window.openCategoryModal = (categoryType) => {
            if (!categoryType || (categoryType !== 'jobs' && !megaData[categoryType])) return;
            clearContainer(listContainer);
            const data = (categoryType === 'jobs') ? jobsData.slice(0, 15) : (megaData[categoryType] || []).slice(0, 15);
            if (listTitle) listTitle.textContent = categoryType === 'jobs' ? 'All Latest Jobs' : (categoryType === 'admit' ? 'All Admit Cards' : 'All Results');
            data.forEach(item => {
                const node = buildListItem(item, categoryType);
                if (listContainer) listContainer.appendChild(node);
            });
            listModal.classList.add('mega-modal-open');
            listModal.setAttribute('aria-hidden', 'false');
            setBodyScrollingLocked(true);
            if (listBackdrop) listBackdrop.addEventListener('click', closeListModal);
            if (listClose) listClose.addEventListener('click', closeListModal);
            document.addEventListener('keydown', handleListKeyDown);
        };

        const closeListModal = () => {
            if (detailsModal.classList.contains('mega-details-open')) closeDetailsModal();
            listModal.classList.remove('mega-modal-open');
            listModal.setAttribute('aria-hidden', 'true');
            setBodyScrollingLocked(false);
            if (listBackdrop) listBackdrop.removeEventListener('click', closeListModal);
            if (listClose) listClose.removeEventListener('click', closeListModal);
            document.removeEventListener('keydown', handleListKeyDown);
        };
        const handleListKeyDown = (e) => { if (e.key === 'Escape') closeListModal(); };

        window.openJobDetails = (jobId) => {
            const job = jobsData.find(j => j.id === jobId);
            if (!job) return;
            clearContainer(detailsBody);
            const card = document.createElement('div');
            card.className = 'job-card';
            const left = document.createElement('div');
            left.className = 'job-card-left';
            left.innerHTML = '<div class="m-icon"><i class="fas fa-briefcase"></i></div>';
            const main = document.createElement('div');
            main.className = 'job-card-main';
            const h = document.createElement('div');
            h.className = 'job-title';
            h.textContent = job.title;
            const meta = document.createElement('div');
            meta.className = 'job-meta';
            meta.innerHTML = `<strong>Important Dates:</strong><br>Start: ${job.startDate} · Last: ${job.lastDate} · Exam: ${job.examDate}`;
            const grid = document.createElement('div');
            grid.className = 'job-grid';
            const feeEl = document.createElement('div');
            feeEl.innerHTML = `<strong>Application Fee</strong><br>GEN/OBC: ₹${job.fee.GEN || '0'} · SC/ST: ₹${job.fee.SC || '0'}`;
            const ageEl = document.createElement('div');
            ageEl.innerHTML = `<strong>Age Limit</strong><br>${job.age.min} - ${job.age.max} yrs`;
            const eligibilityEl = document.createElement('div');
            eligibilityEl.innerHTML = `<strong>Eligibility</strong><br>${job.eligibility}`;
            grid.appendChild(feeEl);
            grid.appendChild(ageEl);
            const linksEl = document.createElement('div');
            linksEl.className = 'job-links';
            const applyBtn = document.createElement('a');
            applyBtn.className = 'btn btn-primary';
            applyBtn.href = job.links.apply || '#';
            applyBtn.target = '_blank';
            applyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Online';
            const notifyBtn = document.createElement('a');
            notifyBtn.className = 'btn btn-secondary';
            notifyBtn.href = job.links.notification || '#';
            notifyBtn.target = '_blank';
            notifyBtn.innerHTML = '<i class="fas fa-file-download"></i> Download Notification';
            const officialBtn = document.createElement('a');
            officialBtn.className = 'btn';
            officialBtn.style.background = 'linear-gradient(90deg,var(--primary-color),var(--accent-blue))';
            officialBtn.style.color = 'white';
            officialBtn.href = job.links.official || '#';
            officialBtn.target = '_blank';
            officialBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Official Website';
            linksEl.appendChild(officialBtn);
            linksEl.appendChild(notifyBtn);
            linksEl.appendChild(applyBtn);

            main.appendChild(h);
            main.appendChild(meta);
            main.appendChild(grid);
            main.appendChild(eligibilityEl);
            main.appendChild(linksEl);
            card.appendChild(left);
            card.appendChild(main);
            if (detailsBody) detailsBody.appendChild(card);

            detailsModal.classList.add('mega-details-open');
            detailsModal.setAttribute('aria-hidden', 'false');
            setBodyScrollingLocked(true);
            if (detailsBackdrop) detailsBackdrop.addEventListener('click', closeDetailsModal);
            if (detailsClose) detailsClose.addEventListener('click', closeDetailsModal);
            document.addEventListener('keydown', handleDetailsKeydown);
        };

        const closeDetailsModal = () => {
            detailsModal.classList.remove('mega-details-open');
            detailsModal.setAttribute('aria-hidden', 'true');
            if (!listModal.classList.contains('mega-modal-open')) setBodyScrollingLocked(false);
            if (detailsBackdrop) detailsBackdrop.removeEventListener('click', closeDetailsModal);
            if (detailsClose) detailsClose.removeEventListener('click', closeDetailsModal);
            document.removeEventListener('keydown', handleDetailsKeydown);
        };
        const handleDetailsKeydown = (e) => { if (e.key === 'Escape') closeDetailsModal(); };

        $$('.view-all-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = btn.dataset.category || 'jobs';
                openCategoryModal(cat);
            });
        });

        window.addEventListener('beforeunload', () => { closeListModal(); closeDetailsModal(); });
    })();

    // ---------- Full-Width Gallery ----------
    (function fullWidthGallery() {
        const galleries = $$('.full-width-gallery');
        if (!galleries.length) return;

        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        galleries.forEach(g => obs.observe(g));

        if (!('IntersectionObserver' in window)) galleries.forEach(g => g.classList.add('in-view'));

        galleries.forEach(gallery => {
            $$('img', gallery).forEach(img => {
                if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
                if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
                img.addEventListener('error', () => {
                    img.dataset.errored = 'true';
                    const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f4f4f4"/><text x="50%" y="50%" font-size="18" text-anchor="middle" fill="#666" dy=".3em">Image unavailable</text></svg>')}`;
                    if (img.src !== placeholder) img.src = placeholder;
                    const parent = img.closest('.gallery-item');
                    if (parent) parent.classList.add('img-errored');
                    img.style.objectFit = 'cover';
                });
                img.addEventListener('load', () => {
                    img.dataset.loaded = 'true';
                    const parent = img.closest('.full-width-gallery');
                    if (parent && parent.classList.contains('in-view')) {
                        img.style.opacity = '';
                        img.style.transform = '';
                    }
                    if (parent) parent.classList.remove('img-errored');
                });
            });
        });

        const onScroll = () => {
            const scrollY = window.scrollY;
            galleries.forEach(gallery => {
                const par = gallery.querySelector('.gallery-parallax');
                if (par) {
                    const rect = gallery.getBoundingClientRect();
                    const speed = parseFloat(gallery.dataset.parallaxSpeed || '0.08');
                    const offset = (window.innerHeight - rect.top) * speed * -1;
                    par.style.transform = `translateY(${offset}px)`;
                }
                $$('.gallery-item img', gallery).forEach(img => {
                    const itemRect = img.getBoundingClientRect();
                    const delta = (itemRect.top + itemRect.height / 2 - window.innerHeight / 2) / window.innerHeight;
                    img.style.transform = `scale(${1 + Math.max(-0.02, Math.min(0.12, -delta * 0.06))})`;
                });
            });
        };
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => { onScroll(); ticking = false; });
                ticking = true;
            }
        });
        onScroll();
    })();

    // ---------- Global Search & Testimonials ----------
    (function searchAndTestimonials() {
        const services = [
            { name: 'Government Forms', link: 'emitra-services.html' },
            { name: 'Money Transfer', link: 'banking.html' },
            { name: 'PAN Card Services', link: 'emitra-services.html' },
            { name: 'Urgent Photo Services', link: 'studio.html' },
            { name: 'Aadhar Services', link: 'emitra-services.html' },
            { name: 'Prints & Scanning', link: 'studio.html' },
            { name: 'Banking BC', link: 'banking.html' },
            { name: 'Online Forms', link: 'online-forms.html' },
            { name: 'Business Services', link: 'business-services.html' },
            { name: 'Contact & Support', link: 'contact.html' }
        ];
        const getSearchServices = () => (window.GLOBAL_SERVICES_INDEX && window.GLOBAL_SERVICES_INDEX.length) ? window.GLOBAL_SERVICES_INDEX : services;

        const searchToggle = $('#searchToggle');
        const searchOverlay = $('#searchOverlay');
        const searchInput = $('#searchInput');
        const searchClose = $('#searchClose');
        const searchResults = $('#searchResults');

        if (searchToggle && searchOverlay) {
            const openSearch = () => {
                searchOverlay.classList.add('open');
                searchOverlay.setAttribute('aria-hidden', 'false');
                setBodyScrollingLocked(true);
                setTimeout(() => { if (searchInput) { searchInput.focus(); searchInput.select(); } }, 120);
            };
            const closeSearch = () => {
                searchOverlay.classList.remove('open');
                searchOverlay.setAttribute('aria-hidden', 'true');
                setBodyScrollingLocked(false);
                if (searchInput) searchInput.value = '';
                renderSearchResults([]);
            };
            const renderSearchResults = (list) => {
                if (!searchResults) return;
                if (!list || list.length === 0) {
                    searchResults.innerHTML = '<div class="search-empty">No results. Try a different keyword.</div>';
                    return;
                }
                searchResults.innerHTML = list.map(item => `<div class="search-result-item"><a href="${item.link}" role="option"><span class="rname">${item.name}</span><span class="rlink">Visit</span></a></div>`).join('\n');
            };

            searchToggle.addEventListener('click', openSearch);
            if (searchClose) searchClose.addEventListener('click', closeSearch);
            searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });

            document.addEventListener('keydown', (e) => {
                if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    openSearch();
                }
                if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
            });

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const q = e.target.value.trim();
                    if (!q) { renderSearchResults([]); return; }
                    const searchSource = getSearchServices();
                    const results = searchSource
                        .map(s => ({ s, idx: s.name.toLowerCase().indexOf(q.toLowerCase()) }))
                        .filter(x => x.idx !== -1)
                        .sort((a, b) => a.idx - b.idx || a.s.name.length - b.s.name.length)
                        .slice(0, 12)
                        .map(x => ({ name: x.s.name.replace(new RegExp(q, 'gi'), m => `<span class="search-highlight">${m}</span>`), link: x.s.link }));
                    renderSearchResults(results);
                });
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const firstLink = searchResults?.querySelector('a');
                        if (firstLink) window.location.href = firstLink.getAttribute('href');
                    }
                });
            }
        }

        // Testimonials slider
        const track = $('#testimonialsTrack');
        const dotsWrap = $('#testimonialsDots');
        if (track) {
            const gap = 18;
            let current = 0;
            const cards = $$('.testimonial-card', track);
            const updateTrack = () => {
                if (!cards.length) return;
                const cardWidth = cards[0].offsetWidth + gap;
                track.style.transform = `translateX(-${Math.round(cardWidth * current)}px)`;
                if (dotsWrap && dotsWrap.children) {
                    Array.from(dotsWrap.children).forEach((btn, idx) => btn.classList.toggle('active', idx === current));
                }
            };
            if (dotsWrap) {
                dotsWrap.innerHTML = '';
                cards.forEach((_, i) => {
                    const btn = document.createElement('button');
                    btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
                    btn.addEventListener('click', () => { current = i; updateTrack(); });
                    dotsWrap.appendChild(btn);
                });
            }
            let auto = setInterval(() => { current = (current + 1) % cards.length; updateTrack(); }, 4000);
            track.addEventListener('mouseenter', () => clearInterval(auto));
            track.addEventListener('mouseleave', () => {
                auto = setInterval(() => { current = (current + 1) % cards.length; updateTrack(); }, 4000);
            });
            window.addEventListener('resize', () => setTimeout(updateTrack, 120));
            setTimeout(updateTrack, 200);
        }
    })();

    // ---------- Active Nav Link Update ----------
    (function activeNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        $$('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) link.classList.add('active');
        });
    })();

    // ---------- Smooth Scroll for Anchor Links ----------
    (function smoothScroll() {
        $$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && document.querySelector(href)) {
                    e.preventDefault();
                    document.querySelector(href).scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    })();

    // ---------- Contact Form Handling (if present) ----------
    (function contactForm() {
        const contactForm = $('#contactForm');
        const successMessage = $('#successMessage');
        if (contactForm) {
            contactForm.addEventListener('submit', function (e) {
                e.preventDefault();
                if (successMessage) successMessage.style.display = 'flex';
                contactForm.reset();
                setTimeout(() => { if (successMessage) successMessage.style.display = 'none'; }, 5000);
            });
        }
    })();

    // ---------- Floating Form Modal ----------
    (function floatingForm() {
        const openBtn = $('#floatingFormBtn');
        const modal = $('#formModal');
        if (!openBtn || !modal) return;
        const closeBtn = modal.querySelector('[data-modal-close]');
        const backdrop = modal.querySelector('[data-modal-backdrop]');
        let lastFocus = null;

        const openModal = () => {
            lastFocus = document.activeElement;
            modal.classList.add('form-modal-open');
            modal.setAttribute('aria-hidden', 'false');
            setBodyScrollingLocked(true);
            if (closeBtn) closeBtn.focus();
        };
        const closeModal = () => {
            modal.classList.remove('form-modal-open');
            modal.setAttribute('aria-hidden', 'true');
            setBodyScrollingLocked(false);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };

        openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('form-modal-open')) closeModal(); });

        // subtle idle animation
        setInterval(() => {
            openBtn.style.animation = 'pop 0.5s ease-in-out';
            setTimeout(() => openBtn.style.animation = '', 500);
        }, 7000);
    })();

    // ---------- Floating WhatsApp Animation ----------
    (function floatingWhatsApp() {
        const floatingBtn = $('#floatingWhatsApp');
        if (floatingBtn) {
            setInterval(() => {
                floatingBtn.style.animation = 'wiggle 0.5s ease-in-out';
                setTimeout(() => {
                    floatingBtn.style.animation = 'pop 0.5s ease-in-out';
                    setTimeout(() => floatingBtn.style.animation = '', 500);
                }, 500);
            }, 5000);
        }
    })();

    // ---------- FAQ Accordion ----------
    (function faqInit() {
        $$('.faq-question').forEach(q => {
            q.addEventListener('click', function () {
                const parent = this.closest('.faq-item');
                const answer = parent.querySelector('.faq-answer');
                if (!answer) return;
                const isOpen = this.classList.toggle('open');
                parent.classList.toggle('open');
                answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : '0';
                answer.classList.toggle('open', isOpen);
            });
        });
    })();

    // ---------- Standalone Slider (defensive) ----------
    (() => {
  const track = document.getElementById("track");
  const wrap = track.parentElement;
  const cards = Array.from(track.children);
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const dotsBox = document.getElementById("dots");

  const isMobile = () => matchMedia("(max-width:767px)").matches;

  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.onclick = () => activate(i, true);
    dotsBox.appendChild(dot);
  });
  const dots = Array.from(dotsBox.children);

  let current = 0;

  function center(i) {
    const card = cards[i];
    const axis = isMobile() ? "top" : "left";
    const size = isMobile() ? "clientHeight" : "clientWidth";
    const start = isMobile() ? card.offsetTop : card.offsetLeft;
    wrap.scrollTo({
      [axis]: start - (wrap[size] / 2 - card[size] / 2),
      behavior: "smooth"
    });
  }

  function toggleUI(i) {
    cards.forEach((c, k) => c.toggleAttribute("active", k === i));
    dots.forEach((d, k) => d.classList.toggle("active", k === i));
    prev.disabled = i === 0;
    next.disabled = i === cards.length - 1;
  }

  function activate(i, scroll) {
    if (i === current) return;
    current = i;
    toggleUI(i);
    if (scroll) center(i);
  }

  function go(step) {
    activate(Math.min(Math.max(current + step, 0), cards.length - 1), true);
  }

  prev.onclick = () => go(-1);
  next.onclick = () => go(1);

  addEventListener(
    "keydown",
    (e) => {
      if (["ArrowRight", "ArrowDown"].includes(e.key)) go(1);
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) go(-1);
    },
    { passive: true }
  );

  cards.forEach((card, i) => {
    card.addEventListener(
      "mouseenter",
      () => matchMedia("(hover:hover)").matches && activate(i, true)
    );
    card.addEventListener("click", () => activate(i, true));
  });

  let sx = 0,
    sy = 0;
  track.addEventListener(
    "touchstart",
    (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (isMobile() ? Math.abs(dy) > 60 : Math.abs(dx) > 60)
        go((isMobile() ? dy : dx) > 0 ? -1 : 1);
    },
    { passive: true }
  );
  if (window.matchMedia("(max-width:767px)").matches) dotsBox.hidden = true;

  addEventListener("resize", () => center(current));

  toggleUI(0);
  center(0);
})();

    // ---------- Overlay Detector / Fixer (non‑blocking) ----------
    (function detectAndFixBlockingOverlays() {
        try {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            $$('body *').forEach(el => {
                const cs = window.getComputedStyle(el);
                if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
                const pos = cs.position;
                if (pos !== 'fixed' && pos !== 'absolute' && pos !== 'sticky') return;
                const r = el.getBoundingClientRect();
                const areaRatio = (r.width * r.height) / (vw * vh);
                const isModalLike = /modal|wa-|universal|overlay|backdrop/i.test(el.id + ' ' + el.className);
                if (areaRatio > 0.6 && !isModalLike) {
                    el.dataset._pt_fix = 'true';
                    el.style.pointerEvents = 'none';
                }
            });
        } catch (e) { /* ignore */ }
    })();

    // ---------- Scroll to Top Button ----------
    (function createScrollToTopButton() {
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.className = 'scroll-to-top';
        button.setAttribute('aria-label', 'Scroll to top');
        button.style.cssText = `
            position: fixed; bottom: 2rem; right: 2rem; width: 50px; height: 50px;
            background: linear-gradient(135deg, #FF8C00, #ff7a00); color: white; border: none;
            border-radius: 50%; cursor: pointer; font-size: 1.2rem; display: none;
            align-items: center; justify-content: center;
            box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3); z-index: 999;
            transition: all 0.3s ease;
        `;
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 8px 25px rgba(255, 140, 0, 0.4)';
        });
        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(255, 140, 0, 0.3)';
        });
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.body.appendChild(button);

        window.addEventListener('scroll', () => {
            button.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });
    })();

    // Optional: run overlay detector again after a short delay
    setTimeout(detectAndFixBlockingOverlays, 100);

    console.info('STAR E-Mitra script initialized successfully.');
});
