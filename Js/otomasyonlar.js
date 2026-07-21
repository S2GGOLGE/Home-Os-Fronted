/* =====================================================
   otomasyonlar.js - Otomasyonlar Sayfası UI & Mantık
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    runInitialLoader();
    setupAutomationEvents();
});

// ═════════════════════════════════════════════════════
// 1. BAŞLANGIÇ ANİMASYONU & YÜKLEYİCİ
// ═════════════════════════════════════════════════════

const loadingStates = [
    { limit: 30, text: 'Otomasyon modülleri taranıyor...' },
    { limit: 65, text: 'Backend servis bağlantısı kuruluyor...' },
    { limit: 85, text: 'Kullanıcı senaryoları senkronize ediliyor...' },
    { limit: 100, text: 'Otomasyonlar hazır.' }
];

function runInitialLoader() {
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderPercentage = document.getElementById('loader-percentage');

    if (!loaderOverlay) {
        loadAutomations();
        return;
    }

    let progress = 0;
    const interval = setInterval(async () => {
        const step = Math.floor(Math.random() * 8) + 5;
        progress += step;

        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            if (loaderBar) loaderBar.style.width = '100%';
            if (loaderPercentage) loaderPercentage.textContent = '100%';

            await loadAutomations();

            setTimeout(() => {
                loaderOverlay.classList.add('fade-out');
                loaderOverlay.addEventListener('transitionend', () => {
                    loaderOverlay.remove();
                }, { once: true });
            }, 300);
            return;
        }

        if (loaderBar) loaderBar.style.width = `${progress}%`;
        if (loaderPercentage) loaderPercentage.textContent = `${progress}%`;

        const currentState = loadingStates.find(state => progress <= state.limit);
        if (currentState && loaderText) {
            loaderText.textContent = currentState.text;
        }
    }, 45);
}

// ═════════════════════════════════════════════════════
// 2. OTOMASYONLARI YÜKLE & RENDER ET
// ═════════════════════════════════════════════════════

async function loadAutomations() {
    const automationGrid = document.getElementById('automationGrid');
    if (!automationGrid) return;

    try {
        const automations = await apiGetAutomations();

        if (!automations || automations.length === 0) {
            renderEmptyAutomations(automationGrid);
            return;
        }

        renderAutomationsGrid(automations, automationGrid);
    } catch (error) {
        console.error('[AUTOMATION] Yükleme hatası:', error);
        renderAutomationError(automationGrid, error);
    }
}

function renderAutomationsGrid(automations, container) {
    container.innerHTML = automations.map(auto => buildAutomationCardHtml(auto)).join('');
}

function buildAutomationCardHtml(auto) {
    const isActive = auto.isActive ?? auto.IsActive ?? false;
    const name = escapeAutomationHtml(auto.name ?? auto.Name ?? 'İsimsiz Otomasyon');
    const description = escapeAutomationHtml(auto.description ?? auto.Description ?? '');
    const triggerCondition = escapeAutomationHtml(auto.triggerCondition ?? auto.TriggerCondition ?? '');
    const actionDescription = escapeAutomationHtml(auto.actionDescription ?? auto.ActionDescription ?? '');
    const id = auto.id ?? auto.Id;
    const lastRunStr = auto.lastRun ?? auto.LastRun;
    const lastRunFormatted = lastRunStr ? new Date(lastRunStr).toLocaleString('tr-TR') : 'Hiç çalıştırılmadı';

    const statusBadge = isActive
        ? `<span class="auto-badge badge-active"><i class="fas fa-check-circle"></i> AKTİF</span>`
        : `<span class="auto-badge badge-inactive"><i class="fas fa-pause-circle"></i> PASİF</span>`;

    return `
        <div class="automation-card ${isActive ? 'is-active' : 'is-disabled'}" data-automation-id="${id}">
            <div class="card-top">
                <div class="card-title-group">
                    <div class="card-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div>
                        <h3 class="card-title">${name}</h3>
                        ${description ? `<p class="card-subtext">${description}</p>` : ''}
                    </div>
                </div>
                ${statusBadge}
            </div>

            <div class="card-body-info">
                ${triggerCondition ? `
                    <div class="info-row">
                        <span class="info-label"><i class="fas fa-clock"></i> Tetikleyici:</span>
                        <span class="info-value">${triggerCondition}</span>
                    </div>
                ` : ''}
                ${actionDescription ? `
                    <div class="info-row">
                        <span class="info-label"><i class="fas fa-play"></i> Eylem:</span>
                        <span class="info-value">${actionDescription}</span>
                    </div>
                ` : ''}
                <div class="info-row last-run">
                    <span class="info-label"><i class="fas fa-history"></i> Son Çalışma:</span>
                    <span class="info-value">${lastRunFormatted}</span>
                </div>
            </div>

            <div class="card-actions">
                <button type="button" class="btn-auto-action toggle-btn" data-action="toggle" data-id="${id}">
                    <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i> ${isActive ? 'Durdur' : 'Etkinleştir'}
                </button>
                <button type="button" class="btn-auto-action run-btn" data-action="run" data-id="${id}">
                    <i class="fas fa-paper-plane"></i> Çalıştır
                </button>
                <button type="button" class="btn-auto-action delete-btn" data-action="delete" data-id="${id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
}

// ═════════════════════════════════════════════════════
// 3. BOŞ VE HATA DURUMLARI
// ═════════════════════════════════════════════════════

function renderEmptyAutomations(container) {
    container.innerHTML = `
        <div class="automation-empty">
            <div class="automation-empty-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="automation-empty-title">
                Henüz otomasyon oluşturulmamış
            </div>
            <div class="automation-empty-text">
                "Yeni Otomasyon" butonunu kullanarak eviniz için ilk otomasyon kuralını tanımlayın.
            </div>
            <button type="button" class="add-btn" style="margin-top: 15px;" data-modal-open="automationModal">
                + İlk Otomasyonu Ekle
            </button>
        </div>
    `;
}

function renderAutomationError(container, error) {
    container.innerHTML = `
        <div class="automation-error">
            <div class="automation-error-icon">!</div>
            <div class="automation-error-title">Otomasyonlar Yüklenemedi</div>
            <div class="automation-error-message">
                ${escapeAutomationHtml(error.message || 'Backend sunucusuyla iletişim kurulamadı.')}
            </div>
            <button type="button" id="retryAutomationButton" class="retry-button">
                <i class="fas fa-redo"></i> Tekrar Dene
            </button>
        </div>
    `;

    const retryBtn = document.getElementById('retryAutomationButton');
    if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
            retryBtn.disabled = true;
            retryBtn.textContent = 'Yükleniyor...';
            await loadAutomations();
        });
    }
}

// ═════════════════════════════════════════════════════
// 4. EVENT LİSTENER'LAR VE MODAL İŞLEMLERİ
// ═════════════════════════════════════════════════════

function setupAutomationEvents() {
    // Geri Butonu
    const backBtn = document.getElementById('backButton');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    // Grid İçi Buton Event Tıklamaları (Toggle, Run, Delete)
    const automationGrid = document.getElementById('automationGrid');
    if (automationGrid) {
        automationGrid.addEventListener('click', async (event) => {
            const btn = event.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id, 10);
            if (!id) return;

            btn.disabled = true;

            try {
                if (action === 'toggle') {
                    await apiToggleAutomation(id);
                    await loadAutomations();
                } else if (action === 'run') {
                    const res = await apiRunAutomation(id);
                    alert(res.message || 'Otomasyon başarıyla çalıştırıldı!');
                    await loadAutomations();
                } else if (action === 'delete') {
                    if (confirm('Bu otomasyonu silmek istediğinize emin misiniz?')) {
                        await apiDeleteAutomation(id);
                        await loadAutomations();
                    }
                }
            } catch (err) {
                console.error(`[AUTOMATION] ${action} işlemi başarısız:`, err);
                alert(`İşlem başarısız: ${err.message}`);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Yeni Otomasyon Ekle Formu Submit
    const automationForm = document.getElementById('automationForm');
    if (automationForm) {
        automationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('autoName');
            const triggerInput = document.getElementById('autoTriggerCondition') || document.getElementById('autoTrigger');
            const actionInput = document.getElementById('autoActionDescription') || document.getElementById('autoAction');
            const descInput = document.getElementById('autoDescription') || document.getElementById('autoDesc');

            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                alert('Lütfen otomasyon adını girin.');
                return;
            }

            const triggerCondition = triggerInput ? triggerInput.value.trim() : '';
            const actionDescription = actionInput ? actionInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';

            const submitBtn = automationForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Kaydediliyor...';
            }

            try {
                await apiCreateAutomation({
                    name,
                    triggerCondition,
                    actionDescription,
                    description,
                    isActive: true
                });

                automationForm.reset();

                if (window.HomeOSModal) {
                    window.HomeOSModal.close('automationModal');
                } else {
                    const modal = document.getElementById('automationModal');
                    if (modal) modal.classList.remove('show', 'active');
                }

                await loadAutomations();
            } catch (err) {
                console.error('[AUTOMATION] Kayıt hatası:', err);
                alert(`Otomasyon kaydedilirken hata oluştu: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Kaydet';
                }
            }
        });
    }
}

// ═════════════════════════════════════════════════════
// 5. YARDIMCI FONKSİYONLAR
// ═════════════════════════════════════════════════════

function escapeAutomationHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
