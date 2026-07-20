// =====================================================
// HOMEOS OTOMASYONLAR.JS
// SADECE OTOMASYON SİSTEMİ
// =====================================================


// =====================================================
// API AYARLARI
// =====================================================

const AUTOMATION_API = '/api/automations';


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        console.log(
            '[AUTOMATION] Otomasyonlar sistemi başlatılıyor.'
        );


        initializeAutomations();

    }
);


// =====================================================
// OTOMASYON SİSTEMİNİ BAŞLAT
// =====================================================

async function initializeAutomations() {

    try {

        await loadAutomations();

        setupAutomationEvents();

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Başlatma hatası:',
            error
        );

    }
}


// =====================================================
// OTOMASYONLARI GETİR
// =====================================================

async function loadAutomations() {

    try {

        const response =
            await fetch(
                AUTOMATION_API
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Otomasyonlar alınamadı. HTTP ${response.status}`
            );
        }


        const automations =
            await response.json();


        renderAutomations(
            automations
        );

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Listeleme hatası:',
            error
        );

    }
}


// =====================================================
// OTOMASYONLARI UI'A BAS
// =====================================================

function renderAutomations(
    automations
) {

    const container =
        document.getElementById(
            'automationsContainer'
        );


    if (
        !container
    ) {

        return;
    }


    container.innerHTML =
        '';


    automations.forEach(
        automation => {

            const element =
                document.createElement(
                    'div'
                );


            element.className =
                'automation-card';


            element.dataset.id =
                automation.id;


            element.innerHTML = `

                <div class="automation-info">

                    <h3>
                        ${escapeAutomationHtml(
                            automation.name
                        )}
                    </h3>

                    <p>
                        ${escapeAutomationHtml(
                            automation.description || ''
                        )}
                    </p>

                </div>


                <div class="automation-actions">

                    <button
                        type="button"
                        data-action="toggle"
                        data-id="${automation.id}"
                    >
                        ${
                            automation.isActive
                                ? 'Pasifleştir'
                                : 'Aktifleştir'
                        }
                    </button>


                    <button
                        type="button"
                        data-action="edit"
                        data-id="${automation.id}"
                    >
                        Düzenle
                    </button>


                    <button
                        type="button"
                        data-action="delete"
                        data-id="${automation.id}"
                    >
                        Sil
                    </button>

                </div>
            `;


            container.appendChild(
                element
            );
        }
    );
}


// =====================================================
// OTOMASYON EVENTLERİ
// =====================================================

function setupAutomationEvents() {

    const container =
        document.getElementById(
            'automationsContainer'
        );


    if (
        !container
    ) {

        return;
    }


    container.addEventListener(
        'click',
        async event => {

            const button =
                event.target.closest(
                    '[data-action]'
                );


            if (
                !button
            ) {

                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            switch (
                action
            ) {

                case 'toggle':

                    await toggleAutomation(
                        id
                    );

                    break;


                case 'edit':

                    editAutomation(
                        id
                    );

                    break;


                case 'delete':

                    await deleteAutomation(
                        id
                    );

                    break;
            }

        }
    );
}


// =====================================================
// OTOMASYON AKTİF / PASİF
// =====================================================

async function toggleAutomation(
    id
) {

    try {

        const response =
            await fetch(
                `${AUTOMATION_API}/${id}/toggle`,
                {
                    method:
                        'PATCH'
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                'Otomasyon durumu değiştirilemedi.'
            );
        }


        await loadAutomations();

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Toggle hatası:',
            error
        );

    }
}


// =====================================================
// OTOMASYON SİL
// =====================================================

async function deleteAutomation(
    id
) {

    const confirmed =
        confirm(
            'Bu otomasyonu silmek istediğinize emin misiniz?'
        );


    if (
        !confirmed
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `${AUTOMATION_API}/${id}`,
                {
                    method:
                        'DELETE'
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                'Otomasyon silinemedi.'
            );
        }


        await loadAutomations();

    }
    catch (error) {

        console.error(
            '[AUTOMATION] Silme hatası:',
            error
        );

    }
}


// =====================================================
// OTOMASYON DÜZENLE
// =====================================================

function editAutomation(
    id
) {

    console.log(
        '[AUTOMATION] Düzenleme:',
        id
    );


    // Buraya mevcut düzenleme modalı
    // veya form sistemi gelecek.
}


// =====================================================
// HTML GÜVENLİĞİ
// =====================================================

function escapeAutomationHtml(
    value
) {

    return String(
        value
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