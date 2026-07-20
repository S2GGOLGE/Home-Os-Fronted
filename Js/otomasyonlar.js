// =====================================================
// HOMEOS OTOMASYONLAR.JS
// SADECE OTOMASYON SAYFASI İŞLEMLERİ
// =====================================================

const AUTOMATION_API =
    `${API_BASE_URL}/api/automations`;


// =====================================================
// DOM ELEMENTLERİ
// =====================================================

let automationGrid = null;
let automationForm = null;
let automationModal = null;
let autoNameInput = null;

let loaderOverlay = null;
let loaderText = null;
let loaderPercentage = null;
let loaderBar = null;


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    initializeAutomationPage
);


// =====================================================
// SAYFAYI BAŞLAT
// =====================================================

async function initializeAutomationPage() {

    console.log(
        '[AUTOMATION] Otomasyon sistemi başlatılıyor.'
    );

    initializeAutomationElements();

    updateLoader(
        10,
        'Otomasyon sistemi başlatılıyor...'
    );

    await delay(150);

    setupAutomationEvents();

    updateLoader(
        30,
        'API bağlantısı hazırlanıyor...'
    );

    await delay(150);

    updateLoader(
        45,
        'Otomasyonlar yükleniyor...'
    );

    try {

        await loadAutomations();

        updateLoader(
            75,
            'Otomasyon kartları hazırlanıyor...'
        );

        await delay(200);

        updateLoader(
            100,
            'Otomasyonlar hazır.'
        );

        await delay(400);

        hideLoader();

        console.log(
            '[AUTOMATION] Otomasyon sistemi başarıyla başlatıldı.'
        );

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Başlatma hatası:',
            error
        );

        updateLoader(
            100,
            'Otomasyonlar yüklenemedi.'
        );

        await delay(500);

        hideLoader();

    }

}


// =====================================================
// DOM ELEMENTLERİNİ AL
// =====================================================

function initializeAutomationElements() {

    automationGrid =
        document.querySelector(
            '.automation-grid'
        );

    automationForm =
        document.getElementById(
            'automationForm'
        );

    automationModal =
        document.getElementById(
            'automationModal'
        );

    autoNameInput =
        document.getElementById(
            'autoName'
        );

    loaderOverlay =
        document.getElementById(
            'loader-overlay'
        );

    loaderText =
        document.getElementById(
            'loader-text'
        );

    loaderPercentage =
        document.getElementById(
            'loader-percentage'
        );

    loaderBar =
        document.getElementById(
            'loader-bar'
        );

}


// =====================================================
// LOADER GÜNCELLE
// =====================================================

function updateLoader(
    percentage,
    text
) {

    const safePercentage =
        Math.max(
            0,
            Math.min(
                100,
                Number(percentage) || 0
            )
        );


    if (loaderPercentage) {

        loaderPercentage.textContent =
            `${safePercentage}%`;

    }


    if (loaderBar) {

        loaderBar.style.width =
            `${safePercentage}%`;

    }


    if (loaderText && text) {

        loaderText.textContent =
            text;

    }

}


// =====================================================
// LOADER KAPAT
// =====================================================

function hideLoader() {

    if (!loaderOverlay) {

        return;

    }

    loaderOverlay.classList.add(
        'fade-out'
    );

    setTimeout(
        () => {

            if (loaderOverlay) {

                loaderOverlay.style.display =
                    'none';

            }

        },
        650
    );

}


// =====================================================
// GECİKME
// =====================================================

