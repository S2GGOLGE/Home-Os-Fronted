// =====================================================
// HOMEOS OTOMASYONLAR.JS
// SADECE OTOMASYON SAYFASI İŞLEMLERİ
// =====================================================


// =====================================================
// API AYARLARI
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
    () => {

        console.log(
            '[AUTOMATION] Otomasyon sistemi başlatılıyor.'
        );


        initializeAutomationElements();

        initializeAutomations();

    }
);


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
// OTOMASYON SİSTEMİNİ BAŞLAT
// =====================================================

async function initializeAutomations() {

    try {

        updateLoader(
            10,
            'Otomasyon sistemi başlatılıyor...'
        );


        await delay(
            200
        );


        updateLoader(
            25,
            'API bağlantısı hazırlanıyor...'
        );


        await delay(
            200
        );


        setupAutomationEvents();


        updateLoader(
            40,
            'Otomasyonlar yükleniyor...'
        );


        await loadAutomations();


        updateLoader(
            80,
            'Otomasyon kartları hazırlanıyor...'
        );


        await delay(
            200
        );


        updateLoader(
            100,
            'Otomasyonlar hazır.'
        );


        await delay(
            500
        );


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
            'Otomasyonlar yüklenirken hata oluştu.'
        );


        await delay(
            1000
        );


        hideLoader();

    }

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
                Number(
                    percentage
                ) || 0
            )
        );


    if (
        loaderPercentage
    ) {

        loaderPercentage.textContent =
            `${ safePercentage }% `;

    }


    if (
        loaderBar
    ) {

        loaderBar.style.width =
            `${ safePercentage }% `;

    }


    if (
        loaderText &&
        text
    ) {

        loaderText.textContent =
            text;

    }

}


// =====================================================
// LOADER KAPAT
// =====================================================

function hideLoader() {

    if (
        !loaderOverlay
    ) {

        return;
    }


    loaderOverlay.classList.add(
        'hidden'
    );


    // CSS'de .hidden tanımlı değilse
    // doğrudan görünürlüğü kapat
    setTimeout(
        () => {

            if (
                loaderOverlay
            ) {

                loaderOverlay.style.display =
                    'none';

            }

        },
        600
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

    try {

        if (
            !automationGrid
        ) {

            throw new Error(
                '.automation-grid elementi bulunamadı.'
            );

        }


        const response =
            await fetch(
                AUTOMATION_API,
                {
                    method:
                        'GET',

                    headers: {

                        'Accept':
                            'application/json'

                    }
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Otomasyonlar alınamadı.HTTP ${ response.status } `
            );

        }


        const data =
            await response.json();


        // API farklı formatlarda
        // dizi döndürebilir
        const automations =
            Array.isArray(
                data
            )
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

    if (
        !automationGrid
    ) {

        return;
    }


    automationGrid.innerHTML =
        '';


    // API'den hiç otomasyon gelmezse
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
                `Otomasyon ${ id } `;


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


            card.dataset.automationId =
                id;


            card.innerHTML = `

    < div class="card-content" >

        ${
            escapeAutomationHtml(
                name
            )
}

                </div >

    `;


            automationGrid.appendChild(
                card
            );

        }
    );

}


// =====================================================
// BOŞ OTOMASYON DURUMU
// =====================================================

function renderEmptyAutomations() {

    if (
        !automationGrid
    ) {

        return;
    }


    const emptyCard =
        document.createElement(
            'div'
        );


    emptyCard.className =
        'automation-empty';


    emptyCard.innerHTML = `

    < div class="card-content" >

        Henüz otomasyon oluşturulmamış.

        </div >

    `;


    automationGrid.appendChild(
        emptyCard
    );

}


// =====================================================
// OTOMASYON HATA DURUMU
// =====================================================

function renderAutomationError(
    error
) {

    if (
        !automationGrid
    ) {

        return;
    }


    automationGrid.innerHTML = `

    < div class="automation-error" >

            <div class="card-content">

                Otomasyonlar yüklenemedi.

            </div>

            <button
                type="button"
                id="retryAutomationButton"
            >
                Tekrar Dene
            </button>

        </div >

    `;


    const retryButton =
        document.getElementById(
            'retryAutomationButton'
        );


    if (
        retryButton
    ) {

        retryButton.addEventListener(
            'click',
            async () => {

                updateLoader(
                    40,
                    'Otomasyonlar tekrar yükleniyor...'
                );


                await loadAutomations();

            }
        );

    }


    console.error(
        '[AUTOMATION] UI hata durumu:',
        error
    );

}


// =====================================================
// EVENTLERİ KUR
// =====================================================

function setupAutomationEvents() {

    // =================================================
    // GERI BUTONU
    // =================================================

    const backButton =
        document.getElementById(
            'backButton'
        );


    if (
        backButton
    ) {

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

    if (
        automationGrid
    ) {

        automationGrid.addEventListener(
            'click',
            event => {

                const card =
                    event.target.closest(
                        '[data-automation-id]'
                    );


                if (
                    !card
                ) {

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
    // YENİ OTOMASYON FORMU
    // =================================================

    if (
        automationForm
    ) {

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


    if (
        !autoNameInput
    ) {

        return;
    }


    const name =
        autoNameInput.value.trim();


    if (
        !name
    ) {

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

        if (
            submitButton
        ) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                'Kaydediliyor...';

        }


        const response =
            await fetch(
                AUTOMATION_API,
                {
                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'

                    },

                    body:
                        JSON.stringify(
                            {
                                name:
                                    name
                            }
                        )
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Otomasyon oluşturulamadı.HTTP ${ response.status } `
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

        if (
            submitButton
        ) {

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


    // Burada ileride otomasyon detay sayfasına
    // veya düzenleme ekranına yönlendirme yapılabilir.


    // Örnek:
    // window.location.href =
    //     `OtomasyonDetay.html ? id = ${ encodeURIComponent(id) } `;

}


// =====================================================
// MODAL KAPAT
// =====================================================

function closeAutomationModal() {

    if (
        !automationModal
    ) {

        return;
    }


    automationModal.classList.remove(
        'active'
    );


    automationModal.setAttribute(
        'aria-hidden',
        'true'
    );


    // modal.js farklı bir yapı kullanıyorsa
    // kendi event sistemine müdahale etmemek için
    // sadece temel state temizlenir.

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