/**
 * Industrial HUD Framework – główna logika UI
 */
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // TERMINAL LOG (dostępny w całym skrypcie)
    // =========================================================================
    const terminalOutput = document.getElementById('terminalOutput');
    const LOG_LEVELS = { INFO: 'log-info', WARN: 'log-warn', ERROR: 'log-error' };

    function addLog(level, msg) {
        if (!terminalOutput) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        const levelClass = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-line';
        logEntry.innerHTML = `<span class="log-time">[${timeString}]</span><span class="${levelClass}">${level}:</span><span class="log-msg">${msg}</span>`;
        terminalOutput.appendChild(logEntry);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // =========================================================================
    // TOASTY (alert.css) — powiadomienia w prawym dolnym rogu
    // =========================================================================
    const toastContainer = document.getElementById('toast-container');
    const TOAST_CLASS = { info: 'toast-info', success: 'toast-success', warning: 'toast-warning', critical: 'toast-critical' };

    function showToast(level, title, message, durationMs = 5000) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        const levelClass = TOAST_CLASS[level] || '';
        toast.className = `toast ${levelClass}`.trim();
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-label">${escapeHtml(title)}</span>
                <button type="button" class="toast-close" aria-label="Zamknij"><i class="fas fa-times"></i></button>
            </div>
            ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
        `;
        toastContainer.appendChild(toast);

        const close = () => {
            toast.classList.add('closing');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close')?.addEventListener('click', close);
        if (durationMs > 0) setTimeout(close, durationMs);
    }
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    if (toastContainer) {
        toastContainer.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.toast-close');
            if (closeBtn) {
                const toast = closeBtn.closest('.toast');
                if (toast) { toast.classList.add('closing'); setTimeout(() => toast.remove(), 300); }
            }
        });
    }

    // =========================================================================
    // MODAL POTWIERDZENIA (alert.css – system-alert-modal)
    // =========================================================================
    const CONFIRM_TYPE_ICONS = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        critical: 'fa-radiation'
    };
    const confirmOverlay = document.getElementById('confirmOverlay');
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMainTitle = document.getElementById('confirmModalMainTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalClose = document.getElementById('confirmModalClose');
    const confirmModalCancel = document.getElementById('confirmModalCancel');
    const confirmModalConfirm = document.getElementById('confirmModalConfirm');

    let confirmResolve = null;

    function openConfirmModal(options = {}) {
        const {
            type = 'info',
            title = 'Confirm',
            message = '',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            onConfirm,
            onCancel
        } = options;

        if (!confirmModal || !confirmOverlay) return;

        const iconClass = CONFIRM_TYPE_ICONS[type] || CONFIRM_TYPE_ICONS.info;
        const titleHtml = `<i class="fas ${iconClass}" aria-hidden="true" style="margin-right: 0.4rem;"></i>${escapeHtml(title)}`;

        confirmModal.setAttribute('data-alert-type', type);
        if (confirmModalTitle) confirmModalTitle.innerHTML = titleHtml;
        if (confirmModalMainTitle) confirmModalMainTitle.innerHTML = titleHtml;
        if (confirmModalMessage) confirmModalMessage.textContent = message;
        if (confirmModalConfirm) confirmModalConfirm.innerHTML = `<i class="fas fa-check"></i> ${escapeHtml(confirmText)}`;
        if (confirmModalCancel) confirmModalCancel.innerHTML = `<i class="fas fa-times"></i> ${escapeHtml(cancelText)}`;

        confirmResolve = null;
        confirmModal.classList.add('active');
        confirmOverlay.classList.add('active');
        confirmOverlay.setAttribute('aria-hidden', 'false');
        confirmModal.setAttribute('aria-hidden', 'false');

        return new Promise((resolve) => {
            confirmResolve = (result) => {
                closeConfirmModal();
                if (result) onConfirm?.(); else onCancel?.();
                resolve(result);
            };
        });
    }

    function closeConfirmModal() {
        if (confirmModal) confirmModal.classList.remove('active');
        if (confirmOverlay) {
            confirmOverlay.classList.remove('active');
            confirmOverlay.setAttribute('aria-hidden', 'true');
        }
        confirmModal?.setAttribute('aria-hidden', 'true');
    }

    function handleConfirmChoice(confirmed) {
        if (typeof confirmResolve === 'function') {
            confirmResolve(confirmed);
            confirmResolve = null;
        } else closeConfirmModal();
    }

    if (confirmModalClose) confirmModalClose.addEventListener('click', () => handleConfirmChoice(false));
    if (confirmModalCancel) confirmModalCancel.addEventListener('click', () => handleConfirmChoice(false));
    if (confirmModalConfirm) confirmModalConfirm.addEventListener('click', () => handleConfirmChoice(true));
    if (confirmOverlay) confirmOverlay.addEventListener('click', () => handleConfirmChoice(false));

    if (confirmModal) confirmModal.addEventListener('click', (e) => e.stopPropagation());

    // =========================================================================
    // ZEGAR W NAGŁÓWKU
    // =========================================================================
    function updateTime() {
        const timeElement = document.getElementById('timestamp');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
        }
    }
    setInterval(updateTime, 1000);
    updateTime();

    // =========================================================================
    // MOTYW (Theme) + zapis w localStorage
    // =========================================================================
    const root = document.documentElement;
    const THEME_KEY = 'hud-theme';
    const themeToggleBtn = document.getElementById('themeToggle');
    const sidebarThemeToggle = document.getElementById('sidebarThemeToggle');

    function setTheme(isDark, silent = false) {
        root.classList.add('theme-switching');
        if (isDark) {
            root.setAttribute('theme', 'dark');
            if (sidebarThemeToggle) sidebarThemeToggle.checked = true;
        } else {
            root.removeAttribute('theme');
            if (sidebarThemeToggle) sidebarThemeToggle.checked = false;
        }
        try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (_) {}
        if (!silent) {
            addLog('INFO', `Theme engine switched to: ${isDark ? 'DARK' : 'LIGHT'} mode.`);
            showToast('info', 'Theme', `${isDark ? 'Dark' : 'Light'} mode active.`);
        }
        setTimeout(() => root.classList.remove('theme-switching'), 50);
    }

    function initTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved === 'dark') setTheme(true, true);
            else if (saved === 'light') setTheme(false, true);
        } catch (_) {}
    }
    initTheme();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTheme(root.getAttribute('theme') !== 'dark');
        });
    }
    if (sidebarThemeToggle) {
        sidebarThemeToggle.addEventListener('change', (e) => setTheme(e.target.checked));
    }

    // =========================================================================
    // SIDEBAR (Parameters)
    // =========================================================================
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const settingsSidebar = document.getElementById('settingsSidebar');
    const settingsOverlay = document.getElementById('settingsOverlay');

    function openSidebar() {
        if (settingsSidebar) settingsSidebar.classList.add('active');
        if (settingsOverlay) settingsOverlay.classList.add('active');
    }
    function closeSidebar() {
        if (settingsSidebar) settingsSidebar.classList.remove('active');
        if (settingsOverlay) settingsOverlay.classList.remove('active');
    }
    function toggleSidebar() {
        if (settingsSidebar && settingsSidebar.classList.contains('active')) closeSidebar();
        else openSidebar();
    }

    if (settingsBtn) settingsBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (settingsOverlay) settingsOverlay.addEventListener('click', closeSidebar);

    // Zakładki w sidebarze
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const container = tab.closest('.settings-sidebar');
            if (!container) return;
            const targetId = tab.getAttribute('data-tab');
            if (!targetId) return;
            container.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const content = document.getElementById(targetId);
            if (content) content.classList.add('active');
        });
    });

    // Checkboxy w sidebarze – logowanie zmian
    document.querySelectorAll('.settings-sidebar .setting-label input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const label = e.target.closest('.setting-label');
            const name = label ? label.textContent.replace(/\s+/g, ' ').trim() : 'Setting';
            addLog('INFO', `${name}: ${e.target.checked ? 'ON' : 'OFF'}`);
        });
    });

    // =========================================================================
    // PURGE CACHE
    // =========================================================================
    const purgeCacheBtn = document.getElementById('purgeCacheBtn');
    if (purgeCacheBtn) {
        purgeCacheBtn.addEventListener('click', () => {
            openConfirmModal({
                type: 'warning',
                title: 'Purge Cache',
                message: 'This will clear all local cache. Continue?',
                confirmText: 'Purge',
                cancelText: 'Cancel',
                onConfirm: () => {
                    addLog('WARN', 'Purge Cache initiated. Local cache cleared.');
                    addLog('INFO', 'Cache purge complete. System ready.');
                    showToast('success', 'Cache Purge', 'Local cache cleared. System ready.');
                }
            });
        });
    }

    // =========================================================================
    // ZAKŁADKI W PANELU (tab-nav / tab-pane)
    // =========================================================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabContainer = btn.closest('.tab-container');
            const targetId = btn.getAttribute('data-target');
            if (!tabContainer || !targetId) return;
            tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            tabContainer.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetPane = tabContainer.querySelector(`#${targetId}`);
            if (targetPane) targetPane.classList.add('active');
            addLog('INFO', `Switched view to tab: ${targetId}`);
        });
    });

    // =========================================================================
    // MODAL
    // =========================================================================
    const demoModal = document.getElementById('demoModal');
    const demoModalOverlay = document.getElementById('demoModalOverlay');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const executeOverrideBtn = document.getElementById('executeOverrideBtn');

    function openModal() {
        if (demoModal) demoModal.classList.add('active');
        if (demoModalOverlay) demoModalOverlay.classList.add('active');
    }
    function closeModal() {
        if (demoModal) demoModal.classList.remove('active');
        if (demoModalOverlay) demoModalOverlay.classList.remove('active');
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    if (demoModalOverlay) demoModalOverlay.addEventListener('click', closeModal);

    if (executeOverrideBtn) {
        executeOverrideBtn.addEventListener('click', () => {
            const confirmCb = demoModal && demoModal.querySelector('.setting-label input[type="checkbox"]');
            if (confirmCb && !confirmCb.checked) {
                addLog('WARN', 'Override blocked: Confirm Authorization required.');
                showToast('warning', 'Override Blocked', 'Confirm Authorization required.');
                return;
            }
            addLog('WARN', 'System override executed. Manual protocol active.');
            showToast('critical', 'System Override', 'Manual protocol active.');
            closeModal();
        });
    }

    // Klik w zawartość modala nie zamyka (overlay jest osobno)
    if (demoModal) {
        demoModal.addEventListener('click', (e) => e.stopPropagation());
    }

    // =========================================================================
    // CUSTOM SELECT (ja-select)
    // =========================================================================
    document.querySelectorAll('.ja-select-wrap').forEach(wrap => {
        const btn = wrap.querySelector('.ja-select-btn');
        const list = wrap.querySelector('.ja-select-list');
        const items = wrap.querySelectorAll('.ja-select-item');
        if (!btn || !list) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.ja-select-list').forEach(l => {
                if (l !== list) l.classList.remove('ja-visible');
            });
            document.querySelectorAll('.ja-select-btn').forEach(b => {
                if (b !== btn) b.classList.remove('ja-open');
            });
            list.classList.toggle('ja-visible');
            btn.classList.toggle('ja-open');
        });

        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('ja-selected'));
                item.classList.add('ja-selected');
                const text = item.textContent.replace(/>/g, '').trim();
                btn.innerHTML = `${text} <i class="fas fa-chevron-down ja-select-arrow"></i>`;
                list.classList.remove('ja-visible');
                btn.classList.remove('ja-open');
                addLog('INFO', `Parameter updated: ${text}`);
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.ja-select-list').forEach(l => l.classList.remove('ja-visible'));
        document.querySelectorAll('.ja-select-btn').forEach(b => b.classList.remove('ja-open'));
    });

    // =========================================================================
    // SUWAKI (range)
    // =========================================================================
    document.querySelectorAll('.setting-control input[type="range"]').forEach(range => {
        range.addEventListener('input', (e) => {
            const valDisplay = e.target.nextElementSibling;
            if (valDisplay && valDisplay.classList.contains('setting-value')) {
                const suffix = Number(e.target.max) > 100 ? 'px' : '%';
                valDisplay.textContent = e.target.value + suffix;
            }
        });
    });

    // =========================================================================
    // SKRÓTY KLAWIATUROWE (Escape)
    // =========================================================================
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (confirmModal && confirmModal.classList.contains('active')) {
            handleConfirmChoice(false);
            e.preventDefault();
        } else if (demoModal && demoModal.classList.contains('active')) {
            closeModal();
            e.preventDefault();
        } else if (settingsSidebar && settingsSidebar.classList.contains('active')) {
            closeSidebar();
            e.preventDefault();
        } else {
            document.querySelectorAll('.ja-select-list').forEach(l => l.classList.remove('ja-visible'));
            document.querySelectorAll('.ja-select-btn').forEach(b => b.classList.remove('ja-open'));
        }
    });

});