function delay(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


// =====================================================
// OTOMASYONLARI API'DEN GETİR
// =====================================================

async function loadAutomations() {

    if (!automationGrid) {

        throw new Error(
            '.automation-grid elementi bulunamadı.'
        );

    }


    try {

        const response =
            await fetch(
                AUTOMATION_API,
                {
                    method: 'GET',

                    headers: {
                        'Accept':
                            'application/json'
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Otomasyonlar alınamadı. HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const automations =
            Array.isArray(data)
                ? data
                : (
                    data.automations ||
                    data.data ||
                    data.items ||
                    []
                );


        renderAutomations(
            automations
        );


        console.log(
            '[AUTOMATION] Otomasyonlar yüklendi:',
            automations.length
        );


        return automations;

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Listeleme hatası:',
            error
        );


        renderAutomationError(
            error
        );


        throw error;

    }

}


// =====================================================
// OTOMASYONLARI EKRANA BAS
// =====================================================

function renderAutomations(
    automations
) {

    if (!automationGrid) {

        return;

    }


    automationGrid.innerHTML =
        '';


    if (
        !automations ||
        automations.length === 0
    ) {

        renderEmptyAutomations();

        return;

    }


    automations.forEach(
        automation => {

            const id =
                automation.id ??
                automation.automationId;


            const name =
                automation.name ??
                automation.title ??
                `Otomasyon ${id}`;


            const isActive =
                Boolean(
                    automation.isActive ??
                    automation.active ??
                    false
                );


            const card =
                document.createElement(
                    'button'
                );


            card.type =
                'button';


            card.className =
                'card';


            if (isActive) {

                card.classList.add(
                    'active'
                );

            }


            card.dataset.automationId =
                id;


            card.innerHTML = `

                <div class="card-content">

                    ${escapeAutomationHtml(name)}

                </div>

            `;


            automationGrid.appendChild(
                card
            );

        }
    );

}


// =====================================================
// BOŞ OTOMASYON
// =====================================================

function renderEmptyAutomations() {

    if (!automationGrid) {

        return;

    }


    automationGrid.innerHTML = `

        <div class="automation-empty">

            <div class="automation-empty-icon">
                +
            </div>

            <div class="automation-empty-title">
                Henüz otomasyon oluşturulmamış.
            </div>

            <div class="automation-empty-text">
                Yeni Otomasyon butonunu kullanarak
                ilk otomasyonunuzu oluşturabilirsiniz.
            </div>

        </div>

    `;

}


// =====================================================
// HATA DURUMU
// =====================================================

function renderAutomationError(
    error
) {

    if (!automationGrid) {

        return;

    }


    automationGrid.innerHTML = `

        <div class="automation-error">

            <div class="automation-error-icon">
                !
            </div>

            <div class="automation-error-title">
                Otomasyonlar yüklenemedi.
            </div>

            <div class="automation-error-message">
                Backend bağlantısı kurulamadı veya
                API bir hata döndürdü.
            </div>

            <button
                type="button"
                id="retryAutomationButton"
                class="retry-button"
            >
                Tekrar Dene
            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            'retryAutomationButton'
        );


    if (retryButton) {

        retryButton.addEventListener(
            'click',
            retryLoadAutomations
        );

    }


    console.error(
        '[AUTOMATION] UI hata durumu:',
        error
    );

}


// =====================================================
// TEKRAR DENE
// =====================================================

async function retryLoadAutomations() {

    const retryButton =
        document.getElementById(
            'retryAutomationButton'
        );


    if (retryButton) {

        retryButton.disabled =
            true;

        retryButton.textContent =
            'Yükleniyor...';

    }


    updateLoader(
        20,
        'Otomasyonlar tekrar yükleniyor...'
    );


    if (loaderOverlay) {

        loaderOverlay.style.display =
            'flex';

        loaderOverlay.classList.remove(
            'fade-out'
        );

    }


    try {

        updateLoader(
            50,
            'Backend bağlantısı kontrol ediliyor...'
        );


        await loadAutomations();


        updateLoader(
            100,
            'Otomasyonlar hazır.'
        );


        await delay(400);

        hideLoader();

    }
    catch (error) {

        hideLoader();

    }

}


// =====================================================
// EVENTLER
// =====================================================

function setupAutomationEvents() {

    // =================================================
    // GERİ BUTONU
    // =================================================

    const backButton =
        document.getElementById(
            'backButton'
        );


    if (backButton) {

        backButton.addEventListener(
            'click',
            () => {

                window.history.back();

            }
        );

    }


    // =================================================
    // OTOMASYON KARTLARI
    // =================================================

    if (automationGrid) {

        automationGrid.addEventListener(
            'click',
            event => {

                const card =
                    event.target.closest(
                        '[data-automation-id]'
                    );


                if (!card) {

                    return;

                }


                const automationId =
                    card.dataset.automationId;


                openAutomation(
                    automationId
                );

            }
        );

    }


    // =================================================
    // YENİ OTOMASYON
    // =================================================

    if (automationForm) {

        automationForm.addEventListener(
            'submit',
            handleAutomationCreate
        );

    }


    // =================================================
    // MODAL KAPAT
    // =================================================

    document
        .querySelectorAll(
            '[data-modal-close]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    closeAutomationModal
                );

            }
        );

}


// =====================================================
// YENİ OTOMASYON OLUŞTUR
// =====================================================

async function handleAutomationCreate(
    event
) {

    event.preventDefault();


    if (!autoNameInput) {

        return;

    }


    const name =
        autoNameInput.value.trim();


    if (!name) {

        alert(
            'Lütfen otomasyon adı girin.'
        );

        return;

    }


    const submitButton =
        automationForm.querySelector(
            'button[type="submit"]'
        );


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                'Kaydediliyor...';

        }


        const response =
            await fetch(
                AUTOMATION_API,
                {
                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'

                    },

                    body:
                        JSON.stringify({
                            name: name
                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                `Otomasyon oluşturulamadı. HTTP ${response.status}`
            );

        }


        console.log(
            '[AUTOMATION] Yeni otomasyon oluşturuldu.'
        );


        automationForm.reset();


        closeAutomationModal();


        await loadAutomations();

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Oluşturma hatası:',
            error
        );


        alert(
            'Otomasyon oluşturulurken bir hata oluştu.'
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                'Kaydet';

        }

    }

}


// =====================================================
// OTOMASYON AÇ
// =====================================================

function openAutomation(
    id
) {

    console.log(
        '[AUTOMATION] Otomasyon açılıyor:',
        id
    );

}


// =====================================================
// MODAL KAPAT
// =====================================================

function closeAutomationModal() {

    if (!automationModal) {

        return;

    }


    automationModal.classList.remove(
        'active'
    );


    automationModal.setAttribute(
        'aria-hidden',
        'true'
    );

}


// =====================================================
// HTML GÜVENLİĞİ
// =====================================================

function escapeAutomationHtml(
    value
) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}